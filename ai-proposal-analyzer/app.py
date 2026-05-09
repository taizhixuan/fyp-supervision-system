"""
AI Proposal Analyzer Service.

Pipeline:
1. Rule-based NLP scoring (Flesch-Kincaid, Gunning Fog, structure, scope,
   innovation, section completeness) — always runs.
2. Fine-tuned DistilBERT regression for overall text quality — chunk-and-average
   over 480-token windows so long proposals are scored on the full text rather
   than just the first ~400 words.
3. Optional remote LLM (Groq / OpenAI / OpenAI-compatible) for richer
   strengths/weaknesses prose, wired through the same env-resolution scheme as
   the chatbot.

The plagiarism field has been removed deliberately: the previous version
hard-coded a constant and labelled it as a real check. The system will not
claim a signal it does not compute.

Endpoints:
    GET  /ai/health             - Health check
    POST /ai/analyze-proposal   - Analyze an FYP proposal
"""

import os
import re
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from flask import Flask, request, jsonify
from flask_cors import CORS

from nlp_utils import analyze_proposal_nlp

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Remote LLM (OpenAI-compatible: Groq / OpenAI / OpenRouter / etc.)
# ============================================================================
# Provider precedence — first match wins:
#   1. LLM_API_KEY (+ LLM_BASE_URL, LLM_MODEL)   - generic
#   2. GROQ_API_KEY                              - Groq defaults
#   3. OPENAI_API_KEY                            - OpenAI defaults

GROQ_DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"
OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1"
OPENAI_DEFAULT_MODEL = "gpt-3.5-turbo"


def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    """Read an env var, treating unset/empty as the default. Compose passes
    `${VAR:-}` which sets the var to '' when the user doesn't have it in
    their shell — `os.environ.get(...)` would otherwise return that empty
    string instead of falling through to a default."""
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return raw


def _resolve_llm_config():
    """Return (api_key, base_url, model, provider) — all None if unconfigured."""
    api_key = _env("LLM_API_KEY")
    if api_key:
        return (
            api_key,
            _env("LLM_BASE_URL", GROQ_DEFAULT_BASE_URL),
            _env("LLM_MODEL", GROQ_DEFAULT_MODEL),
            "custom",
        )
    api_key = _env("GROQ_API_KEY")
    if api_key:
        return (
            api_key,
            _env("LLM_BASE_URL", GROQ_DEFAULT_BASE_URL),
            _env("LLM_MODEL", GROQ_DEFAULT_MODEL),
            "groq",
        )
    api_key = _env("OPENAI_API_KEY")
    if api_key:
        return (
            api_key,
            _env("LLM_BASE_URL", OPENAI_DEFAULT_BASE_URL),
            _env("LLM_MODEL", OPENAI_DEFAULT_MODEL),
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
            "Remote LLM initialized: provider=%s model=%s base_url=%s",
            llm_provider, llm_model, llm_base_url,
        )
    except ImportError:
        logger.warning("openai package not installed; remote LLM disabled")
        llm_client = None
else:
    logger.info(
        "No remote LLM configured (set GROQ_API_KEY, OPENAI_API_KEY, or "
        "LLM_API_KEY) — using NLP-only feedback."
    )

# ============================================================================
# Fine-tuned DistilBERT model
# ============================================================================
MODEL_DIR = Path(__file__).parent / "models" / "essay_scorer"

QUALITY_MAX_TOKENS = 512   # DistilBERT-base hard limit
CHUNK_TOKEN_BUDGET = 480   # Leave headroom for [CLS] / [SEP]
CHUNK_STRIDE_TOKENS = 384  # ~25% overlap so context isn't sliced at chunk seams

quality_model = None
quality_tokenizer = None

if MODEL_DIR.exists() and (MODEL_DIR / "config.json").exists():
    try:
        import torch
        from transformers import (
            DistilBertForSequenceClassification,
            DistilBertTokenizer,
        )
        logger.info("Loading fine-tuned DistilBERT from %s ...", MODEL_DIR)
        quality_tokenizer = DistilBertTokenizer.from_pretrained(str(MODEL_DIR))
        quality_model = DistilBertForSequenceClassification.from_pretrained(str(MODEL_DIR))
        # Switch to inference mode (PyTorch torch.nn.Module.eval()).
        quality_model = quality_model.eval()

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        quality_model.to(device)
        logger.info("DistilBERT model loaded on %s", device)
    except Exception as e:
        logger.warning("Failed to load DistilBERT model: %s", e)
        logger.info("Will use NLP-only analysis pipeline")
else:
    logger.info("No fine-tuned model found at models/essay_scorer/. NLP-only analysis.")


