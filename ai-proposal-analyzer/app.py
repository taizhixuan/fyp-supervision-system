import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = None
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

ANALYSIS_SYSTEM_PROMPT = """You are an expert academic proposal reviewer for Final Year Projects (FYP) at a university.
Analyze the given proposal and provide a structured assessment.

Return your analysis as a JSON object with exactly this structure:
{
  "overallScore": <number 0-100>,
  "feasibilityScore": <number 0-100>,
  "innovationScore": <number 0-100>,
  "clarityScore": <number 0-100>,
  "scopeScore": <number 0-100>,
  "plagiarismScore": <number 0-100, where 100 means completely original>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...],
  "sectionAnalysis": [
    {
      "section": "<section name>",
      "score": <number 0-100>,
      "feedback": "<detailed feedback for this section>"
    }
  ],
  "summary": "<2-3 sentence overall summary>"
}

Be constructive, specific, and fair in your assessment. Consider:
- Technical feasibility within a typical FYP timeline (2 semesters)
- Innovation and originality of the proposed approach
- Clarity of writing, problem statement, and objectives
- Appropriate scope (not too broad, not too narrow)
- Research methodology and approach
"""


def analyze_with_openai(proposal_content, sections=None):
    """Use OpenAI to analyze the proposal content."""
    if not client:
        return generate_fallback_analysis(proposal_content)

    try:
        user_prompt = f"Analyze this FYP proposal:\n\n{proposal_content}"
        if sections:
            user_prompt += f"\n\nThe proposal has these sections: {', '.join(sections)}"

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=2000,
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content.strip()
        return json.loads(result_text)

    except Exception as e:
        logger.warning(f"OpenAI analysis failed: {e}")
        return generate_fallback_analysis(proposal_content)


def generate_fallback_analysis(proposal_content):
    """Generate a basic analysis without OpenAI."""
    word_count = len(proposal_content.split()) if proposal_content else 0

    # Basic heuristic scoring
    clarity_score = min(80, 40 + (word_count // 50))
    scope_score = 60 if 200 < word_count < 2000 else 40
    feasibility_score = 65
    innovation_score = 55

    overall = int((clarity_score + scope_score + feasibility_score + innovation_score) / 4)

    strengths = []
    weaknesses = []
    suggestions = []

    if word_count > 300:
        strengths.append("The proposal provides adequate detail.")
    else:
        weaknesses.append("The proposal could benefit from more detailed explanation.")
        suggestions.append("Expand the proposal with more specific details about methodology and approach.")

    if word_count > 100:
        strengths.append("Clear attempt to define the project scope.")
    else:
        weaknesses.append("The proposal is too brief to assess properly.")
        suggestions.append("Provide a more comprehensive description of the project.")

    suggestions.append("Consider adding a timeline or Gantt chart for project milestones.")
    suggestions.append("Include references to related work to strengthen the proposal.")

    return {
        "overallScore": overall,
        "feasibilityScore": feasibility_score,
        "innovationScore": innovation_score,
        "clarityScore": clarity_score,
        "scopeScore": scope_score,
        "plagiarismScore": 85,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "sectionAnalysis": [
            {
                "section": "Overall Content",
                "score": overall,
                "feedback": f"The proposal contains {word_count} words. AI-powered detailed analysis requires an OpenAI API key to be configured.",
            }
        ],
        "summary": (
            f"This proposal contains {word_count} words. "
            "A basic structural analysis has been performed. "
            "For detailed AI-powered feedback, ensure the OpenAI API key is configured."
        ),
    }


@app.route("/ai/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ai-proposal-analyzer"})


@app.route("/ai/analyze-proposal", methods=["POST"])
def analyze_proposal():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        proposal_content = data.get("proposalContent", "")
        sections = data.get("sections", [])

        if not proposal_content:
            return jsonify({"error": "proposalContent is required"}), 400

        result = analyze_with_openai(proposal_content, sections)

        from datetime import datetime, timezone

        result["analyzedAt"] = datetime.now(timezone.utc).isoformat()

        return jsonify(result)

    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5002))
    app.run(host="0.0.0.0", port=port, debug=True)
