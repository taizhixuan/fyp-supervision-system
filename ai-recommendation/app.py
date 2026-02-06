"""
AI Recommendation Service - Supervisor-Student Matching

Uses sentence-transformers for semantic profile embeddings and a trained
XGBoost model for multi-signal match scoring. Falls back to cosine similarity
if the trained model is not available.

Endpoints:
    GET  /ai/health           - Health check
    POST /ai/recommendations  - Get supervisor recommendations for a student
"""

import os
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine_similarity

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Optional OpenAI client for explanation generation
# ============================================================================
client = None
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized for explanation generation")
    except ImportError:
        logger.warning("openai package not installed; explanation generation will use templates")

# ============================================================================
# Load ML Models
# ============================================================================
MODEL_DIR = Path(__file__).parent / "models"

# Sentence-transformer embedding model
logger.info("Loading sentence-transformer model (all-MiniLM-L6-v2)...")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
logger.info("Sentence-transformer model loaded successfully")

# XGBoost trained model (optional -- falls back to embedding similarity)
xgb_model = None
feature_config = None

xgb_model_path = MODEL_DIR / "xgb_model.pkl"
config_path = MODEL_DIR / "feature_config.json"

if xgb_model_path.exists():
    try:
        xgb_model = joblib.load(xgb_model_path)
        logger.info(f"Loaded trained XGBoost model from {xgb_model_path}")
    except Exception as e:
        logger.warning(f"Failed to load XGBoost model: {e}")

if config_path.exists():
    try:
        with open(config_path) as f:
            feature_config = json.load(f)
        logger.info(f"Loaded feature config: {feature_config.get('metrics', {})}")
    except Exception as e:
        logger.warning(f"Failed to load feature config: {e}")


# ============================================================================
# Feature Extraction Utilities
# ============================================================================

def normalize_list(items):
    """Normalize a list of strings to a lowercase stripped set."""
    if not items or not isinstance(items, list):
        return set()
    return set(i.strip().lower() for i in items if isinstance(i, str))


def jaccard_similarity(set_a, set_b):
    """Compute Jaccard similarity between two sets."""
    if not set_a and not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union > 0 else 0.0


def cosine_sim(vec_a, vec_b):
    """Compute cosine similarity between two numpy vectors."""
    dot = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


def build_profile_text(profile, role="student"):
    """Build a rich text representation of a profile for embedding."""
    parts = []
    if role == "student":
        if profile.get("interests"):
            interests = profile["interests"]
            parts.append("Research interests: " + (
                ", ".join(interests) if isinstance(interests, list) else str(interests)
            ))
        if profile.get("skills"):
            skills = profile["skills"]
            parts.append("Technical skills: " + (
                ", ".join(skills) if isinstance(skills, list) else str(skills)
            ))
        if profile.get("programme"):
            parts.append("Programme: " + profile["programme"])
        if profile.get("specialisation"):
            parts.append("Specialisation: " + profile["specialisation"])
        if profile.get("bio"):
            parts.append(profile["bio"])
    else:
        if profile.get("researchAreas"):
            areas = profile["researchAreas"]
            parts.append("Research areas: " + (
                ", ".join(areas) if isinstance(areas, list) else str(areas)
            ))
        if profile.get("expertise"):
            expertise = profile["expertise"]
            parts.append("Expertise: " + (
                ", ".join(expertise) if isinstance(expertise, list) else str(expertise)
            ))
        if profile.get("department"):
            parts.append("Department: " + profile["department"])
        if profile.get("preferredProjectTypes"):
            types = profile["preferredProjectTypes"]
            parts.append("Preferred projects: " + (
                ", ".join(types) if isinstance(types, list) else str(types)
            ))
        if profile.get("bio"):
            parts.append(profile["bio"])
    return " ".join(parts) if parts else "general profile"


def extract_features(student, supervisor, student_emb, supervisor_emb):
    """
    Extract multi-signal features for a student-supervisor pair.

    Returns a list of 8 features matching the trained model's expectations.
    """
    # 1. Semantic similarity from sentence-transformer embeddings
    semantic_sim = cosine_sim(student_emb, supervisor_emb)

    # 2. Research area overlap (Jaccard)
    s_interests = normalize_list(student.get("interests", []))
    sv_areas = normalize_list(supervisor.get("researchAreas", []))
    research_overlap = jaccard_similarity(s_interests, sv_areas)

    # 3. Skill-expertise overlap (Jaccard)
    s_skills = normalize_list(student.get("skills", []))
    sv_expertise = normalize_list(supervisor.get("expertise", []))
    skill_overlap = jaccard_similarity(s_skills, sv_expertise)

    # 4. Project type match
    sv_project_types = normalize_list(supervisor.get("preferredProjectTypes", []))
    project_match = jaccard_similarity(s_interests, sv_project_types)

    # 5. Availability factor
    current_load = supervisor.get("currentLoad", 0)
    quota = supervisor.get("supervisionQuota", 8)
    availability = 1.0 - (current_load / max(quota, 1))
    availability = max(0.0, min(1.0, availability))

    # 6-8. Count features
    interest_count = len(s_interests)
    area_count = len(sv_areas)
    raw_overlap_count = len(s_interests & sv_areas)

    return [
        semantic_sim,
        research_overlap,
        skill_overlap,
        project_match,
        availability,
        interest_count,
        area_count,
        raw_overlap_count,
    ]


# ============================================================================
# Scoring
# ============================================================================

