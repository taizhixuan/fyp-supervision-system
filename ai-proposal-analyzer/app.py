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

from nlp_utils import analyze_proposal_nlp, collapse_redundancy, redundancy_ratio

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
# Prefer the in-domain multi-trait FYP scorer (models/proposal_scorer/, 5 outputs)
# trained by train_multitrait.py via LLM-teacher distillation. Fall back to the
# legacy single-output ASAP model (models/essay_scorer/) for backward compat.
DIMENSIONS = ["clarity", "structure", "scope", "innovation", "feasibility"]
# Transparent overall weighting over the 5 model traits (mirrors train_multitrait).
OVERALL_WEIGHTS = {"clarity": 0.20, "structure": 0.20, "scope": 0.15,
                   "innovation": 0.15, "feasibility": 0.30}

MODELS_ROOT = Path(__file__).parent / "models"
MULTITRAIT_DIR = MODELS_ROOT / "proposal_scorer"
LEGACY_DIR = MODELS_ROOT / "essay_scorer"

QUALITY_MAX_TOKENS = 512   # DistilBERT-base hard limit
CHUNK_TOKEN_BUDGET = 480   # Leave headroom for [CLS] / [SEP]
CHUNK_STRIDE_TOKENS = 384  # ~25% overlap so context isn't sliced at chunk seams

quality_model = None
quality_tokenizer = None
model_kind = None          # "multi" (5 traits) | "single" (legacy quality) | None
model_dir = None
calibration = None         # per-dim {x:[...], y:[...]} from calibration.json


def _select_model_dir():
    if MULTITRAIT_DIR.exists() and (MULTITRAIT_DIR / "config.json").exists():
        return MULTITRAIT_DIR
    if LEGACY_DIR.exists() and (LEGACY_DIR / "config.json").exists():
        return LEGACY_DIR
    return None


model_dir = _select_model_dir()
if model_dir is not None:
    try:
        import json as _json
        import torch
        from transformers import (
            DistilBertForSequenceClassification,
            DistilBertTokenizer,
        )
        logger.info("Loading fine-tuned DistilBERT from %s ...", model_dir)
        quality_tokenizer = DistilBertTokenizer.from_pretrained(str(model_dir))
        # Switch to inference mode (PyTorch torch.nn.Module.eval()).
        quality_model = DistilBertForSequenceClassification.from_pretrained(str(model_dir)).eval()
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        quality_model.to(device)
        n_out = quality_model.config.num_labels
        model_kind = "multi" if n_out >= len(DIMENSIONS) else "single"
        cal_path = model_dir / "calibration.json"
        if cal_path.exists():
            try:
                calibration = _json.loads(cal_path.read_text(encoding="utf-8")) or None
            except Exception:
                calibration = None
        logger.info("DistilBERT loaded on %s | outputs=%d | kind=%s | calibrated=%s",
                    device, n_out, model_kind, calibration is not None)
    except Exception as e:
        logger.warning("Failed to load DistilBERT model: %s", e)
        logger.info("Will use NLP-only analysis pipeline")
        quality_model = None
        quality_tokenizer = None
        model_kind = None
else:
    logger.info("No fine-tuned model found (looked in proposal_scorer/, essay_scorer/). NLP-only.")


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


def _apply_calibration(dim, x01):
    """Map a raw 0-1 model output through the per-dimension isotonic calibration
    (stored as (x,y) points) so the score distribution matches the teacher's and
    the low end is pinned for weak proposals. Identity if no calibration."""
    if not calibration or dim not in calibration:
        return x01
    c = calibration[dim]
    try:
        import numpy as _np
        return float(_np.interp(x01, c["x"], c["y"]))
    except Exception:
        return x01


def predict_model_vector(text):
    """Return the model's length-num_labels output as a 0-1 list, chunk-and-
    length-weighted-averaged over the FULL text (no first-paragraph truncation).
    Works for both the 5-output multi-trait model and the legacy 1-output model.
    Returns None if no model is loaded."""
    if quality_model is None or quality_tokenizer is None:
        return None
    try:
        import torch
        device = next(quality_model.parameters()).device

        encoding = quality_tokenizer(text, add_special_tokens=False, return_tensors=None)
        token_ids = encoding["input_ids"]
        if not token_ids:
            return None
        chunks = _chunk_token_ids(token_ids)

        weighted = None
        total_weight = 0
        for chunk in chunks:
            ids = quality_tokenizer.build_inputs_with_special_tokens(chunk)[:QUALITY_MAX_TOKENS]
            attention = [1] * len(ids)
            pad = QUALITY_MAX_TOKENS - len(ids)
            if pad > 0:
                ids = ids + [quality_tokenizer.pad_token_id] * pad
                attention = attention + [0] * pad
            input_ids = torch.tensor([ids], dtype=torch.long, device=device)
            attention_mask = torch.tensor([attention], dtype=torch.long, device=device)
            with torch.no_grad():
                out = quality_model(input_ids=input_ids, attention_mask=attention_mask)
            row = out.logits.squeeze(0).tolist()
            if not isinstance(row, list):
                row = [row]
            row = [max(0.0, min(1.0, v)) for v in row]
            w = len(chunk)
            weighted = [v * w for v in row] if weighted is None else [a + v * w for a, v in zip(weighted, row)]
            total_weight += w

        if not weighted or total_weight == 0:
            return None
        return [v / total_weight for v in weighted]
    except Exception as e:
        logger.warning("Model prediction failed: %s", e, exc_info=True)
        return None


