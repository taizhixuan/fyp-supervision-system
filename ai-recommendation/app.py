"""
AI Recommendation Service — Supervisor matching for FYP students.

Architecture (deterministic, no training, no LLM in hot path):

    score(student, supervisor) =
          0.50 * cosine( embed(student_text), embed(supervisor_text) )
        + 0.18 * jaccard( student_interests, supervisor_research_areas )
        + 0.10 * jaccard( student_skills, supervisor_expertise )
        + 0.07 * programme_match
        + 0.15 * availability_factor

Embeddings come from a pretrained Sentence-BERT model (default
`BAAI/bge-base-en-v1.5`, 768-dim). No model is trained on data we
synthesise. Supervisor text includes recent project titles they have
actually supervised, not just self-described expertise. Explanations are
generated locally from the score breakdown.

Hard filter: supervisors at capacity or marked UNAVAILABLE are dropped
before scoring, not penalised.

Endpoints:
    GET  /ai/health           Health/info
    POST /ai/recommendations  Rank supervisors for a student
"""

import os
import logging
from datetime import datetime, timezone

import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer


app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# Config (env-driven)
# ============================================================================

def _env_float(name: str, default: float) -> float:
    """Read a float env var, treating unset/empty as the default. The compose
    file passes `${VAR:-}` which evaluates to '' when unset, so a plain
    `float(os.environ.get(...))` would crash."""
    raw = os.environ.get(name, "")
    if not raw or not raw.strip():
        return default
    try:
        return float(raw)
    except ValueError:
        logger.warning("Invalid %s=%r — using default %s", name, raw, default)
        return default


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "")
    if not raw or not raw.strip():
        return default
    try:
        return int(raw)
    except ValueError:
        logger.warning("Invalid %s=%r — using default %s", name, raw, default)
        return default


def _env_str(name: str, default: str) -> str:
    raw = os.environ.get(name, "")
    return raw.strip() if raw and raw.strip() else default


W_SEMANTIC = _env_float("REC_W_SEMANTIC", 0.50)
W_INTEREST = _env_float("REC_W_INTEREST", 0.18)
W_SKILL = _env_float("REC_W_SKILL", 0.10)
W_PROGRAMME = _env_float("REC_W_PROGRAMME", 0.07)
W_AVAILABILITY = _env_float("REC_W_AVAILABILITY", 0.15)

TOP_K = _env_int("REC_TOP_K", 10)
EMBED_MODEL_NAME = _env_str("REC_EMBED_MODEL", "BAAI/bge-base-en-v1.5")

# BGE family models expect "query: ..." / "passage: ..." prefixes for best
# retrieval quality. Other Sentence-BERT models do not — disable for them.
USE_BGE_PREFIXES = "bge" in EMBED_MODEL_NAME.lower()


# ============================================================================
# Embedding model
# ============================================================================

logger.info("Loading sentence-transformer %s ...", EMBED_MODEL_NAME)
embed_model = SentenceTransformer(EMBED_MODEL_NAME)
logger.info("Embedding model ready (bge_prefixes=%s)", USE_BGE_PREFIXES)


# ============================================================================
# Helpers
# ============================================================================

def _norm_set(items):
    if items is None:
        return set()
    if isinstance(items, str):
        return {items.strip().lower()} if items.strip() else set()
    if not isinstance(items, list):
        return set()
    return {str(i).strip().lower() for i in items if str(i).strip()}


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def _cosine(u: np.ndarray, v: np.ndarray) -> float:
    nu = np.linalg.norm(u)
    nv = np.linalg.norm(v)
    if nu == 0 or nv == 0:
        return 0.0
    # Sentence-BERT vectors are dense and almost always positive cosine.
    # Clip negatives to 0 instead of remapping to [0,1] (the (sim+1)/2 trick
    # inflates unrelated matches into the 0.5 region).
    return max(0.0, float(np.dot(u, v) / (nu * nv)))


def _list(value):
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value.strip() else []
    if isinstance(value, list):
        return [str(x) for x in value if str(x).strip()]
    return []


# ============================================================================
# Profile text builders (input for the embedding model)
# ============================================================================

