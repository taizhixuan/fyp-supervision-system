"""
Training Script for Supervisor-Student Recommendation Model

Trains an XGBoost regression model that learns optimal feature weighting
for supervisor-student matching. Uses sentence-transformers for semantic
embeddings and extracts multi-signal features from profile pairs.

Usage (local):
    python generate_training_data.py          # Generate training data first
    python train_model.py                      # Train with defaults

Usage (Google Colab):
    !pip install sentence-transformers xgboost scikit-learn numpy joblib
    !python generate_training_data.py
    !python train_model.py

Output:
    models/xgb_model.pkl          - Trained XGBoost model
    models/feature_config.json    - Feature names and training metadata
"""

import json
import os
import argparse
import time
import numpy as np
from pathlib import Path

import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sentence_transformers import SentenceTransformer
from xgboost import XGBRegressor


# ============================================================================
# Feature Extraction
# ============================================================================

def normalize_list(items):
    """Normalize a list of strings to lowercase stripped set."""
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
    """Compute cosine similarity between two vectors."""
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
            if isinstance(interests, list):
                parts.append("Research interests: " + ", ".join(interests))
            else:
                parts.append("Research interests: " + str(interests))
        if profile.get("skills"):
            skills = profile["skills"]
            if isinstance(skills, list):
                parts.append("Technical skills: " + ", ".join(skills))
            else:
                parts.append("Technical skills: " + str(skills))
        if profile.get("programme"):
            parts.append("Programme: " + profile["programme"])
        if profile.get("specialisation"):
            parts.append("Specialisation: " + profile["specialisation"])
        if profile.get("bio"):
            parts.append(profile["bio"])
    else:  # supervisor
        if profile.get("researchAreas"):
            areas = profile["researchAreas"]
            if isinstance(areas, list):
                parts.append("Research areas: " + ", ".join(areas))
            else:
                parts.append("Research areas: " + str(areas))
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
                parts.append("Preferred projects: " + ", ".join(types))
            else:
                parts.append("Preferred projects: " + str(types))
        if profile.get("bio"):
            parts.append(profile["bio"])
    return " ".join(parts) if parts else "general profile"


def extract_features(student, supervisor, student_embedding, supervisor_embedding):
    """
    Extract multi-signal features from a student-supervisor pair.

    Features:
        1. semantic_similarity      - cosine similarity of profile embeddings
        2. research_overlap_ratio   - Jaccard of interests vs research areas
        3. skill_expertise_overlap  - Jaccard of skills vs expertise
        4. project_type_match       - Jaccard of interests vs preferred project types
        5. availability_factor      - 1 - (currentLoad / supervisionQuota)
        6. interest_count           - number of student interests
        7. research_area_count      - number of supervisor research areas
        8. overlap_count            - raw count of overlapping interests/areas
    """
    # 1. Semantic similarity from sentence-transformer embeddings
    semantic_sim = cosine_sim(student_embedding, supervisor_embedding)

    # 2. Research area overlap (Jaccard)
    s_interests = normalize_list(student.get("interests", []))
    sv_areas = normalize_list(supervisor.get("researchAreas", []))
    research_overlap = jaccard_similarity(s_interests, sv_areas)

    # 3. Skill-expertise overlap (Jaccard)
    s_skills = normalize_list(student.get("skills", []))
    sv_expertise = normalize_list(supervisor.get("expertise", []))
    skill_overlap = jaccard_similarity(s_skills, sv_expertise)

    # 4. Project type match (Jaccard of student interests vs supervisor project types)
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


FEATURE_NAMES = [
    "semantic_similarity",
    "research_overlap_ratio",
    "skill_expertise_overlap",
    "project_type_match",
    "availability_factor",
    "interest_count",
    "research_area_count",
    "overlap_count",
]


# ============================================================================
# Training
# ============================================================================

def load_training_data(data_path):
    """Load training pairs from JSON file."""
    with open(data_path, "r") as f:
        pairs = json.load(f)
    print(f"Loaded {len(pairs)} training pairs from {data_path}")
    return pairs


def prepare_features(pairs, embed_model):
    """Compute embeddings and extract features for all pairs."""
    print("Building profile texts...")
    student_texts = [build_profile_text(p["student"], "student") for p in pairs]
    supervisor_texts = [build_profile_text(p["supervisor"], "supervisor") for p in pairs]

    print("Computing sentence embeddings (this may take a minute)...")
    all_texts = student_texts + supervisor_texts
    all_embeddings = embed_model.encode(all_texts, show_progress_bar=True, batch_size=128)

    student_embeddings = all_embeddings[:len(student_texts)]
    supervisor_embeddings = all_embeddings[len(student_texts):]

    print("Extracting multi-signal features...")
    X = []
    y = []
    for i, pair in enumerate(pairs):
        features = extract_features(
            pair["student"], pair["supervisor"],
            student_embeddings[i], supervisor_embeddings[i]
        )
        X.append(features)
        y.append(pair["match_score"])

    return np.array(X), np.array(y)


def train_model(X_train, y_train, X_val, y_val):
    """Train XGBoost regression model."""
    model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        objective="reg:squarederror",
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=True,
    )

    return model


def evaluate_model(model, X_test, y_test):
    """Evaluate the trained model."""
    y_pred = model.predict(X_test)
    y_pred = np.clip(y_pred, 0.0, 1.0)

    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mse)

    print("\n=== Model Evaluation ===")
    print(f"  RMSE:  {rmse:.4f}")
    print(f"  MAE:   {mae:.4f}")
    print(f"  R²:    {r2:.4f}")

    # Feature importance
    print("\n=== Feature Importance ===")
    importances = model.feature_importances_
    for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1]):
        print(f"  {name:30s} {imp:.4f}")

    return {"rmse": rmse, "mae": mae, "r2": r2}


def save_model(model, metrics, output_dir="models"):
    """Save the trained model and metadata."""
    os.makedirs(output_dir, exist_ok=True)

    model_path = os.path.join(output_dir, "xgb_model.pkl")
    joblib.dump(model, model_path)
    print(f"\nSaved model to {model_path}")

    config = {
        "feature_names": FEATURE_NAMES,
        "model_type": "XGBRegressor",
        "embedding_model": "all-MiniLM-L6-v2",
        "embedding_dim": 384,
        "metrics": {k: round(v, 4) for k, v in metrics.items()},
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    config_path = os.path.join(output_dir, "feature_config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    print(f"Saved config to {config_path}")


def main():
    parser = argparse.ArgumentParser(description="Train recommendation model")
    parser.add_argument("--data", type=str, default="data/training_pairs.json",
                        help="Path to training data JSON")
    parser.add_argument("--output", type=str, default="models",
                        help="Output directory for model artifacts")
    parser.add_argument("--test_size", type=float, default=0.2,
                        help="Fraction of data for testing")
    args = parser.parse_args()

    # Load data
    pairs = load_training_data(args.data)

    # Load embedding model
    print("Loading sentence-transformer model (all-MiniLM-L6-v2)...")
    embed_model = SentenceTransformer("all-MiniLM-L6-v2")

    # Extract features
    X, y = prepare_features(pairs, embed_model)
    print(f"Feature matrix shape: {X.shape}, Labels shape: {y.shape}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.15, random_state=42
    )
    print(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")

    # Train
    print("\nTraining XGBoost model...")
    model = train_model(X_train, y_train, X_val, y_val)

    # Evaluate
    metrics = evaluate_model(model, X_test, y_test)

    # Save
    save_model(model, metrics, args.output)

    print("\nTraining complete!")


if __name__ == "__main__":
    main()
