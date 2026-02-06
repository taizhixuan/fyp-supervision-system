"""
AI Proposal Analyzer Service

Uses a fine-tuned DistilBERT model for overall text quality scoring combined
with a rule-based NLP pipeline for multi-dimensional proposal evaluation.
Falls back to NLP-only analysis if the trained model is not available.
OpenAI is used as an optional enhancement for detailed feedback.

Endpoints:
    GET  /ai/health             - Health check
    POST /ai/analyze-proposal   - Analyze an FYP proposal
"""

import os
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

from nlp_utils import analyze_proposal_nlp

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Optional OpenAI client for enhanced feedback
# ============================================================================
client = None
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized for enhanced feedback")
    except ImportError:
        logger.warning("openai package not installed; using local models only")

# ============================================================================
# Load Fine-tuned DistilBERT Model
# ============================================================================
MODEL_DIR = Path(__file__).parent / "models" / "essay_scorer"

quality_model = None
quality_tokenizer = None

if MODEL_DIR.exists() and (MODEL_DIR / "config.json").exists():
    try:
        import torch
        from transformers import (
            DistilBertForSequenceClassification,
            DistilBertTokenizer,
        )
        logger.info(f"Loading fine-tuned DistilBERT from {MODEL_DIR}...")
        quality_tokenizer = DistilBertTokenizer.from_pretrained(str(MODEL_DIR))
        quality_model = DistilBertForSequenceClassification.from_pretrained(str(MODEL_DIR))
        quality_model.eval()

        # Use GPU if available
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        quality_model.to(device)
        logger.info(f"DistilBERT model loaded on {device}")
    except Exception as e:
        logger.warning(f"Failed to load DistilBERT model: {e}")
        logger.info("Will use NLP-only analysis pipeline")
else:
    logger.info("No fine-tuned model found at models/essay_scorer/. Using NLP-only analysis.")


# ============================================================================
# Model-based Quality Prediction
# ============================================================================

def predict_quality_score(text):
    """
    Predict overall text quality using the fine-tuned DistilBERT model.
    Returns a score from 0-100, or None if model is not available.
    """
    if quality_model is None or quality_tokenizer is None:
        return None

    try:
        import torch

        device = next(quality_model.parameters()).device

        # Tokenize
        encoding = quality_tokenizer(
            text,
            max_length=512,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        input_ids = encoding["input_ids"].to(device)
        attention_mask = encoding["attention_mask"].to(device)

        # Predict
        with torch.no_grad():
            outputs = quality_model(input_ids=input_ids, attention_mask=attention_mask)
            raw_score = outputs.logits.squeeze().item()

        # Clamp to 0-1 and scale to 0-100
        score = max(0.0, min(1.0, raw_score)) * 100
        return round(score, 1)

    except Exception as e:
        logger.warning(f"Model prediction failed: {e}")
        return None


# ============================================================================
# OpenAI Enhanced Feedback (Optional)
# ============================================================================

ANALYSIS_SYSTEM_PROMPT = """You are an expert academic proposal reviewer for Final Year Projects (FYP).
Given the proposal text and the automated analysis scores, provide additional detailed feedback.

Return your feedback as a JSON object with:
{
  "detailed_strengths": ["<specific strength 1>", ...],
  "detailed_weaknesses": ["<specific weakness 1>", ...],
  "detailed_suggestions": ["<actionable suggestion 1>", ...],
  "summary": "<2-3 sentence overall assessment>"
}

Be constructive, specific, and fair. Focus on academic quality and FYP feasibility."""


def get_openai_enhanced_feedback(text, nlp_analysis):
    """Use OpenAI to generate detailed feedback based on the proposal and NLP scores."""
    if not client:
        return None

    try:
        scores_summary = (
            f"Automated scores - Clarity: {nlp_analysis['clarity_score']}/100, "
            f"Structure: {nlp_analysis['structure_score']}/100, "
            f"Scope: {nlp_analysis['scope_score']}/100, "
            f"Innovation: {nlp_analysis['innovation_score']}/100"
        )

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": f"Proposal:\n{text[:3000]}\n\n{scores_summary}"},
            ],
            max_tokens=1500,
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content.strip())
        return result
    except Exception as e:
        logger.warning(f"OpenAI enhanced feedback failed: {e}")
        return None