def predict_trait_scores(text):
    """Multi-trait path -> {clarity,structure,scope,innovation,feasibility} each
    0-100 (calibrated). None unless the multi-trait model is loaded."""
    if model_kind != "multi":
        return None
    vec = predict_model_vector(text)
    if vec is None:
        return None
    return {dim: round(_apply_calibration(dim, vec[i] if i < len(vec) else 0.0) * 100, 1)
            for i, dim in enumerate(DIMENSIONS)}


def predict_quality_score(text):
    """Legacy single-output path -> overall text quality 0-100. None unless the
    legacy 1-output model is loaded."""
    if model_kind != "single":
        return None
    vec = predict_model_vector(text)
    if vec is None:
        return None
    return round(max(0.0, min(1.0, vec[0])) * 100, 1)


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

def build_feedback_from_scores(clarity, structure, scope, innovation, feasibility, nlp_results):
    """Coherent strengths/weaknesses/suggestions derived from the FINAL dimension
    scores (so the prose matches what is displayed regardless of whether the model
    or the rule layer produced them)."""
    strengths, weaknesses, suggestions = [], [], []

    if clarity >= 70:
        strengths.append("Writing is clear with appropriate academic language.")
    elif clarity >= 50:
        weaknesses.append("Writing clarity could be improved for readability.")
        suggestions.append("Tighten sentence structure and keep the academic writing concise.")
    else:
        weaknesses.append("Writing clarity needs significant improvement.")
        suggestions.append("Simplify complex sentences and improve paragraph flow.")

    thin = [sa["section"].replace("_", " ") for sa in nlp_results["section_analysis"]
            if sa.get("status") != "present"]
    if structure >= 70:
        strengths.append("Proposal is well organised with the key sections developed.")
    elif structure >= 50:
        weaknesses.append("Some required sections are present but thin.")
        if thin:
            suggestions.append("Develop these sections with more detail: " + ", ".join(thin[:3]) + ".")
    else:
        weaknesses.append("Proposal lacks well-developed sections.")
        suggestions.append("Develop every required section with specific detail rather than one-liners.")

    if scope >= 70:
        strengths.append("Project scope is well defined and appropriately bounded.")
    elif scope >= 50:
        suggestions.append("Sharpen the scope with explicit boundaries and what is in/out.")
    else:
        weaknesses.append("Project scope is poorly defined or unrealistic.")
        suggestions.append("State clear scope boundaries and a realistic, achievable extent.")

    if innovation >= 70:
        strengths.append("Shows a clear contribution and awareness of existing work.")
    elif innovation >= 50:
        suggestions.append("Strengthen novelty by comparing to existing solutions and stating the gap.")
    else:
        weaknesses.append("Limited novelty or awareness of existing work.")
        suggestions.append("Review related work and state explicitly how your approach differs.")

    if feasibility >= 70:
        strengths.append("The project looks feasible with a concrete approach.")
    elif feasibility >= 50:
        suggestions.append("Add methodology detail (techniques, tools, data, evaluation) to raise feasibility.")
    else:
        weaknesses.append("Feasibility is unclear; the methodology is too vague.")
        suggestions.append("Specify concrete methods, tools, datasets and an evaluation plan.")

    wc = nlp_results["word_count"]
    if wc < 120:
        weaknesses.append(f"Proposal is very brief ({wc} words) for proper evaluation.")
        suggestions.append("Expand into a fuller proposal with specific detail in each section.")
    return strengths, weaknesses, suggestions


