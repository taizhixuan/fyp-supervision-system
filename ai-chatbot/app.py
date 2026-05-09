"""
AI Chatbot Service - RAG-Powered FYP Assistant

Uses a Retrieval-Augmented Generation (RAG) pipeline to answer FYP-related
questions. Retrieves relevant context from a FAISS vector store of FYP
knowledge documents and generates responses using either a remote
OpenAI-compatible LLM (Groq / OpenAI / OpenRouter / etc.) or a local
Flan-T5 model.

Endpoints:
    GET  /ai/health   - Health check
    POST /ai/chat     - Chat with the FYP assistant
"""

import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from rag_engine import RAGEngine

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Remote LLM client (OpenAI-compatible: Groq / OpenAI / OpenRouter / etc.)
# ============================================================================
# Provider precedence — first match wins:
#   1. LLM_API_KEY (+ LLM_BASE_URL, LLM_MODEL)   - generic
#   2. GROQ_API_KEY                              - Groq defaults
#   3. OPENAI_API_KEY                            - OpenAI defaults
#
# LLM_BASE_URL / LLM_MODEL override the per-provider defaults when set.

GROQ_DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"
OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1"
OPENAI_DEFAULT_MODEL = "gpt-3.5-turbo"


def _resolve_llm_config():
    """Return (api_key, base_url, model, provider) — all None if unconfigured."""
    api_key = os.environ.get("LLM_API_KEY")
    if api_key:
        return (
            api_key,
            os.environ.get("LLM_BASE_URL", GROQ_DEFAULT_BASE_URL),
            os.environ.get("LLM_MODEL", GROQ_DEFAULT_MODEL),
            "custom",
        )

    api_key = os.environ.get("GROQ_API_KEY")
    if api_key:
        return (
            api_key,
            os.environ.get("LLM_BASE_URL", GROQ_DEFAULT_BASE_URL),
            os.environ.get("LLM_MODEL", GROQ_DEFAULT_MODEL),
            "groq",
        )

    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        return (
            api_key,
            os.environ.get("LLM_BASE_URL", OPENAI_DEFAULT_BASE_URL),
            os.environ.get("LLM_MODEL", OPENAI_DEFAULT_MODEL),
            "openai",
        )

    return None, None, None, None


llm_api_key, llm_base_url, llm_model, llm_provider = _resolve_llm_config()
llm_client = None
if llm_api_key:
    try:
        from openai import OpenAI
        llm_client = OpenAI(api_key=llm_api_key, base_url=llm_base_url)
        logger.info(
            f"Remote LLM initialized: provider={llm_provider} "
            f"model={llm_model} base_url={llm_base_url}"
        )
    except ImportError:
        logger.warning("openai package not installed; remote LLM disabled")
        llm_client = None
else:
    logger.info(
        "No remote LLM configured "
        "(set GROQ_API_KEY, OPENAI_API_KEY, or LLM_API_KEY) — "
        "falling back to local Flan-T5 / extractive only"
    )

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
    chat_model_name=llm_model,
    use_local_gen=USE_LOCAL_GEN,
)

logger.info(
    f"RAG engine initialized (index_ready={rag_engine.is_ready}, "
    f"local_gen={'enabled' if USE_LOCAL_GEN else 'disabled'}, "
    f"remote_llm={'enabled' if llm_client else 'disabled'})"
)


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
        "remote_llm": {
            "configured": llm_client is not None,
            "provider": llm_provider,
            "model": llm_model if llm_client else None,
        },
    })


@app.route("/ai/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        message = data.get("message", "")
        session_history = data.get("sessionHistory", [])
        extra_context = data.get("context")

        if not message:
            return jsonify({"error": "message is required"}), 400

        result = rag_engine.answer(
            query=message,
            session_history=session_history,
            llm_client=llm_client,
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


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5003))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
