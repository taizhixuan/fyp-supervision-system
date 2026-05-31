"""
NLP Utilities for Proposal Analysis

Provides rule-based NLP metrics for multi-dimensional proposal evaluation:
- Readability scoring (Flesch-Kincaid, Gunning Fog, etc.)
- Section/structure detection
- Keyword and topic analysis
- Scope evaluation
"""

import re
import math
from collections import Counter


# ============================================================================
# Readability Metrics
# ============================================================================

def count_syllables(word):
    """Estimate syllable count for a word."""
    word = word.lower().strip()
    if len(word) <= 3:
        return 1

    # Remove trailing 'e'
    if word.endswith("e"):
        word = word[:-1]

    vowels = "aeiou"
    count = 0
    prev_vowel = False

    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel

    return max(1, count)


def split_sentences(text):
    """Split text into sentences."""
    sentences = re.split(r'[.!?]+', text)
    return [s.strip() for s in sentences if s.strip() and len(s.strip()) > 5]


def split_words(text):
    """Split text into words."""
    return re.findall(r'\b[a-zA-Z]+\b', text)


def flesch_kincaid_grade(text):
    """
    Compute Flesch-Kincaid Grade Level.
    Lower is easier to read. Academic writing typically scores 12-16.
    """
    sentences = split_sentences(text)
    words = split_words(text)

    if not sentences or not words:
        return 0.0

    num_sentences = len(sentences)
    num_words = len(words)
    num_syllables = sum(count_syllables(w) for w in words)

    grade = (0.39 * (num_words / num_sentences) +
             11.8 * (num_syllables / num_words) - 15.59)
    return max(0.0, grade)


def flesch_reading_ease(text):
    """
    Compute Flesch Reading Ease score.
    Higher is easier. Academic writing typically scores 30-50.
    Range: 0-100 (can go negative for very complex text).
    """
    sentences = split_sentences(text)
    words = split_words(text)

    if not sentences or not words:
        return 0.0

    num_sentences = len(sentences)
    num_words = len(words)
    num_syllables = sum(count_syllables(w) for w in words)

    score = (206.835 - 1.015 * (num_words / num_sentences) -
             84.6 * (num_syllables / num_words))
    return max(0.0, min(100.0, score))


def gunning_fog_index(text):
    """
    Compute Gunning Fog Index.
    Estimates years of education needed. Academic writing: 12-18.
    """
    sentences = split_sentences(text)
    words = split_words(text)

    if not sentences or not words:
        return 0.0

    num_sentences = len(sentences)
    num_words = len(words)
    complex_words = sum(1 for w in words if count_syllables(w) >= 3)

    fog = 0.4 * ((num_words / num_sentences) +
                  100.0 * (complex_words / num_words))
    return max(0.0, fog)


def compute_readability_score(text):
    """
    Compute an overall readability score (0-100) for academic writing.
    Considers Flesch-Kincaid grade level and reading ease.
    """
    words = split_words(text)
    if len(words) < 20:
        return 20.0  # Too short to evaluate properly

    fk_grade = flesch_kincaid_grade(text)
    fre = flesch_reading_ease(text)

    # For academic proposals, ideal FK grade: 10-14, ideal FRE: 30-60
    # Score FK grade (10-14 is ideal for academic writing)
    if 10 <= fk_grade <= 14:
        fk_score = 90.0
    elif 8 <= fk_grade < 10 or 14 < fk_grade <= 16:
        fk_score = 75.0
    elif 6 <= fk_grade < 8 or 16 < fk_grade <= 18:
        fk_score = 55.0
    else:
        fk_score = 35.0

    # Score FRE (30-60 is ideal for academic proposals)
    if 30 <= fre <= 60:
        fre_score = 90.0
    elif 20 <= fre < 30 or 60 < fre <= 70:
        fre_score = 70.0
    elif 10 <= fre < 20 or 70 < fre <= 80:
        fre_score = 50.0
    else:
        fre_score = 30.0

    # Average sentence length score (ideal: 15-25 words)
    sentences = split_sentences(text)
    if sentences:
        avg_sent_len = len(words) / len(sentences)
        if 15 <= avg_sent_len <= 25:
            sent_score = 90.0
        elif 10 <= avg_sent_len < 15 or 25 < avg_sent_len <= 35:
            sent_score = 70.0
        else:
            sent_score = 40.0
    else:
        sent_score = 20.0

    # Weighted combination
    readability = (fk_score * 0.35 + fre_score * 0.35 + sent_score * 0.30)
    return round(min(100.0, max(0.0, readability)), 1)


