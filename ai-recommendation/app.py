import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = None
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)


def compute_tfidf_scores(student_text, supervisor_texts):
    """Compute TF-IDF cosine similarity between student profile and supervisor profiles."""
    all_texts = [student_text] + supervisor_texts
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    return similarities.tolist()


def build_student_text(profile):
    """Build a text representation of the student profile for matching."""
    parts = []
    if profile.get("interests"):
        interests = profile["interests"]
        if isinstance(interests, list):
            parts.append("Interests: " + ", ".join(interests))
        else:
            parts.append("Interests: " + str(interests))
    if profile.get("skills"):
        skills = profile["skills"]
        if isinstance(skills, list):
            parts.append("Skills: " + ", ".join(skills))
        else:
            parts.append("Skills: " + str(skills))
    if profile.get("programme"):
        parts.append("Programme: " + profile["programme"])
    if profile.get("specialisation"):
        parts.append("Specialisation: " + profile["specialisation"])
    if profile.get("bio"):
        parts.append(profile["bio"])
    return " ".join(parts) if parts else "general computer science student"


def build_supervisor_text(profile):
    """Build a text representation of a supervisor profile for matching."""
    parts = []
    if profile.get("researchAreas"):
        areas = profile["researchAreas"]
        if isinstance(areas, list):
            parts.append("Research Areas: " + ", ".join(areas))
        else:
            parts.append("Research Areas: " + str(areas))
    if profile.get("expertise"):
        expertise = profile["expertise"]
        if isinstance(expertise, list):
            parts.append("Expertise: " + ", ".join(expertise))
        else:
            parts.append("Expertise: " + str(expertise))
    if profile.get("department"):
        parts.append("Department: " + profile["department"])
    if profile.get("preferredProjectTypes"):
        types = profile["preferredProjectTypes"]
        if isinstance(types, list):
            parts.append("Preferred Projects: " + ", ".join(types))
        else:
            parts.append("Preferred Projects: " + str(types))
    if profile.get("bio"):
        parts.append(profile["bio"])
    return " ".join(parts) if parts else "general supervisor"


def generate_explanation(student_profile, supervisor_profile, similarity_score):
    """Use OpenAI to generate a human-readable explanation for the match."""
    if not client:
        return f"Matched based on research interest alignment (similarity score: {similarity_score:.0%})."

    try:
        student_interests = student_profile.get("interests", [])
        supervisor_areas = supervisor_profile.get("researchAreas", [])

        prompt = (
            f"In 1-2 sentences, explain why a student interested in "
            f"{', '.join(student_interests) if isinstance(student_interests, list) else student_interests} "
            f"would be a good match for a supervisor specializing in "
            f"{', '.join(supervisor_areas) if isinstance(supervisor_areas, list) else supervisor_areas}. "
            f"The compatibility score is {similarity_score:.0%}."
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
        logger.warning(f"OpenAI call failed: {e}")
        return f"Matched based on research interest alignment (similarity score: {similarity_score:.0%})."


@app.route("/ai/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ai-recommendation"})


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

        # Build text representations
        student_text = build_student_text(student_profile)
        supervisor_texts = [build_supervisor_text(sp) for sp in supervisor_profiles]

        # Compute TF-IDF similarity scores
        scores = compute_tfidf_scores(student_text, supervisor_texts)

        # Pair supervisors with scores and sort
        scored_supervisors = list(zip(supervisor_profiles, scores))
        scored_supervisors.sort(key=lambda x: x[1], reverse=True)

        # Take top 10
        top_supervisors = scored_supervisors[:10]

        # Build recommendations
        recommendations = []
        for rank, (supervisor, score) in enumerate(top_supervisors, 1):
            # Generate explanation for top 5 only (to save API calls)
            if rank <= 5:
                explanation = generate_explanation(student_profile, supervisor, score)
            else:
                explanation = f"Matched based on research interest alignment (score: {score:.0%})."

            # Compute match areas
            student_interests = student_profile.get("interests", [])
            supervisor_areas = supervisor.get("researchAreas", [])
            if isinstance(student_interests, list) and isinstance(supervisor_areas, list):
                match_areas = list(set(
                    i.lower() for i in student_interests
                ) & set(
                    a.lower() for a in supervisor_areas
                ))
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

        from datetime import datetime, timezone

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
