"""
RAG (Retrieval-Augmented Generation) Engine for FYP Chatbot

Provides semantic search over the FYP knowledge base using FAISS
and generates context-aware responses using either a remote
OpenAI-compatible LLM (Groq / OpenAI / OpenRouter / etc.) or a
local Flan-T5 model as a fallback.

Components:
    1. Retriever: FAISS index + sentence-transformers for semantic search
    2. Generator: remote OpenAI-compatible LLM (preferred) or local Flan-T5
    3. Intent classifier: keyword-based routing for fallback responses
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# ============================================================================
# Intent Classification
# ============================================================================

INTENT_PATTERNS = {
    "proposal": {
        "keywords": ["proposal", "submit", "write proposal", "proposal writing",
                      "problem statement", "objectives", "scope"],
        "response_prefix": "Regarding FYP proposals",
    },
    "meeting_log": {
        "keywords": ["meeting", "log", "supervision", "logbook", "meeting log",
                      "supervisor meeting", "supervision log"],
        "response_prefix": "About meeting logs and supervision",
    },
    "report": {
        "keywords": ["report", "writing", "document", "chapter", "format",
                      "citation", "reference", "academic writing", "thesis"],
        "response_prefix": "About FYP report writing",
    },
    "timeline": {
        "keywords": ["timeline", "schedule", "plan", "deadline", "milestone",
                      "gantt", "time management", "project plan"],
        "response_prefix": "About FYP timelines and planning",
    },
    "methodology": {
        "keywords": ["methodology", "method", "agile", "waterfall",
                      "research method", "approach", "sdlc", "testing"],
        "response_prefix": "About research methodology",
    },
    "technology": {
        "keywords": ["technology", "tool", "programming", "language", "framework",
                      "react", "python", "java", "database", "stack"],
        "response_prefix": "About technology choices",
    },
    "presentation": {
        "keywords": ["presentation", "viva", "demo", "slides", "defense",
                      "present", "oral"],
        "response_prefix": "About FYP presentations",
    },
    "supervisor": {
        "keywords": ["supervisor", "choose supervisor", "find supervisor",
                      "supervisor selection", "matching"],
        "response_prefix": "About supervisor selection",
    },
    "literature": {
        "keywords": ["literature", "review", "paper", "research paper",
                      "related work", "journal", "citation"],
        "response_prefix": "About literature review",
    },
    "general": {
        "keywords": ["fyp", "final year project", "help", "what is", "how to"],
        "response_prefix": "About FYP",
    },
}


def classify_intent(message: str) -> Tuple[str, str]:
    """Classify user message intent based on keyword matching."""
    message_lower = message.lower()

    best_intent = "general"
    best_count = 0

    for intent, config in INTENT_PATTERNS.items():
        count = sum(1 for kw in config["keywords"] if kw in message_lower)
        if count > best_count:
            best_count = count
            best_intent = intent

    prefix = INTENT_PATTERNS[best_intent]["response_prefix"]
    return best_intent, prefix


# ============================================================================
# RAG Engine
# ============================================================================

class RAGEngine:
    """
    Retrieval-Augmented Generation engine for FYP chatbot.

    Uses FAISS for vector similarity search, a remote OpenAI-compatible LLM
    (preferred) or a local Flan-T5 model for response generation.
    """

    def __init__(
        self,
        vector_store_dir: str = "vector_store",
        embed_model_name: str = "all-MiniLM-L6-v2",
        gen_model_name: str = "google/flan-t5-small",
        chat_model_name: Optional[str] = None,
        use_local_gen: bool = True,
    ):
        self.vector_store_dir = Path(vector_store_dir)
        self.embed_model = None
        self.index = None
        self.chunks = None
        self.gen_model = None
        self.gen_tokenizer = None
        self.chat_model_name = chat_model_name
        self.use_local_gen = use_local_gen

        # Load embedding model (shared with index building)
        logger.info(f"Loading embedding model: {embed_model_name}")
        self.embed_model = SentenceTransformer(embed_model_name)

        # Load FAISS index
        self._load_index()

        # Load local generation model (Flan-T5)
        if use_local_gen:
            self._load_generator(gen_model_name)

    def _load_index(self):
        """Load the FAISS index and chunk metadata."""
        index_path = self.vector_store_dir / "index.faiss"
        chunks_path = self.vector_store_dir / "chunks.json"

        if index_path.exists() and chunks_path.exists():
            try:
                import faiss
                self.index = faiss.read_index(str(index_path))
                with open(chunks_path, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
                logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors")
            except Exception as e:
                logger.warning(f"Failed to load FAISS index: {e}")
                self.index = None
                self.chunks = None
        else:
            logger.warning(
                f"FAISS index not found at {index_path}. "
                "Run build_knowledge_base.py first."
            )

    def _load_generator(self, model_name: str):
        """Load the local text generation model (Flan-T5)."""
        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            import torch

            logger.info(f"Loading generation model: {model_name}")
            self.gen_tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.gen_model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            self.gen_model.eval()

            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.gen_model.to(device)
            logger.info(f"Generation model loaded on {device}")
        except Exception as e:
            logger.warning(f"Failed to load generation model: {e}")
            self.gen_model = None
            self.gen_tokenizer = None

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Retrieve the top-k most relevant chunks for a query.
        """
        if self.index is None or self.chunks is None:
            return []

        try:
            import faiss

            # Encode query
            query_embedding = self.embed_model.encode([query])
            query_embedding = np.array(query_embedding, dtype=np.float32)
            faiss.normalize_L2(query_embedding)

            # Search
            distances, indices = self.index.search(query_embedding, min(top_k, self.index.ntotal))

            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx >= 0 and idx < len(self.chunks):
                    chunk = self.chunks[idx].copy()
                    chunk["relevance_score"] = float(dist)
                    results.append(chunk)

            return results
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            return []

    def generate_local(self, query: str, context: str, max_length: int = 512) -> str:
        """Generate a response using the local Flan-T5 model."""
        if self.gen_model is None or self.gen_tokenizer is None:
            return ""

        try:
            import torch

            prompt = (
                f"You are a helpful FYP (Final Year Project) assistant. "
                f"Based on the following information, answer the student's question.\n\n"
                f"Information:\n{context}\n\n"
                f"Question: {query}\n\n"
                f"Answer:"
            )

            device = next(self.gen_model.parameters()).device
            inputs = self.gen_tokenizer(
                prompt,
                max_length=512,
                truncation=True,
                return_tensors="pt",
            ).to(device)

            with torch.no_grad():
                outputs = self.gen_model.generate(
                    **inputs,
                    max_new_tokens=max_length,
                    num_beams=4,
                    early_stopping=True,
                    do_sample=False,
                    no_repeat_ngram_size=3,
                )

            response = self.gen_tokenizer.decode(outputs[0], skip_special_tokens=True)
            return response.strip()
        except Exception as e:
            logger.warning(f"Local generation failed: {e}")
            return ""

    def generate_remote(self, query: str, context: str, llm_client,
                        session_history: List[Dict] = None) -> str:
        """
        Generate a response using a remote OpenAI-compatible LLM
        (Groq, OpenAI, OpenRouter, etc.) with RAG context.
        """
        try:
            model = self.chat_model_name or "gpt-3.5-turbo"

            system_prompt = (
                "You are an intelligent FYP (Final Year Project) assistant for MMU FCI students. "
                "Use the provided context information to answer the student's question accurately. "
                "Be helpful, encouraging, and professional. Provide specific, actionable advice. "
                "If the context doesn't cover the question fully, say so and provide general guidance."
            )

            messages = [{"role": "system", "content": system_prompt}]

            if context:
                messages.append({
                    "role": "system",
                    "content": f"Relevant FYP information:\n{context}",
                })

            if session_history:
                for msg in session_history[-10:]:
                    role = "user" if msg.get("sender") == "USER" else "assistant"
                    messages.append({"role": role, "content": msg.get("content", "")})

            messages.append({"role": "user", "content": query})

            response = llm_client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1000,
                temperature=0.7,
            )

            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Remote LLM generation failed: {e}")
            return ""

    def answer(
        self,
        query: str,
        session_history: List[Dict] = None,
        llm_client=None,
        top_k: int = 5,
        extra_context: Optional[str] = None,
    ) -> Dict:
        """
        Full RAG pipeline: retrieve context, generate response.

        Returns:
            dict with 'reply', 'references', 'confidence', 'sources'
        """
        # 1. Classify intent
        intent, intent_prefix = classify_intent(query)
        logger.info(f"Classified intent: {intent}")

        # 2. Retrieve relevant context
        retrieved_chunks = self.retrieve(query, top_k=top_k)

        # Build context string from retrieved chunks
        context_parts = []
        sources = []
        for chunk in retrieved_chunks:
            context_parts.append(chunk["text"])
            source = {
                "title": chunk.get("title", ""),
                "filename": chunk.get("source", ""),
                "relevance": round(chunk.get("relevance_score", 0), 3),
            }
            if source not in sources:
                sources.append(source)

        if extra_context:
            context_parts.insert(0, str(extra_context))

        context = "\n\n---\n\n".join(context_parts) if context_parts else ""

        # 3. Generate response
        reply = ""
        confidence = 0.5

        # Try remote LLM first (higher quality) if configured
        if llm_client:
            reply = self.generate_remote(query, context, llm_client, session_history)
            if reply:
                confidence = 0.85
                logger.info(f"Response generated using remote LLM ({self.chat_model_name})")

        # Fall back to local Flan-T5
        if not reply and self.use_local_gen:
            reply = self.generate_local(query, context)
            if reply:
                confidence = 0.65
                logger.info("Response generated using local Flan-T5")

        # Fall back to context-based extractive response
        if not reply and context:
            reply = self._extractive_fallback(query, context, intent_prefix)
            confidence = 0.50
            logger.info("Response generated using extractive fallback")

        # Last resort: static response
        if not reply:
            reply = self._static_fallback(query, intent)
            confidence = 0.30
            logger.info("Response generated using static fallback")

        # 4. Extract references
        references = self._extract_references(reply, sources)

        return {
            "reply": reply,
            "references": references,
            "confidence": round(confidence, 2),
            "intent": intent,
            "sources_used": len(sources),
        }

    def _extractive_fallback(self, query: str, context: str, intent_prefix: str) -> str:
        """Build a response by extracting the most relevant context."""
        # Take the first 2-3 relevant chunks and format them
        paragraphs = context.split("\n\n---\n\n")[:3]
        formatted = "\n\n".join(paragraphs)

        if len(formatted) > 1500:
            formatted = formatted[:1500] + "..."

        return (
            f"{intent_prefix}, here's what I found:\n\n"
            f"{formatted}\n\n"
            "Would you like more specific information about any of these points?"
        )

    def _static_fallback(self, query: str, intent: str) -> str:
        """Provide a static helpful response when no other method works."""
        responses = {
            "proposal": (
                "An FYP proposal typically includes: title, problem statement, objectives, "
                "scope, literature review summary, proposed methodology, expected outcomes, "
                "and a project timeline. Would you like guidance on any specific section?"
            ),
            "meeting_log": (
                "Meeting logs document your supervision sessions. They should include: "
                "discussion summary, work completed, upcoming tasks, problems encountered, "
                "and signatures from both student and supervisor."
            ),
            "report": (
                "The FYP report follows a standard academic structure: Introduction, "
                "Literature Review, Methodology, Implementation, Testing & Evaluation, "
                "and Conclusion. Each chapter should be detailed and well-referenced."
            ),
            "timeline": (
                "A typical FYP spans 2 semesters. FYP1 covers research, proposal, and design. "
                "FYP2 covers implementation, testing, and final documentation. "
                "Create a Gantt chart with specific milestones."
            ),
            "general": (
                "I can help you with various FYP topics including:\n\n"
                "- **Proposal writing** and submission guidelines\n"
                "- **Meeting logs** and supervision documentation\n"
                "- **Project timeline** and milestone planning\n"
                "- **Report writing** and formatting\n"
                "- **Research methodology** guidance\n"
                "- **Technology** selection advice\n"
                "- **Presentation** preparation\n\n"
                "What would you like to know more about?"
            ),
        }
        return responses.get(intent, responses["general"])

    def _extract_references(self, reply: str, sources: List[Dict]) -> List[Dict]:
        """Extract references from the response and retrieved sources."""
        references = []
        seen_titles = set()

        # Map source filename → frontend reference type
        def _classify(filename: str, title: str) -> str:
            name = (filename or "").lower()
            if "faq" in name or "faq" in title.lower():
                return "FAQ"
            if "deadline" in name or "timeline" in name or "schedule" in name:
                return "DEADLINE"
            if "handbook" in name or "guide" in name or "procedure" in name or "overview" in name:
                return "HANDBOOK"
            return "RESOURCE"

        for source in sources[:5]:
            title = source.get("title", "")
            filename = source.get("filename", "")
            if title and title not in seen_titles:
                references.append({
                    "title": title,
                    "type": _classify(filename, title),
                })
                seen_titles.add(title)

        return references[:5]

    @property
    def is_ready(self) -> bool:
        """Check if the RAG engine is ready (index loaded)."""
        return self.index is not None and self.chunks is not None