# ============================================================================
# Structure / Section Detection
# ============================================================================

PROPOSAL_SECTIONS = {
    "title": {
        "keywords": ["title", "project title", "project name"],
        "weight": 0.05,
    },
    "problem_statement": {
        "keywords": [
            "problem statement", "problem", "motivation", "background",
            "issue", "challenge", "gap", "need", "current limitation"
        ],
        "weight": 0.20,
    },
    "objectives": {
        "keywords": [
            "objective", "objectives", "aim", "aims", "goal", "goals",
            "purpose", "research question", "research questions"
        ],
        "weight": 0.15,
    },
    "scope": {
        "keywords": [
            "scope", "boundary", "boundaries", "limitation", "limitations",
            "delimitation", "constraint", "constraints"
        ],
        "weight": 0.10,
    },
    "methodology": {
        "keywords": [
            "methodology", "method", "methods", "approach", "framework",
            "technique", "design", "research design", "research method",
            "data collection", "analysis method", "implementation"
        ],
        "weight": 0.20,
    },
    "literature_review": {
        "keywords": [
            "literature review", "literature", "related work", "related works",
            "previous work", "previous research", "existing solution",
            "existing system", "state of the art", "prior work"
        ],
        "weight": 0.15,
    },
    "expected_outcomes": {
        "keywords": [
            "expected outcome", "expected outcomes", "expected result",
            "expected results", "deliverable", "deliverables",
            "contribution", "contributions", "output", "outputs"
        ],
        "weight": 0.10,
    },
    "timeline": {
        "keywords": [
            "timeline", "schedule", "gantt", "milestone", "milestones",
            "project plan", "work plan", "work breakdown"
        ],
        "weight": 0.05,
    },
}


# The backend (StudentProposalController.buildAnalyzerProse) emits each section
# under a fixed label, e.g. "Methodology:\n<body>". Mapping section key -> label
# lets us score the BODY after each label instead of the mere presence of the
# label text — which the backend injects regardless of content.
SECTION_LABELS = {
    "title": "Title",
    "problem_statement": "Problem Statement",
    "objectives": "Objectives",
    "methodology": "Methodology",
    "scope": "Scope",
    "expected_outcomes": "Expected Outcomes",
    "timeline": "Timeline",
}

# Minimum body word count for a labelled section to count as genuinely present.
# This is what closes the "label leak": a one-word "Methodology: x" must NOT
# score like a developed methodology section.
SECTION_MIN_WORDS = {
    "title": 2, "timeline": 5, "objectives": 6, "expected_outcomes": 6,
    "problem_statement": 12, "methodology": 12, "scope": 10,
}


def parse_labeled_sections(text):
    """Split the backend's labelled prose into a {section_key: body} map.
    Robust to missing sections and arbitrary order. Returns only sections whose
    label is present; the body is everything up to the next known label."""
    label_to_key = {v: k for k, v in SECTION_LABELS.items()}
    pattern = re.compile(
        r"(?im)^[ \t]*(" + "|".join(re.escape(v) for v in SECTION_LABELS.values()) + r")[ \t]*:[ \t]*$"
    )
    matches = list(pattern.finditer(text))
    out = {}
    for idx, m in enumerate(matches):
        key = label_to_key.get(m.group(1).strip())
        if not key:
            continue
        start = m.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        out[key] = text[start:end].strip()
    return out


def detect_sections(text):
    """
    Detect which proposal sections are present AND substantive.

    A labelled section counts only when its BODY clears a minimum word count, so
    the section_completeness metric reflects content rather than the labels the
    backend prepends. literature_review has no dedicated form field, so it still
    falls back to keyword evidence anywhere in the text.
    Returns (dict section -> {found, weight, body_words}, completeness%).
    """
    text_lower = text.lower()
    parsed = parse_labeled_sections(text)
    results = {}
    total_weight = 0.0
    found_weight = 0.0

    for section, config in PROPOSAL_SECTIONS.items():
        total_weight += config["weight"]
        if section in SECTION_LABELS:
            body = parsed.get(section, "")
            wc = len(split_words(body))
            found = wc >= SECTION_MIN_WORDS.get(section, 12)
        else:
            wc = 0
            found = any(kw in text_lower for kw in config["keywords"])
        results[section] = {"found": found, "weight": config["weight"], "body_words": wc}
        if found:
            found_weight += config["weight"]

    completeness = (found_weight / total_weight * 100) if total_weight > 0 else 0
    return results, round(completeness, 1)