# ============================================================================
# Chunk-and-average quality scoring
# ============================================================================

def _chunk_token_ids(token_ids):
    """Split a long token sequence into overlapping windows that fit in the
    model's 512-token context. Overlap (stride < budget) keeps section
    boundaries from being lost on the chunk seam."""
    if len(token_ids) <= CHUNK_TOKEN_BUDGET:
        return [token_ids]
    chunks = []
    start = 0
    while start < len(token_ids):
        end = min(start + CHUNK_TOKEN_BUDGET, len(token_ids))
        chunks.append(token_ids[start:end])
        if end >= len(token_ids):
            break
        start += CHUNK_STRIDE_TOKENS
    return chunks


def predict_quality_score(text):
    """Predict overall text quality, 0–100. Returns None if no model loaded.

    Long proposals are split into overlapping 480-token windows; each chunk
    runs through DistilBERT and the final score is a length-weighted average.
    The previous implementation truncated to the first ~400 words, so a
    3000-word proposal was effectively scored on its intro only."""
    if quality_model is None or quality_tokenizer is None:
        return None
    try:
        import torch
        device = next(quality_model.parameters()).device

        encoding = quality_tokenizer(
            text, add_special_tokens=False, return_tensors=None
        )
        token_ids = encoding["input_ids"]
        if not token_ids:
            return None
        chunks = _chunk_token_ids(token_ids)

        weighted_sum = 0.0
        total_weight = 0
        for chunk in chunks:
            ids = quality_tokenizer.build_inputs_with_special_tokens(chunk)
            ids = ids[:QUALITY_MAX_TOKENS]
            attention = [1] * len(ids)
            pad = QUALITY_MAX_TOKENS - len(ids)
            if pad > 0:
                ids = ids + [quality_tokenizer.pad_token_id] * pad
                attention = attention + [0] * pad
            input_ids = torch.tensor([ids], dtype=torch.long, device=device)
            attention_mask = torch.tensor([attention], dtype=torch.long, device=device)
            with torch.no_grad():
                out = quality_model(input_ids=input_ids, attention_mask=attention_mask)
            raw = out.logits.squeeze().item()
            score01 = max(0.0, min(1.0, raw))
            weight = len(chunk)
            weighted_sum += score01 * weight
            total_weight += weight

        avg01 = weighted_sum / total_weight if total_weight else 0.0
        return round(avg01 * 100, 1)
    except Exception as e:
        logger.warning("Quality model prediction failed: %s", e, exc_info=True)
        return None


# ============================================================================
# Optional LLM enhanced feedback
# ============================================================================

ANALYSIS_SYSTEM_PROMPT = (
    "You are an expert academic proposal reviewer for Final Year Projects "
    "(FYP) at MMU FCI. Given the proposal text and the automated NLP analysis "
    "scores, return ADDITIONAL detailed feedback as a JSON object with these "
    "keys exactly:\n"
    "{\n"
    '  "detailed_strengths": ["<specific strength>", ...],\n'
    '  "detailed_weaknesses": ["<specific weakness>", ...],\n'
    '  "detailed_suggestions": ["<actionable suggestion>", ...],\n'
    '  "summary": "<2-3 sentence overall assessment>"\n'
    "}\n"
    "Output ONLY the JSON object, no surrounding prose. Be constructive, "
    "specific, and FYP-appropriate."
)


def _extract_json_object(raw):
    """Extract the first JSON object from a model response. We don't pass
    `response_format={"type":"json_object"}` because most non-OpenAI providers
    (Groq included) silently ignore it, so models can produce code-fenced or
    prose-prefixed responses. Strip those gracefully and return None on
    unrecoverable parse failure (caller falls back to NLP)."""
    if not raw:
        return None
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    if "{" in text and "}" in text:
        text = text[text.index("{"): text.rindex("}") + 1]
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning("LLM JSON parse failed: %s", e)
        return None


def get_llm_enhanced_feedback(text, nlp_analysis):
    """Return LLM-augmented feedback or None on any failure (caller must
    tolerate). Provider is whatever `_resolve_llm_config` selected."""
    if not llm_client:
        return None
    try:
        scores_summary = (
            f"Automated scores - Clarity: {nlp_analysis['clarity_score']}/100, "
            f"Structure: {nlp_analysis['structure_score']}/100, "
            f"Scope: {nlp_analysis['scope_score']}/100, "
            f"Innovation: {nlp_analysis['innovation_score']}/100"
        )
        proposal_excerpt = text if len(text) <= 6000 else text[:6000] + " [...]"
        response = llm_client.chat.completions.create(
            model=llm_model,
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": f"Proposal:\n{proposal_excerpt}\n\n{scores_summary}"},
            ],
            max_tokens=1500,
            temperature=0.3,
        )
        raw = (response.choices[0].message.content or "").strip()
        return _extract_json_object(raw)
    except Exception as e:
        logger.warning("Remote LLM feedback failed: %s", e)
        return None