# ============================================================================
# Main Analysis Pipeline
# ============================================================================

def analyze_proposal(text, sections=None):
    """
    Full proposal analysis pipeline:
    1. Fine-tuned DistilBERT quality prediction (if model available)
    2. NLP metrics pipeline (always runs)
    3. Optional OpenAI enhanced feedback
    4. Composite scoring
    """
    # Step 1: NLP-based analysis (always available)
    nlp_results = analyze_proposal_nlp(text)

    # Step 2: Model-based quality prediction
    model_quality_score = predict_quality_score(text)
    using_model = model_quality_score is not None

    if using_model:
        logger.info(f"Model quality score: {model_quality_score:.1f}")
    else:
        logger.info("Using NLP-only scoring (no trained model)")

    # Step 3: Compute composite scores
    clarity_score = nlp_results["clarity_score"]
    structure_score = nlp_results["structure_score"]
    scope_score = nlp_results["scope_score"]
    innovation_score = nlp_results["innovation_score"]

    if using_model:
        # Blend model prediction with NLP metrics
        # Model contributes to overall and feasibility; NLP for specific dimensions
        feasibility_score = round(model_quality_score * 0.4 + scope_score * 0.3 + structure_score * 0.3, 1)
        overall_score = round(
            model_quality_score * 0.30 +
            clarity_score * 0.20 +
            structure_score * 0.20 +
            scope_score * 0.15 +
            innovation_score * 0.15,
            1
        )
    else:
        # NLP-only composite
        feasibility_score = round(scope_score * 0.5 + structure_score * 0.3 + clarity_score * 0.2, 1)
        overall_score = round(
            clarity_score * 0.25 +
            structure_score * 0.25 +
            scope_score * 0.25 +
            innovation_score * 0.25,
            1
        )

    # Plagiarism placeholder (would need a real plagiarism checker)
    plagiarism_score = 85  # Default: assume mostly original

    # Step 4: Get enhanced feedback from OpenAI (optional)
    enhanced = get_openai_enhanced_feedback(text, nlp_results)

    # Merge strengths/weaknesses/suggestions
    strengths = nlp_results["strengths"]
    weaknesses = nlp_results["weaknesses"]
    suggestions = nlp_results["suggestions"]

    if enhanced:
        strengths = enhanced.get("detailed_strengths", strengths)
        weaknesses = enhanced.get("detailed_weaknesses", weaknesses)
        suggestions = enhanced.get("detailed_suggestions", suggestions)

    # Build section analysis for response
    section_analysis = []
    for sa in nlp_results["section_analysis"]:
        section_analysis.append({
            "section": sa["section"].replace("_", " ").title(),
            "score": sa["score"],
            "feedback": sa["feedback"],
        })

    # Build summary
    if enhanced and enhanced.get("summary"):
        summary = enhanced["summary"]
    else:
        word_count = nlp_results["word_count"]
        model_note = " (AI model + NLP pipeline)" if using_model else " (NLP pipeline)"
        summary = (
            f"Analysis of proposal ({word_count} words) using {model_note}. "
            f"Overall quality score: {overall_score}/100. "
            f"{'The proposal demonstrates good academic writing.' if overall_score >= 65 else 'The proposal has areas that need improvement.'} "
            f"Section completeness: {nlp_results['section_completeness']}%."
        )

    return {
        "overallScore": int(overall_score),
        "feasibilityScore": int(feasibility_score),
        "innovationScore": int(innovation_score),
        "clarityScore": int(clarity_score),
        "scopeScore": int(scope_score),
        "plagiarismScore": plagiarism_score,
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
    })


@app.route("/ai/analyze-proposal", methods=["POST"])
def analyze_proposal_endpoint():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        proposal_content = data.get("proposalContent", "")
        sections = data.get("sections", [])

        if not proposal_content:
            return jsonify({"error": "proposalContent is required"}), 400

        result = analyze_proposal(proposal_content, sections)
        result["analyzedAt"] = datetime.now(timezone.utc).isoformat()

        return jsonify(result)

    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5002))
    app.run(host="0.0.0.0", port=port, debug=True)
