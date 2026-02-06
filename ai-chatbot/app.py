"""
AI Chatbot Service - RAG-Powered FYP Assistant

Uses a Retrieval-Augmented Generation (RAG) pipeline to answer FYP-related
questions. Retrieves relevant context from a FAISS vector store of FYP
knowledge documents and generates responses using either a local Flan-T5
model or OpenAI GPT.

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
# Optional OpenAI client for enhanced generation
# ============================================================================
openai_client = None
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized for enhanced generation")
    except ImportError:
        logger.warning("openai package not installed; using local generation only")

# ============================================================================
# Initialize RAG Engine
# ============================================================================
logger.info("Initializing RAG engine...")

# Check if local generation model should be loaded
USE_LOCAL_GEN = os.environ.get("USE_LOCAL_GEN", "true").lower() == "true"

rag_engine = RAGEngine(
    vector_store_dir="vector_store",
    embed_model_name="all-MiniLM-L6-v2",
    gen_model_name="google/flan-t5-small",
    use_local_gen=USE_LOCAL_GEN,
)

logger.info(f"RAG engine initialized (index_ready={rag_engine.is_ready}, "
            f"local_gen={'enabled' if USE_LOCAL_GEN else 'disabled'})")


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
        "openai_available": openai_client is not None,
    })


@app.route("/ai/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        message = data.get("message", "")
        session_history = data.get("sessionHistory", [])
        context = data.get("context")

        if not message:
            return jsonify({"error": "message is required"}), 400

        # Use RAG engine for response generation
        result = rag_engine.answer(
            query=message,
            session_history=session_history,
            openai_client=openai_client,
            top_k=5,
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
    app.run(host="0.0.0.0", port=port, debug=True)
