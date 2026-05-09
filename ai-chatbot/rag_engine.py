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
                      "research method", "approach", "sdlc"],
        "response_prefix": "About research methodology",
    },
    "testing": {
        "keywords": ["testing", "test plan", "test case", "unit test",
                      "integration test", "user acceptance", "uat", "evaluation",
                      "evaluate", "verification", "validation", "qa"],
        "response_prefix": "About testing and evaluation",
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
    "procedure": {
        "keywords": ["procedure", "policy", "regulation", "rule", "guideline",
                      "mmu", "fci", "faculty"],
        "response_prefix": "About MMU FCI FYP procedures",
    },
    "general": {
        "keywords": ["fyp", "final year project", "help", "what is", "how to"],
        "response_prefix": "About FYP",
    },
}

# Below this top-1 cosine score the query is considered out of scope.
# Tuned for `all-MiniLM-L6-v2` embeddings + the FYP knowledge base — values
# below ~0.30 typically mean no chunk is genuinely relevant.
OUT_OF_SCOPE_THRESHOLD = 0.30

OUT_OF_SCOPE_REPLY = (
    "That question doesn't seem to match anything in the FYP knowledge base. "
    "I can help with: **proposals**, **meeting logs and supervision**, "
    "**report writing**, **timelines**, **methodology**, **testing & evaluation**, "
    "**supervisor selection**, **presentations**, **literature review**, "
    "**MMU FCI procedures**, and **technology choices**. "
    "Try rephrasing your question, or pick one of those topics."
)

# Confidence multipliers per generator path. Final confidence is
# `top1_cosine * multiplier`, clipped to [0, 1]. This replaces the old
# fixed-constant approach which lied about how grounded the answer was.
GENERATOR_CONFIDENCE_MULTIPLIER = {
    "remote": 1.00,        # Real LLM can synthesise from context
    "local_flan_t5": 0.70, # Small model, often paraphrases shallowly
    "extractive": 0.55,    # No synthesis — just formatted retrieval
}