def analyze_proposal(text):
    """Full proposal analysis pipeline:
    1. NLP metrics (always; now content-aware section scoring)
    2. Fine-tuned DistilBERT — multi-trait (5 dims, in-domain) if available, else
       legacy single-output, chunk-and-averaged over the full text
    3. Optional LLM enhanced feedback (Groq / OpenAI)
    4. Composite scoring (transparent weighted sum over the model's traits)
    """
    # Redundancy guard: score on the de-duplicated text so pasting the same
    # sentence repeatedly cannot inflate the score (see penalty below).
    redundancy = redundancy_ratio(text)
    scoring_text = collapse_redundancy(text) if redundancy > 0.05 else text

    nlp_results = analyze_proposal_nlp(scoring_text)
    trait_scores = predict_trait_scores(scoring_text)      # multi-trait, in-domain
    legacy_quality = predict_quality_score(scoring_text)   # legacy single-output

    if trait_scores is not None:
        using_model, model_type = True, "multitrait"
        clarity_score = trait_scores["clarity"]
        structure_score = trait_scores["structure"]
        scope_score = trait_scores["scope"]
        innovation_score = trait_scores["innovation"]
        feasibility_score = trait_scores["feasibility"]
    elif legacy_quality is not None:
        using_model, model_type = True, "legacy_quality"
        clarity_score = nlp_results["clarity_score"]
        structure_score = nlp_results["structure_score"]
        scope_score = nlp_results["scope_score"]
        innovation_score = nlp_results["innovation_score"]
        feasibility_score = round(legacy_quality * 0.4 + scope_score * 0.3 + structure_score * 0.3, 1)
    else:
        using_model, model_type = False, "nlp_only"
        clarity_score = nlp_results["clarity_score"]
        structure_score = nlp_results["structure_score"]
        scope_score = nlp_results["scope_score"]
        innovation_score = nlp_results["innovation_score"]
        feasibility_score = round(scope_score * 0.5 + structure_score * 0.3 + clarity_score * 0.2, 1)

    # Heavy duplicate-sentence padding is a writing/organisation defect — penalise
    # clarity & structure so padding scores LOWER, never higher.
    if redundancy >= 0.25:
        penalty = min(20.0, (redundancy - 0.10) * 40.0)
        clarity_score = max(0.0, round(clarity_score - penalty, 1))
        structure_score = max(0.0, round(structure_score - penalty, 1))

    if model_type == "multitrait":
        overall_score = round(
            clarity_score * OVERALL_WEIGHTS["clarity"]
            + structure_score * OVERALL_WEIGHTS["structure"]
            + scope_score * OVERALL_WEIGHTS["scope"]
            + innovation_score * OVERALL_WEIGHTS["innovation"]
            + feasibility_score * OVERALL_WEIGHTS["feasibility"], 1)
        logger.info("Multi-trait overall %.1f (redundancy %.2f)", overall_score, redundancy)
    elif model_type == "legacy_quality":
        overall_score = round(legacy_quality * 0.30 + clarity_score * 0.20 + structure_score * 0.20
                              + scope_score * 0.15 + innovation_score * 0.15, 1)
    else:
        overall_score = round(clarity_score * 0.25 + structure_score * 0.25
                              + scope_score * 0.25 + innovation_score * 0.25, 1)

    strengths, weaknesses, suggestions = build_feedback_from_scores(
        clarity_score, structure_score, scope_score, innovation_score, feasibility_score, nlp_results)
    if redundancy >= 0.15:
        weaknesses.append("Repeated or duplicated sentences detected — the same text appears multiple times.")
        suggestions.append("Remove the duplicated sentences and add new, specific content instead.")

    enhanced = get_llm_enhanced_feedback(text, nlp_results)
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
        model_note = {"multitrait": "in-domain AI model + NLP pipeline",
                      "legacy_quality": "AI model + NLP pipeline",
                      "nlp_only": "NLP pipeline"}[model_type]
        verdict = ("The proposal demonstrates good academic writing."
                   if overall_score >= 65 else "The proposal has areas that need improvement.")
        summary = (
            f"Analysis of proposal ({word_count} words) using {model_note}. "
            f"Overall quality score: {overall_score}/100. {verdict} "
            f"Section completeness: {nlp_results['section_completeness']}%."
        )

    # Use round() (banker's rounding to nearest int) rather than int() — int()
    # truncates 71.6 to 71, biasing every score downward by up to 1 point.
    return {
        "overallScore": round(overall_score),
        "feasibilityScore": round(feasibility_score),
        "innovationScore": round(innovation_score),
        "clarityScore": round(clarity_score),
        "scopeScore": round(scope_score),
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
            "modelType": model_type,
            "structureScore": round(structure_score),
            "sectionCompleteness": nlp_results["section_completeness"],
            "redundancy": round(redundancy, 3),
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
        "model_kind": model_kind,
        "model_dir": model_dir.name if model_dir else None,
        "calibrated": calibration is not None,
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
        # Reject non-string payloads up-front. Without this, a number / list /
        # dict propagates into the tokenizer and crashes with an opaque
        # "expected string or bytes-like object" 500.
        if not isinstance(proposal_content, str):
            return jsonify({
                "error": "proposalContent must be a string"
            }), 400
        if not proposal_content.strip():
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