def _student_text(profile: dict) -> str:
    parts = []
    interests = _list(profile.get("interests"))
    if interests:
        parts.append("Research interests: " + ", ".join(interests))
    skills = _list(profile.get("skills"))
    if skills:
        parts.append("Skills: " + ", ".join(skills))
    if profile.get("programme"):
        parts.append("Programme: " + str(profile["programme"]))
    if profile.get("specialisation"):
        parts.append("Specialisation: " + str(profile["specialisation"]))
    if profile.get("bio"):
        parts.append(str(profile["bio"]))
    text = ". ".join(parts) if parts else "general student profile"
    return f"query: {text}" if USE_BGE_PREFIXES else text


def _supervisor_text(profile: dict) -> str:
    parts = []
    areas = _list(profile.get("researchAreas"))
    if areas:
        parts.append("Research areas: " + ", ".join(areas))
    expertise = _list(profile.get("expertise"))
    if expertise:
        parts.append("Expertise: " + ", ".join(expertise))
    project_types = _list(profile.get("preferredProjectTypes"))
    if project_types:
        parts.append("Preferred projects: " + ", ".join(project_types))
    if profile.get("department"):
        parts.append("Department: " + str(profile["department"]))
    if profile.get("bio"):
        parts.append(str(profile["bio"]))
    # Past project titles the supervisor has actually supervised. These are
    # often the strongest signal of what the supervisor really does and let
    # the embedding match against students whose interests align with real
    # past work, not just self-described expertise.
    past_titles = _list(profile.get("pastProjectTitles"))
    if past_titles:
        # Cap individual titles to keep the embedding window healthy.
        clipped = [t[:160] for t in past_titles[:6]]
        parts.append("Recent supervised projects: " + "; ".join(clipped))
    text = ". ".join(parts) if parts else "general supervisor profile"
    return f"passage: {text}" if USE_BGE_PREFIXES else text


# ============================================================================
# Per-component scoring
# ============================================================================

def _availability_factor(supervisor: dict) -> float:
    """1.0 = empty, 0.0 = full. Used as a soft signal *after* the hard filter."""
    load = supervisor.get("currentLoad") or 0
    quota = supervisor.get("supervisionQuota") or 8
    quota = max(1, int(quota))
    free = max(0, int(quota) - int(load))
    return free / quota


def _programme_match(student: dict, supervisor: dict) -> float:
    """1.0 if student programme/specialisation matches any of the supervisor's
    declared faculty/department/preferredProjectTypes, else 0.0. Cheap signal."""
    haystack = " ".join([
        str(supervisor.get("department") or ""),
        str(supervisor.get("faculty") or ""),
        " ".join(_list(supervisor.get("preferredProjectTypes"))),
    ]).lower()
    if not haystack.strip():
        return 0.0
    needles = []
    if student.get("programme"):
        needles.append(str(student["programme"]).lower())
    if student.get("specialisation"):
        needles.append(str(student["specialisation"]).lower())
    return 1.0 if any(n and n in haystack for n in needles) else 0.0


def _is_acceptable(supervisor: dict) -> bool:
    """Hard filter. Full or unavailable supervisors are dropped from results."""
    status = str(supervisor.get("availabilityStatus") or "").upper()
    if status == "UNAVAILABLE":
        return False
    load = int(supervisor.get("currentLoad") or 0)
    quota = int(supervisor.get("supervisionQuota") or 8)
    return load < quota


# ============================================================================
# Explanation (local, from the score breakdown)
# ============================================================================

def _build_explanation(student: dict, supervisor: dict, components: dict) -> tuple[str, list[str]]:
    s_interests = _norm_set(_list(student.get("interests")))
    sv_areas = _norm_set(_list(supervisor.get("researchAreas")))
    s_skills = _norm_set(_list(student.get("skills")))
    sv_expertise = _norm_set(_list(supervisor.get("expertise")))

    common_areas = sorted(s_interests & sv_areas)
    common_skills = sorted(s_skills & sv_expertise)
    match_areas = common_areas + [k for k in common_skills if k not in common_areas]

    bits = []
    sem = components["semantic"]
    if sem >= 0.6:
        bits.append(f"strong topic alignment (semantic {sem:.2f})")
    elif sem >= 0.4:
        bits.append(f"moderate topic alignment (semantic {sem:.2f})")
    else:
        bits.append(f"limited topic alignment (semantic {sem:.2f})")

    if common_areas:
        shown = ", ".join(common_areas[:3])
        bits.append(f"shared research areas ({shown})")
    if common_skills:
        shown = ", ".join(common_skills[:3])
        bits.append(f"shared skills ({shown})")

    if components["programme"] >= 1.0:
        bits.append("same programme/department")

    free_slots = max(
        0,
        int(supervisor.get("supervisionQuota") or 8) - int(supervisor.get("currentLoad") or 0),
    )
    if free_slots == 1:
        bits.append("1 supervision slot free")
    else:
        bits.append(f"{free_slots} supervision slots free")

    return ". ".join(b[0].upper() + b[1:] for b in bits) + ".", match_areas