# ============================================================================
# Redundancy guard (anti-padding)
# ============================================================================
# Pasting the same sentence many times must NOT inflate the score. We collapse
# exact-duplicate sentences before scoring, and `redundancy_ratio` measures how
# much was padding so the caller can additionally penalise heavy repetition.

_REBUILD_ORDER = [
    ("title", "Title"), ("problem_statement", "Problem Statement"),
    ("objectives", "Objectives"), ("methodology", "Methodology"),
    ("scope", "Scope"), ("expected_outcomes", "Expected Outcomes"),
    ("timeline", "Timeline"),
]


def _dedupe_body(body, seen):
    """Drop exact-normalised duplicate sentences within a body (keeping the first
    occurrence), preserving line structure. `seen` accumulates across sections so a
    sentence pasted into several fields is collapsed too. List numbering is ignored
    when comparing so '1. X' and '2. X' both count as the sentence 'X'."""
    out_lines = []
    for line in body.split("\n"):
        if not line.strip():
            out_lines.append("")
            continue
        kept = []
        for s in re.split(r"(?<=[.!?])\s+", line):
            norm = re.sub(r"^\s*\d+[.)]\s*", "", s)
            norm = re.sub(r"\s+", " ", norm).strip().lower()
            if len(norm) < 8:
                kept.append(s)          # keep short fragments / labels / markers
                continue
            if norm in seen:
                continue                # drop the duplicate
            seen.add(norm)
            kept.append(s)
        out_lines.append(" ".join(x.strip() for x in kept if x.strip()))
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out_lines)).strip()


def collapse_redundancy(text):
    """Return the proposal with exact-duplicate sentences removed, so repeating a
    sentence cannot inflate (or change) the score. Preserves the labelled-section
    structure so downstream parsing/scoring still works."""
    seen = set()
    parsed = parse_labeled_sections(text)
    if not parsed:
        return _dedupe_body(text, seen)
    blocks = []
    for key, label in _REBUILD_ORDER:
        if key in parsed:
            body = _dedupe_body(parsed[key], seen)
            if body.strip():
                blocks.append(f"{label}:\n{body.strip()}")
    return "\n\n".join(blocks)


def redundancy_ratio(text):
    """Fraction of words removed by collapsing exact-duplicate sentences.
    0 = no repetition; → 1 = heavily padded with duplicates."""
    orig = len(split_words(text))
    if orig == 0:
        return 0.0
    deduped = len(split_words(collapse_redundancy(text)))
    return max(0.0, round((orig - deduped) / orig, 3))


def compute_structure_score(text):
    """
    Compute a structure/completeness score (0-100) for the proposal.
    """
    sections, completeness = detect_sections(text)
    words = split_words(text)
    word_count = len(words)

    # Word count scoring (ideal proposal: 500-3000 words)
    if 500 <= word_count <= 3000:
        length_score = 90.0
    elif 300 <= word_count < 500 or 3000 < word_count <= 5000:
        length_score = 70.0
    elif 100 <= word_count < 300:
        length_score = 45.0
    else:
        length_score = 25.0

    # Paragraph structure (check for logical paragraph breaks)
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]

    if len(paragraphs) >= 5:
        paragraph_score = 85.0
    elif len(paragraphs) >= 3:
        paragraph_score = 65.0
    else:
        paragraph_score = 35.0

    # Combine scores
    structure = (completeness * 0.50 + length_score * 0.30 + paragraph_score * 0.20)
    return round(min(100.0, max(0.0, structure)), 1)


# ============================================================================
# Scope Analysis
# ============================================================================

TECHNICAL_KEYWORDS = [
    "algorithm", "system", "application", "framework", "model", "database",
    "api", "interface", "architecture", "protocol", "network", "machine learning",
    "deep learning", "neural network", "classification", "prediction", "analysis",
    "optimization", "automation", "visualization", "detection", "recognition",
    "processing", "simulation", "encryption", "authentication", "cloud",
    "mobile", "web", "iot", "blockchain", "microservice",
]

METHODOLOGY_KEYWORDS = [
    "agile", "waterfall", "scrum", "prototype", "prototyping", "iterative",
    "incremental", "design science", "experimental", "survey", "case study",
    "qualitative", "quantitative", "mixed method", "sdlc", "uml",
    "testing", "unit test", "integration test", "user acceptance",
]


