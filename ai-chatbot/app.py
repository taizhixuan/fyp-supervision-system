"""
AI Chatbot Service - RAG-Powered FYP Assistant

Uses a Retrieval-Augmented Generation (RAG) pipeline to answer FYP-related
questions. Retrieves relevant context from a FAISS vector store of FYP
knowledge documents and generates responses with an OpenAI-compatible LLM: a local Ollama model
(llama3.2, gemma, ...) or a cloud API (Groq / OpenAI / custom). Flan-T5 is
an opt-in offline fallback.

Endpoints:
    GET  /ai/health   - Health check
    POST /ai/chat     - Chat with the FYP assistant
    GET/PUT /ai/llm-config, POST /ai/llm-test, GET /ai/llm-models - LLM admin
"""

import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from rag_engine import RAGEngine
from llm_provider import LLMProvider, clean_reply, register_llm_routes

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# LLM provider (Ollama local / Groq / OpenAI / custom, all OpenAI-compatible)
# ============================================================================
# Startup choice comes from env (LLM_PROVIDER, OLLAMA_*, GROQ_API_KEY, ...);
# the admin can switch it at runtime via PUT /ai/llm-config. See llm_provider.py.
llm = LLMProvider()


# ============================================================================
# Initialize RAG Engine
# ============================================================================
logger.info("Initializing RAG engine...")

# Flan-T5 local generator is OFF by default — it's the long-standing quality
# bottleneck. Set USE_LOCAL_GEN=true only for offline demos where no remote
# LLM key is available; otherwise the extractive fallback is more honest.
USE_LOCAL_GEN = os.environ.get("USE_LOCAL_GEN", "false").lower() == "true"

rag_engine = RAGEngine(
    vector_store_dir="vector_store",
    embed_model_name="all-MiniLM-L6-v2",
    gen_model_name="google/flan-t5-small",
    chat_model_name=llm.model,
    use_local_gen=USE_LOCAL_GEN,
)

logger.info(
    f"RAG engine initialized (index_ready={rag_engine.is_ready}, "
    f"local_gen={'enabled' if USE_LOCAL_GEN else 'disabled'}, "
    f"llm={llm.provider}/{llm.model} ready={llm.snapshot().configured})"
)


def _sync_rag_model(provider: LLMProvider):
    rag_engine.chat_model_name = provider.model


register_llm_routes(app, llm, on_change=_sync_rag_model)


# ============================================================================
# API Endpoints
# ============================================================================

@app.route("/ai/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "ai-chatbot",
        "rag_ready": rag_engine.is_ready,
        "local_gen_loaded": rag_engine.gen_model is not None,
        "remote_llm": llm.describe(),
    })