# ============================================================================
# Core scoring
# ============================================================================

def _score(student: dict, candidates: list[dict]) -> list[dict]:
    if not candidates:
        return []

    texts = [_student_text(student)] + [_supervisor_text(c) for c in candidates]
    embeddings = embed_model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    student_emb = embeddings[0]
    sv_embs = embeddings[1:]

    student_interests = _norm_set(_list(student.get("interests")))
    student_skills = _norm_set(_list(student.get("skills")))

    out = []
    for sv, sv_emb in zip(candidates, sv_embs):
        sem = _cosine(student_emb, sv_emb)
        interest = _jaccard(student_interests, _norm_set(_list(sv.get("researchAreas"))))
        skill = _jaccard(student_skills, _norm_set(_list(sv.get("expertise"))))
        prog = _programme_match(student, sv)
        avail = _availability_factor(sv)

        components = {
            "semantic": sem,
            "interest": interest,
            "skill": skill,
            "programme": prog,
            "availability": avail,
        }
        score = (
            W_SEMANTIC * sem
            + W_INTEREST * interest
            + W_SKILL * skill
            + W_PROGRAMME * prog
            + W_AVAILABILITY * avail
        )
        score = max(0.0, min(1.0, score))

        explanation, match_areas = _build_explanation(student, sv, components)

        out.append({
            "supervisor": sv,
            "score": score,
            "components": components,
            "match_areas": match_areas,
            "explanation": explanation,
        })

    out.sort(key=lambda r: r["score"], reverse=True)
    return out


# ============================================================================
# Endpoints
# ============================================================================

@app.route("/ai/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "ai-recommendation",
        "embedding_model": EMBED_MODEL_NAME,
        "bge_prefixes": USE_BGE_PREFIXES,
        "weights": {
            "semantic": W_SEMANTIC,
            "interest": W_INTEREST,
            "skill": W_SKILL,
            "programme": W_PROGRAMME,
            "availability": W_AVAILABILITY,
        },
        "top_k": TOP_K,
    })


@app.route("/ai/recommendations", methods=["POST"])
def recommendations():
    try:
        data = request.get_json(silent=True) or {}
        student = data.get("studentProfile") or {}
        supervisors = data.get("supervisorProfiles") or []

        if not supervisors:
            return jsonify({
                "recommendations": [],
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            })

        # Hard filter: drop full / unavailable supervisors
        eligible = [s for s in supervisors if _is_acceptable(s)]

        ranked = _score(student, eligible)[:TOP_K]

        recs = []
        for rank, r in enumerate(ranked, start=1):
            sv = r["supervisor"]
            recs.append({
                "supervisorId": sv.get("userId"),
                "supervisorName": sv.get("fullName", "Unknown"),
                "department": sv.get("department", ""),
                "researchAreas": _list(sv.get("researchAreas")),
                "matchScore": round(r["score"] * 100, 1),
                "matchAreas": r["match_areas"],
                "explanation": r["explanation"],
                "components": {
                    k: round(v, 4) for k, v in r["components"].items()
                },
                "rank": rank,
                "availabilityStatus": sv.get("availabilityStatus", "AVAILABLE"),
                "currentLoad": sv.get("currentLoad", 0),
                "supervisionQuota": sv.get("supervisionQuota", 8),
            })

        return jsonify({
            "recommendations": recs,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "totalCandidates": len(supervisors),
            "eligibleCandidates": len(eligible),
        })

    except Exception as e:
        logger.error("Recommendation error", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