def compute_scope_score(text):
    """
    Compute a scope appropriateness score (0-100).
    Evaluates if the proposal has adequate technical depth without being
    too broad or too narrow.
    """
    text_lower = text.lower()
    words = split_words(text)
    word_count = len(words)

    if word_count < 30:
        return 15.0

    # Count technical keyword mentions
    tech_count = sum(1 for kw in TECHNICAL_KEYWORDS if kw in text_lower)
    method_count = sum(1 for kw in METHODOLOGY_KEYWORDS if kw in text_lower)

    # Technical depth scoring
    if 5 <= tech_count <= 20:
        tech_score = 85.0
    elif 3 <= tech_count < 5 or 20 < tech_count <= 30:
        tech_score = 65.0
    elif tech_count > 30:
        tech_score = 45.0  # Too broad, trying to cover too much
    else:
        tech_score = 30.0

    # Methodology presence
    if method_count >= 3:
        method_score = 90.0
    elif method_count >= 1:
        method_score = 60.0
    else:
        method_score = 25.0

    # Word count appropriateness for scope
    if 200 <= word_count <= 2500:
        length_score = 80.0
    elif 100 <= word_count < 200 or 2500 < word_count <= 4000:
        length_score = 60.0
    else:
        length_score = 35.0

    scope = (tech_score * 0.40 + method_score * 0.35 + length_score * 0.25)
    return round(min(100.0, max(0.0, scope)), 1)


# ============================================================================
# Innovation / Novelty Analysis
# ============================================================================

# Cheap novelty CLAIMS — writing these words is not evidence of novelty, so they
# are capped hard below. SUBSTANTIVE indicators imply actual reasoning about a
# contribution (improving / comparing / bridging a gap) and are rewarded more.
NOVELTY_CLAIM_WORDS = [
    "novel", "innovative", "original", "unique", "first time",
    "state-of-the-art", "cutting-edge", "groundbreaking", "revolutionary",
]

NOVELTY_SUBSTANTIVE = [
    "new approach", "proposed method", "contribute", "contribution", "advance",
    "improvement", "improve", "enhance", "extend", "overcome", "address the gap",
    "fill the gap", "unlike existing", "different from", "compared to existing",
    "outperform", "reduce", "increase accuracy", "more efficient", "bridge the gap",
]

EXISTING_WORK_REFERENCES = [
    "existing system", "existing solution", "current approach",
    "previous work", "prior research", "related work", "literature",
    "according to", "as shown by", "demonstrated that",
    "et al", "research shows", "studies have shown",
]


def compute_innovation_score(text):
    """
    Compute an innovation/novelty score (0-100).
    Evaluates if the proposal presents novel ideas and acknowledges existing work.
    """
    text_lower = text.lower()
    words = split_words(text)

    if len(words) < 30:
        return 20.0

    claim_count = sum(1 for kw in NOVELTY_CLAIM_WORDS if kw in text_lower)
    subst_count = sum(1 for kw in NOVELTY_SUBSTANTIVE if kw in text_lower)
    ref_count = sum(1 for kw in EXISTING_WORK_REFERENCES if kw in text_lower)

    # Novelty is carried by SUBSTANTIVE reasoning; claim words add only a small,
    # capped bonus and cannot stand alone (a proposal that just says "novel,
    # innovative, unique" with no reasoning is capped at 30).
    base = min(subst_count, 4) * 18.0          # up to 72
    claim_bonus = min(claim_count, 2) * 4.0    # up to 8
    novelty_score = min(80.0, base + claim_bonus)
    if subst_count == 0:
        novelty_score = min(novelty_score, 30.0)

    # Awareness of existing work (important for academic proposals)
    if ref_count >= 4:
        awareness_score = 85.0
    elif ref_count >= 2:
        awareness_score = 60.0
    elif ref_count >= 1:
        awareness_score = 40.0
    else:
        awareness_score = 20.0

    # Balance: a substantiated contribution AND existing-work awareness
    balance_bonus = 15.0 if (subst_count >= 2 and ref_count >= 2) else 0.0

    innovation = (novelty_score * 0.45 + awareness_score * 0.45 + balance_bonus * 0.10)
    return round(min(100.0, max(0.0, innovation)), 1)


# ============================================================================
# Comprehensive Analysis
# ============================================================================