def classify_intent(message: str) -> Tuple[str, str]:
    """
    Classify user message intent via keyword matching, weighted by keyword
    length so specific phrases beat generic ones — e.g. "test plan" should
    win over "plan" when both intents would otherwise tie.
    """
    message_lower = message.lower()

    best_intent = "general"
    best_score = 0

    for intent, config in INTENT_PATTERNS.items():
        score = sum(len(kw) for kw in config["keywords"] if kw in message_lower)
        if score > best_score:
            best_score = score
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
        use_local_gen: bool = False,
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

    def _trim_context_to_budget(
        self,
        context_chunks: List[str],
        budget_tokens: int,
    ) -> str:
        """
        Concatenate context chunks until token budget is exhausted.

        Uses the loaded gen_tokenizer to count tokens precisely, so chunks
        either contribute fully or are dropped — no silent mid-chunk truncation.
        """
        if not context_chunks or self.gen_tokenizer is None or budget_tokens <= 0:
            return ""

        kept_parts = []
        used = 0
        sep = "\n\n---\n\n"
        sep_tokens = len(self.gen_tokenizer.encode(sep, add_special_tokens=False))

        for chunk in context_chunks:
            chunk_tokens = len(self.gen_tokenizer.encode(chunk, add_special_tokens=False))
            extra = chunk_tokens + (sep_tokens if kept_parts else 0)
            if used + extra > budget_tokens:
                break
            kept_parts.append(chunk)
            used += extra

        return sep.join(kept_parts)

    def generate_local(
        self,
        query: str,
        context_chunks: List[str],
        session_history: List[Dict] = None,
        max_new_tokens: int = 256,
    ) -> str:
        """
        Generate a response using the local Flan-T5 model.

        Args:
            query: The current user question.
            context_chunks: Retrieved KB chunks (highest relevance first).
            session_history: Prior turns (last few are prepended for coherence).
            max_new_tokens: Generation budget.

        Token-aware: trims context to fit Flan-T5's 512-token input window so
        chunks either contribute fully or are dropped — no silent truncation.
        """
        if self.gen_model is None or self.gen_tokenizer is None:
            return ""

        try:
            import torch

            # Build the conversation prefix (last 3 turns max).
            history_text = ""
            if session_history:
                turns = []
                for msg in session_history[-6:]:  # last 6 messages = ~3 turns
                    sender = (msg.get("sender") or "").upper()
                    role = "User" if sender == "USER" else "Assistant"
                    content = (msg.get("content") or "").strip()
                    if content:
                        turns.append(f"{role}: {content}")
                if turns:
                    history_text = "Previous conversation:\n" + "\n".join(turns) + "\n\n"

            # Skeleton without the context — so we can compute remaining budget.
            skeleton_pre = (
                "You are a helpful FYP (Final Year Project) assistant for MMU FCI "
                "students. Answer the question using the information below.\n\n"
                f"{history_text}"
                "Information:\n"
            )
            skeleton_post = f"\n\nQuestion: {query}\n\nAnswer:"

            tok = self.gen_tokenizer
            input_budget = 512  # Flan-T5 max input length
            buffer = 8          # safety for special tokens

            used = (
                len(tok.encode(skeleton_pre, add_special_tokens=False))
                + len(tok.encode(skeleton_post, add_special_tokens=False))
                + buffer
            )
            context_budget = max(0, input_budget - used)

            context = self._trim_context_to_budget(context_chunks, context_budget)
            if not context:
                # Even one chunk doesn't fit; fall back to the chunk text itself
                # (will be truncated by tokenizer, but we tried our best).
                context = context_chunks[0] if context_chunks else ""

            prompt = skeleton_pre + context + skeleton_post

            device = next(self.gen_model.parameters()).device
            inputs = tok(
                prompt,
                max_length=input_budget,
                truncation=True,
                return_tensors="pt",
            ).to(device)

            with torch.no_grad():
                outputs = self.gen_model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    num_beams=4,
                    early_stopping=True,
                    do_sample=False,
                    no_repeat_ngram_size=3,
                )

            response = tok.decode(outputs[0], skip_special_tokens=True)
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
        Full RAG pipeline: retrieve, threshold, generate.

        Returns:
            dict with 'reply', 'references', 'confidence', 'intent',
            'sources_used', 'generator'.
        """
        intent, intent_prefix = classify_intent(query)
        logger.info(f"Classified intent: {intent}")

        retrieved_chunks = self.retrieve(query, top_k=top_k)

        # Top-1 cosine score drives both the out-of-scope decision and
        # the final confidence. Empty retrieval => 0.0.
        top1_score = (
            float(retrieved_chunks[0].get("relevance_score", 0.0))
            if retrieved_chunks else 0.0
        )

        # Out-of-scope short-circuit: don't waste an LLM call on irrelevant
        # queries and don't fabricate references for them.
        if top1_score < OUT_OF_SCOPE_THRESHOLD:
            logger.info(
                f"Out of scope: top1_score={top1_score:.3f} "
                f"< threshold {OUT_OF_SCOPE_THRESHOLD}"
            )
            return {
                "reply": OUT_OF_SCOPE_REPLY,
                "references": [],
                "confidence": 0.0,
                "intent": intent,
                "sources_used": 0,
                "generator": "out_of_scope",
                "top_score": round(top1_score, 3),
            }

        # Build context (chunks ordered by relevance, dedup sources).
        context_chunks = [c["text"] for c in retrieved_chunks]
        sources = []
        seen_source_keys = set()
        for chunk in retrieved_chunks:
            key = (chunk.get("source", ""), chunk.get("title", ""))
            if key in seen_source_keys:
                continue
            seen_source_keys.add(key)
            sources.append({
                "title": chunk.get("title", ""),
                "filename": chunk.get("source", ""),
                "relevance": round(chunk.get("relevance_score", 0), 3),
            })

        # Optional caller-supplied context (e.g. student profile snapshot)
        # is prepended so the generator sees personalised facts first.
        if extra_context:
            context_chunks = [str(extra_context)] + context_chunks

        # Concatenated form for remote LLM (which has a much larger window)
        # and for the extractive fallback. Local generator gets the chunk
        # list and trims by tokens itself.
        context_joined = "\n\n---\n\n".join(context_chunks) if context_chunks else ""

        reply = ""
        generator = None

        # Tier 1: remote OpenAI-compatible LLM (Groq / OpenAI / OpenRouter)
        if llm_client:
            reply = self.generate_remote(
                query, context_joined, llm_client, session_history,
            )
            if reply:
                generator = "remote"
                logger.info(
                    f"Response generated using remote LLM ({self.chat_model_name})"
                )

        # Tier 2: local Flan-T5 (only if explicitly enabled and remote failed)
        if not reply and self.use_local_gen:
            reply = self.generate_local(
                query, context_chunks, session_history,
            )
            if reply:
                generator = "local_flan_t5"
                logger.info("Response generated using local Flan-T5")

        # Tier 3: extractive — format the top chunks honestly. No fabrication.
        if not reply and context_chunks:
            reply = self._extractive_fallback(retrieved_chunks, intent_prefix)
            generator = "extractive"
            logger.info("Response generated using extractive fallback")

        # Tier 4: static intent-keyed reply (only if retrieval returned nothing
        # — practically unreachable now since out-of-scope catches the empty case).
        if not reply:
            reply = self._static_fallback(intent)
            generator = "static"
            logger.info("Response generated using static fallback")

        # Confidence = top1 retrieval score × generator quality multiplier.
        multiplier = GENERATOR_CONFIDENCE_MULTIPLIER.get(generator, 0.30)
        confidence = max(0.0, min(1.0, top1_score * multiplier))

        references = self._extract_references(sources)

        return {
            "reply": reply,
            "references": references,
            "confidence": round(confidence, 2),
            "intent": intent,
            "sources_used": len(sources),
            "generator": generator,
            "top_score": round(top1_score, 3),
        }

    def _extractive_fallback(
        self,
        retrieved_chunks: List[Dict],
        intent_prefix: str,
    ) -> str:
        """
        Build an honest "here's what we found in the KB" response when no
        generator is available. Quotes the top chunks verbatim with their
        source titles so the user can verify everything attributively.
        """
        if not retrieved_chunks:
            return ""

        top = retrieved_chunks[:3]
        blocks = []
        for chunk in top:
            title = chunk.get("title", "FYP Knowledge Base")
            text = chunk.get("text", "").strip()
            if len(text) > 600:
                text = text[:600].rstrip() + "…"
            blocks.append(f"**From: {title}**\n\n{text}")

        body = "\n\n---\n\n".join(blocks)
        return (
            f"{intent_prefix}, here is what the FYP knowledge base contains "
            f"(direct excerpts — not generated):\n\n"
            f"{body}\n\n"
            "Ask a follow-up if you'd like me to focus on any specific part."
        )

    def _static_fallback(self, intent: str) -> str:
        """Static safety-net reply keyed by intent. Only reached when retrieval
        is empty — kept short and honest about being a generic answer."""
        responses = {
            "proposal": (
                "An FYP proposal typically includes: title, problem statement, "
                "objectives, scope, literature review summary, proposed methodology, "
                "expected outcomes, and a timeline. Ask about a specific section "
                "for more detail."
            ),
            "meeting_log": (
                "Meeting logs record each supervision session: discussion summary, "
                "work completed, upcoming tasks, problems encountered, and "
                "signatures from both student and supervisor. MMU FCI requires "
                "at least 6 logs per phase."
            ),
            "report": (
                "The FYP report follows a standard academic structure: Introduction, "
                "Literature Review, Methodology, Implementation, Testing & Evaluation, "
                "and Conclusion. Reference every external source."
            ),
            "timeline": (
                "FYP spans two semesters. FYP1 covers research, proposal, and design; "
                "FYP2 covers implementation, testing, and final documentation. "
                "Plan with a Gantt chart against faculty deadlines."
            ),
            "methodology": (
                "Common research methodologies include Agile (iterative, suited to "
                "software development), Waterfall (linear, predictable scope), and "
                "Design Science. Justify your choice against project constraints."
            ),
            "testing": (
                "Testing in an FYP typically covers unit tests for individual "
                "components, integration tests across modules, and user acceptance "
                "testing for end-to-end validation. Document your test plan, cases, "
                "and results in chapter 6."
            ),
            "technology": (
                "Pick a technology stack you can defend on objective grounds: "
                "ecosystem maturity, learning curve, fit with your problem, and "
                "supervisor familiarity. Avoid choosing tools you've never used "
                "without budgeting time to learn them."
            ),
            "presentation": (
                "FYP presentations (viva voce) usually run 15–20 minutes plus Q&A. "
                "Cover: motivation, problem, approach, demo, results, limitations, "
                "future work. Practise the demo end-to-end before the day."
            ),
            "supervisor": (
                "Choose a supervisor whose research interests align with your "
                "topic. Send a concise enquiry with your proposed area, key "
                "research questions, and why their expertise fits. Don't spam "
                "many supervisors with identical messages."
            ),
            "literature": (
                "A literature review surveys what is already known about your "
                "problem and identifies the gap your project addresses. Group "
                "papers by theme, summarise findings, and end with a gap statement."
            ),
            "procedure": (
                "MMU FCI FYP follows faculty-published procedures for proposal "
                "submission, supervisor pairing, mid-semester reviews, and the "
                "final viva. Always check the current cycle's announcements for "
                "specific dates and forms."
            ),
            "general": (
                "I can help with FYP topics including: proposal writing, "
                "meeting logs, timelines, report writing, methodology, testing, "
                "supervisor selection, presentations, literature review, MMU FCI "
                "procedures, and technology choices. What would you like to know?"
            ),
        }
        return responses.get(intent, responses["general"])

    @staticmethod
    def _classify_reference(filename: str, title: str) -> str:
        name = (filename or "").lower()
        title_lower = (title or "").lower()
        if "faq" in name or "faq" in title_lower:
            return "FAQ"
        if "deadline" in name or "timeline" in name or "schedule" in name:
            return "DEADLINE"
        if any(k in name for k in ("handbook", "guide", "procedure", "overview")):
            return "HANDBOOK"
        return "RESOURCE"

    def _extract_references(self, sources: List[Dict]) -> List[Dict]:
        """Build the frontend-shaped reference list from already-deduped sources."""
        references = []
        for source in sources[:5]:
            title = source.get("title", "")
            filename = source.get("filename", "")
            if not title:
                continue
            references.append({
                "title": title,
                "type": self._classify_reference(filename, title),
            })
        return references

    @property
    def is_ready(self) -> bool:
        """Check if the RAG engine is ready (index loaded)."""
        return self.index is not None and self.chunks is not None