def compute_match_scores(student_profile, supervisor_profiles):
    """
    Compute match scores for a student against all supervisors.

    Uses the trained XGBoost model if available, otherwise falls back
    to pure semantic cosine similarity.
    """
    # Build text representations and compute embeddings
    student_text = build_profile_text(student_profile, "student")
    supervisor_texts = [build_profile_text(sp, "supervisor") for sp in supervisor_profiles]

    all_texts = [student_text] + supervisor_texts
    all_embeddings = embed_model.encode(all_texts, show_progress_bar=False)

    student_emb = all_embeddings[0]
    supervisor_embs = all_embeddings[1:]

    scores = []

    if xgb_model is not None:
        # Use trained XGBoost model with multi-signal features
        logger.info("Using trained XGBoost model for scoring")
        feature_matrix = []
        for i, sp in enumerate(supervisor_profiles):
            features = extract_features(
                student_profile, sp, student_emb, supervisor_embs[i]
            )
            feature_matrix.append(features)

        feature_matrix = np.array(feature_matrix)
        raw_scores = xgb_model.predict(feature_matrix)
        scores = np.clip(raw_scores, 0.0, 1.0).tolist()
    else:
        # Fallback: cosine similarity of sentence-transformer embeddings
        logger.info("XGBoost model not found; using embedding cosine similarity")
        for i in range(len(supervisor_profiles)):
            sim = cosine_sim(student_emb, supervisor_embs[i])
            # Scale to 0-1 range (cosine similarity can be negative)
            scores.append(max(0.0, min(1.0, (sim + 1) / 2)))

    return scores, student_emb, supervisor_embs


# ============================================================================
# Explanation Generation
# ============================================================================

def generate_explanation(student_profile, supervisor_profile, match_score, features=None):
    """Generate a human-readable explanation for the match."""
    # Try OpenAI for top matches
    if client and match_score > 0.5:
        try:
            student_interests = student_profile.get("interests", [])
            supervisor_areas = supervisor_profile.get("researchAreas", [])

            prompt = (
                f"In 1-2 sentences, explain why a student interested in "
                f"{', '.join(student_interests) if isinstance(student_interests, list) else student_interests} "
                f"would be a good match for a supervisor specializing in "
                f"{', '.join(supervisor_areas) if isinstance(supervisor_areas, list) else supervisor_areas}. "
                f"The compatibility score is {match_score:.0%}."
            )

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful academic advisor. Be concise and specific."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=150,
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"OpenAI explanation failed: {e}")

    # Template-based explanation using match features
    s_interests = normalize_list(student_profile.get("interests", []))
    sv_areas = normalize_list(supervisor_profile.get("researchAreas", []))
    s_skills = normalize_list(student_profile.get("skills", []))
    sv_expertise = normalize_list(supervisor_profile.get("expertise", []))

    common_areas = s_interests & sv_areas
    common_skills = s_skills & sv_expertise

    parts = []
    if common_areas:
        parts.append(f"shared research interest in {', '.join(list(common_areas)[:3])}")
    if common_skills:
        parts.append(f"matching expertise in {', '.join(list(common_skills)[:3])}")

    if parts:
        reason = " and ".join(parts)
        return f"Strong match ({match_score:.0%}) based on {reason}."
    else:
        return (
            f"Match score: {match_score:.0%}. The supervisor's research profile "
            f"aligns with the student's academic interests based on semantic analysis."
        )


# ============================================================================
# API Endpoints
# ============================================================================

@app.route("/ai/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "ai-recommendation",
        "model_loaded": xgb_model is not None,
        "embedding_model": "all-MiniLM-L6-v2",
    })


@app.route("/ai/recommendations", methods=["POST"])
def get_recommendations():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        student_profile = data.get("studentProfile", {})
        supervisor_profiles = data.get("supervisorProfiles", [])

        if not supervisor_profiles:
            return jsonify({"recommendations": [], "generatedAt": None})

        # Compute match scores using trained model or embedding fallback
        scores, student_emb, supervisor_embs = compute_match_scores(
            student_profile, supervisor_profiles
        )

        # Pair supervisors with scores and sort
        scored_supervisors = list(zip(supervisor_profiles, scores))
        scored_supervisors.sort(key=lambda x: x[1], reverse=True)

        # Take top 10
        top_supervisors = scored_supervisors[:10]

        # Build recommendations
        recommendations = []
        for rank, (supervisor, score) in enumerate(top_supervisors, 1):
            # Generate explanation for top 5 only
            if rank <= 5:
                explanation = generate_explanation(
                    student_profile, supervisor, score
                )
            else:
                explanation = (
                    f"Match score: {score:.0%}. Profile alignment detected "
                    f"through semantic analysis of research interests and skills."
                )

            # Compute match areas (direct overlap)
            student_interests = student_profile.get("interests", [])
            supervisor_areas = supervisor.get("researchAreas", [])
            if isinstance(student_interests, list) and isinstance(supervisor_areas, list):
                match_areas = list(
                    set(i.lower() for i in student_interests)
                    & set(a.lower() for a in supervisor_areas)
                )
            else:
                match_areas = []

            recommendations.append({
                "supervisorId": supervisor.get("userId"),
                "supervisorName": supervisor.get("fullName", "Unknown"),
                "department": supervisor.get("department", ""),
                "researchAreas": supervisor.get("researchAreas", []),
                "matchScore": round(score * 100, 1),
                "matchAreas": match_areas,
                "explanation": explanation,
                "availabilityStatus": supervisor.get("availabilityStatus", "AVAILABLE"),
                "currentLoad": supervisor.get("currentLoad", 0),
                "supervisionQuota": supervisor.get("supervisionQuota", 8),
            })

        return jsonify({
            "recommendations": recommendations,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        })

    except Exception as e:
        logger.error(f"Recommendation error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