@app.route("/ai/chat", methods=["POST"])
def chat():
    try:
        # silent=True so a non-JSON body doesn't 500 — we'd rather return 400.
        data = request.get_json(silent=True) or {}

        message = data.get("message", "")
        session_history = data.get("sessionHistory", [])
        extra_context = data.get("context")

        # Reject non-string message up-front; without this it propagates into
        # the tokenizer and crashes with an opaque 500.
        if not isinstance(message, str):
            return jsonify({"error": "message must be a string"}), 400
        if not message.strip():
            return jsonify({"error": "message is required"}), 400

        # Defensive: sessionHistory must be a list (the RAG engine iterates it).
        if not isinstance(session_history, list):
            session_history = []

        state = llm.snapshot()
        result = rag_engine.answer(
            query=message,
            session_history=session_history,
            llm_client=state.client,
            chat_model=state.model,
            top_k=5,
            extra_context=extra_context,
        )

        return jsonify({
            "reply": result["reply"],
            "references": result["references"],
            "confidence": result["confidence"],
        })

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/ai/summarize", methods=["POST"])
def summarize():
    """
    Summarize a closed chat session into ~150 words capturing recurring
    themes, open concerns, and stated preferences. Used by the backend's
    cross-session memory feature: when a student clicks "New chat", the
    just-ended session is summarized and persisted so the next session's
    context includes long-term memory.

    Body:
      {
        "messages": [ { "sender": "user" | "assistant", "content": "..." } ],
        "previousSummary": "<optional prior memory to fold into the new one>"
      }
    """
    try:
        data = request.get_json(silent=True) or {}
        messages = data.get("messages", [])
        previous_summary = (data.get("previousSummary") or "").strip()

        if not isinstance(messages, list) or len(messages) < 2:
            return jsonify({"summary": previous_summary or ""}), 200

        # Build a compact transcript (cap to last 30 exchanges to avoid token bloat).
        recent = messages[-30:]
        transcript_lines = []
        for m in recent:
            sender = str(m.get("sender", "")).lower()
            content = str(m.get("content", "")).strip()
            if not content:
                continue
            role = "Student" if sender == "user" else "Assistant"
            transcript_lines.append(f"{role}: {content}")
        transcript = "\n".join(transcript_lines)

        if not transcript:
            return jsonify({"summary": previous_summary or ""}), 200

        # If no remote LLM is configured, return previous_summary unchanged so
        # we don't blow away long-term memory with a worse heuristic.
        state = llm.snapshot()
        if state.client is None:
            return jsonify({"summary": previous_summary or ""}), 200

        system_prompt = (
            "You are condensing a student's chat with the FYP Assistant into a "
            "long-term memory snippet (about 150 words). Keep what's useful "
            "across future sessions: the student's project topic, recurring "
            "questions, stated preferences (tone/length/language), unresolved "
            "concerns, and decisions made. Drop generic chit-chat and anything "
            "ephemeral. Write as a third-person profile note, not a transcript."
        )
        user_prompt = (
            (f"Previous memory:\n{previous_summary}\n\n" if previous_summary else "")
            + f"New conversation:\n{transcript}\n\n"
            "Update the memory to incorporate the new conversation. Output only the "
            "memory text, no preamble."
        )

        try:
            resp = state.client.chat.completions.create(
                model=state.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=400,
            )
            summary = clean_reply(resp.choices[0].message.content)
        except Exception as e:
            logger.warning(f"Summarize LLM call failed: {e}")
            return jsonify({"summary": previous_summary or ""}), 200

        return jsonify({"summary": summary}), 200

    except Exception as e:
        logger.error(f"Summarize error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/ai/summarize-meeting", methods=["POST"])
def summarize_meeting():
    """
    Turn a supervisor's raw meeting notes into the "work discussed" paragraph of
    the student's FCI meeting-log draft. Returns {"summary": ""} when no remote
    LLM is configured; the backend then keeps the raw notes.

    Body: { "title": "...", "agenda": "...", "notes": "...", "actionItems": ["..."] }
    """
    try:
        data = request.get_json(silent=True) or {}
        notes = (data.get("notes") or "").strip()
        if not notes:
            return jsonify({"summary": ""}), 200

        state = llm.snapshot()
        if state.client is None:
            return jsonify({"summary": ""}), 200

        title = (data.get("title") or "").strip()
        agenda = (data.get("agenda") or "").strip()
        items = [str(i).strip() for i in (data.get("actionItems") or []) if str(i).strip()]

        system_prompt = (
            "You write the discussion section of a university final-year-project "
            "supervision meeting log. Rewrite the supervisor's rough notes into a "
            "clear, factual paragraph in third person past tense, e.g. 'The student "
            "presented ... The supervisor advised ...'. Keep every concrete decision, "
            "figure and name from the notes. Use only what the notes say: never add "
            "claims about what was not discussed or not decided, and no filler. Short "
            "notes give a short paragraph (at most 120 words). Do not list the action "
            "items again."
        )
        user_prompt = (
            (f"Meeting title: {title}\n" if title else "")
            + (f"Agenda:\n{agenda[:1500]}\n\n" if agenda else "")
            + f"Supervisor notes:\n{notes[:4000]}\n\n"
            + ("Action items (already recorded separately):\n- " + "\n- ".join(items[:20]) + "\n\n" if items else "")
            + "Output only the paragraph, no preamble."
        )

        try:
            resp = state.client.chat.completions.create(
                model=state.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=350,
            )
            summary = clean_reply(resp.choices[0].message.content)
        except Exception as e:
            logger.warning(f"Meeting summary LLM call failed: {e}")
            return jsonify({"summary": ""}), 200

        return jsonify({"summary": summary}), 200

    except Exception as e:
        logger.error(f"Meeting summary error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5003))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