def analyze_proposal_nlp(text):
    """
    Run the full NLP analysis pipeline on a proposal text.

    Returns a dict with all dimensional scores and detailed analysis.
    """
    words = split_words(text)
    sentences = split_sentences(text)
    sections_detected, section_completeness = detect_sections(text)

    clarity_score = compute_readability_score(text)
    structure_score = compute_structure_score(text)
    scope_score = compute_scope_score(text)
    innovation_score = compute_innovation_score(text)

    # Build section analysis from BODY depth, not mere label presence.
    section_analysis = []
    for section_name, section_info in sections_detected.items():
        wc = section_info.get("body_words", 0)
        present = section_info["found"]
        if section_name in SECTION_LABELS:
            target = SECTION_MIN_WORDS.get(section_name, 12) * 3  # ~3x floor = well-developed
            depth = min(1.0, wc / target) if target else (1.0 if present else 0.0)
            section_score = int(round(20 + 70 * depth)) if (present or wc > 0) else 15
        else:
            section_score = 70 if present else 20
        status = "present" if present else ("thin" if wc > 0 else "missing")
        label = section_name.replace('_', ' ')
        if present and section_score >= 70:
            feedback = f"Section '{label}' is present and reasonably developed."
        elif wc > 0 and not present:
            feedback = (f"Section '{label}' is present but too thin ({wc} words). "
                        f"Expand it with specific detail.")
        elif present:
            feedback = f"Section '{label}' is present; add more depth to strengthen it."
        else:
            feedback = (f"Section '{label}' appears to be missing. "
                        f"Consider adding it to strengthen your proposal.")
        section_analysis.append({
            "section": section_name,
            "status": status,
            "score": section_score,
            "feedback": feedback,
        })

    # Generate strengths and weaknesses
    strengths = []
    weaknesses = []
    suggestions = []

    if clarity_score >= 70:
        strengths.append("Writing clarity is good with appropriate academic language.")
    elif clarity_score >= 50:
        weaknesses.append("Writing clarity could be improved for better readability.")
        suggestions.append("Review sentence structure and ensure clear, concise academic writing.")
    else:
        weaknesses.append("Writing clarity needs significant improvement.")
        suggestions.append("Consider simplifying complex sentences and improving paragraph structure.")

    if structure_score >= 70:
        strengths.append("Proposal has a well-organized structure with key sections present.")
    elif structure_score >= 50:
        weaknesses.append("Proposal structure is partially complete.")
        missing_sections = [s for s, info in sections_detected.items() if not info["found"]]
        if missing_sections:
            suggestions.append(
                f"Add missing sections: {', '.join(s.replace('_', ' ') for s in missing_sections[:3])}."
            )
    else:
        weaknesses.append("Proposal lacks proper structure and key sections.")
        suggestions.append("Follow a standard proposal template with all required sections.")

    if scope_score >= 70:
        strengths.append("Project scope is well-defined with adequate technical depth.")
    elif scope_score >= 50:
        suggestions.append("Consider refining the project scope with more specific technical details.")
    else:
        weaknesses.append("Project scope needs better definition.")
        suggestions.append("Clearly define project boundaries and expected technical deliverables.")

    if innovation_score >= 70:
        strengths.append("Proposal shows good awareness of existing work and novel contributions.")
    elif innovation_score >= 50:
        suggestions.append("Strengthen the novelty claims and add more references to related work.")
    else:
        weaknesses.append("Innovation and novelty aspects need improvement.")
        suggestions.append("Research existing solutions and clearly state how your approach differs.")

    if len(words) > 300:
        strengths.append(f"Proposal provides adequate detail ({len(words)} words).")
    elif len(words) > 100:
        suggestions.append("Consider expanding the proposal with more specific details.")
    else:
        weaknesses.append(f"Proposal is too brief ({len(words)} words) for proper evaluation.")
        suggestions.append("Expand the proposal to at least 300-500 words with comprehensive details.")

    # Add general suggestions
    if not any("timeline" in s.lower() for s in suggestions):
        if not sections_detected.get("timeline", {}).get("found", False):
            suggestions.append("Include a project timeline with clear milestones and deliverables.")

    if not any("reference" in s.lower() for s in suggestions):
        if innovation_score < 60:
            suggestions.append("Add references to related academic work to strengthen your proposal.")

    return {
        "clarity_score": clarity_score,
        "structure_score": structure_score,
        "scope_score": scope_score,
        "innovation_score": innovation_score,
        "section_analysis": section_analysis,
        "section_completeness": section_completeness,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "word_count": len(words),
        "sentence_count": len(sentences),
        "readability_grade": round(flesch_kincaid_grade(text), 1),
        "reading_ease": round(flesch_reading_ease(text), 1),
    }