# ============================================================================
# Main Analysis Pipeline
# ============================================================================

def analyze_proposal(text):
    """Full proposal analysis pipeline:
    1. NLP metrics (always)
    2. Fine-tuned DistilBERT (if available, chunk-and-averaged)
    3. Optional LLM enhanced feedback (Groq / OpenAI)
    4. Composite scoring (transparent weighted sum)
    """
    nlp_results = analyze_proposal_nlp(text)
    model_quality_score = predict_quality_score(text)
    using_model = model_quality_score is not None
    if using_model:
        logger.info("Model quality score: %.1f", model_quality_score)
    else:
        logger.info("Using NLP-only scoring (no trained model)")

    clarity_score = nlp_results["clarity_score"]
    structure_score = nlp_results["structure_score"]
    scope_score = nlp_results["scope_score"]
    innovation_score = nlp_results["innovation_score"]

    if using_model:
        feasibility_score = round(
            model_quality_score * 0.4 + scope_score * 0.3 + structure_score * 0.3, 1
        )
        overall_score = round(
            model_quality_score * 0.30
            + clarity_score * 0.20
            + structure_score * 0.20
            + scope_score * 0.15
            + innovation_score * 0.15,
            1,
        )
    else:
        feasibility_score = round(
            scope_score * 0.5 + structure_score * 0.3 + clarity_score * 0.2, 1
        )
        overall_score = round(
            clarity_score * 0.25
            + structure_score * 0.25
            + scope_score * 0.25
            + innovation_score * 0.25,
            1,
        )

    enhanced = get_llm_enhanced_feedback(text, nlp_results)
    strengths = nlp_results["strengths"]
    weaknesses = nlp_results["weaknesses"]
    suggestions = nlp_results["suggestions"]
    if enhanced:
        strengths = enhanced.get("detailed_strengths", strengths)
        weaknesses = enhanced.get("detailed_weaknesses", weaknesses)
        suggestions = enhanced.get("detailed_suggestions", suggestions)

    section_analysis = []
    for sa in nlp_results["section_analysis"]:
        section_analysis.append({
            "section": sa["section"].replace("_", " ").title(),
            "score": sa["score"],
            "feedback": sa["feedback"],
        })

    if enhanced and enhanced.get("summary"):
        summary = enhanced["summary"]
    else:
        word_count = nlp_results["word_count"]
        model_note = "AI model + NLP pipeline" if using_model else "NLP pipeline"
        verdict = (
            "The proposal demonstrates good academic writing."
            if overall_score >= 65
            else "The proposal has areas that need improvement."
        )
        summary = (
            f"Analysis of proposal ({word_count} words) using {model_note}. "
            f"Overall quality score: {overall_score}/100. {verdict} "
            f"Section completeness: {nlp_results['section_completeness']}%."
        )

    return {
        "overallScore": int(overall_score),
        "feasibilityScore": int(feasibility_score),
        "innovationScore": int(innovation_score),
        "clarityScore": int(clarity_score),
        "scopeScore": int(scope_score),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "sectionAnalysis": section_analysis,
        "summary": summary,
        "metadata": {
            "wordCount": nlp_results["word_count"],
            "sentenceCount": nlp_results["sentence_count"],
            "readabilityGrade": nlp_results["readability_grade"],
            "readingEase": nlp_results["reading_ease"],
            "modelUsed": using_model,
            "sectionCompleteness": nlp_results["section_completeness"],
            "llmEnhanced": enhanced is not None,
        },
    }


# ============================================================================
# API Endpoints
# ============================================================================

@app.route("/ai/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "ai-proposal-analyzer",
        "model_loaded": quality_model is not None,
        "analysis_mode": "model+nlp" if quality_model else "nlp_only",
        "remote_llm": {
            "configured": llm_client is not None,
            "provider": llm_provider,
            "model": llm_model,
        },
    })


@app.route("/ai/analyze-proposal", methods=["POST"])
def analyze_proposal_endpoint():
    try:
        data = request.get_json(silent=True) or {}
        proposal_content = data.get("proposalContent", "")
        if not proposal_content:
            return jsonify({"error": "proposalContent is required"}), 400
        result = analyze_proposal(proposal_content)
        result["analyzedAt"] = datetime.now(timezone.utc).isoformat()
        return jsonify(result)
    except Exception as e:
        logger.error("Analysis error", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5002))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
