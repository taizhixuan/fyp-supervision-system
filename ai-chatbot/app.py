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

CHATBOT_SYSTEM_PROMPT = """You are an intelligent FYP (Final Year Project) assistant for MMU (Multimedia University) students.
You help students with questions about their Final Year Project, including:

1. FYP process and requirements (proposal submission, milestones, deadlines)
2. Research methodology guidance
3. Technical advice on common FYP topics (software engineering, AI/ML, web development, mobile apps, etc.)
4. Writing tips for proposals, reports, and documentation
5. Meeting preparation and supervision best practices
6. Time management and project planning

Guidelines:
- Be helpful, encouraging, and professional
- Provide specific, actionable advice
- If you're unsure about MMU-specific policies, say so and suggest the student check with their supervisor or FYP committee
- Keep responses concise but thorough
- Reference relevant academic resources when appropriate
- Do not make up specific university policies or deadlines

When the student provides context about their project, tailor your advice to their specific situation."""

# Common FYP-related knowledge base for RAG-lite context
FYP_KNOWLEDGE = {
    "proposal": (
        "An FYP proposal typically includes: title, problem statement, objectives, scope, "
        "literature review summary, proposed methodology, expected outcomes, and timeline. "
        "The proposal should be clear, feasible within the given timeframe, and demonstrate "
        "understanding of the problem domain."
    ),
    "meeting_log": (
        "Meeting logs (MMU FCI format) document supervision meetings. They include: "
        "student/supervisor details, meeting date, discussion summary, work done, "
        "work to be done, problems encountered and solutions, and signatures from both parties. "
        "Meeting logs should be submitted promptly after each supervision meeting."
    ),
    "timeline": (
        "A typical FYP timeline spans 2 semesters. FYP1 focuses on proposal, literature review, "
        "and initial design. FYP2 focuses on implementation, testing, and final report. "
        "Key milestones include: proposal submission, mid-term presentation, final presentation, "
        "and report submission."
    ),
    "report": (
        "The FYP report typically follows this structure: Abstract, Introduction, Literature Review, "
        "Methodology, System Design, Implementation, Testing & Evaluation, Conclusion & Future Work, "
        "References, Appendices. Use IEEE or APA citation format as specified by your programme."
    ),
}


def get_relevant_context(message):
    """Simple keyword-based context retrieval."""
    message_lower = message.lower()
    contexts = []

    for keyword, info in FYP_KNOWLEDGE.items():
        if keyword in message_lower:
            contexts.append(info)

    # Also check for related terms
    if any(term in message_lower for term in ["write", "writing", "report", "document"]):
        if FYP_KNOWLEDGE["report"] not in contexts:
            contexts.append(FYP_KNOWLEDGE["report"])

    if any(term in message_lower for term in ["schedule", "plan", "time", "deadline", "milestone"]):
        if FYP_KNOWLEDGE["timeline"] not in contexts:
            contexts.append(FYP_KNOWLEDGE["timeline"])

    if any(term in message_lower for term in ["supervision", "meeting", "log", "supervisor"]):
        if FYP_KNOWLEDGE["meeting_log"] not in contexts:
            contexts.append(FYP_KNOWLEDGE["meeting_log"])

    return "\n\n".join(contexts) if contexts else ""


def generate_chat_response(message, session_history, context=None):
    """Generate a chat response using OpenAI or fallback."""
    if not client:
        return generate_fallback_response(message)

    try:
        messages = [{"role": "system", "content": CHATBOT_SYSTEM_PROMPT}]

        # Add relevant FYP context
        relevant_context = get_relevant_context(message)
        if relevant_context:
            messages.append({
                "role": "system",
                "content": f"Relevant FYP information:\n{relevant_context}",
            })

        # Add user-provided context
        if context:
            messages.append({
                "role": "system",
                "content": f"Student's project context: {json.dumps(context)}",
            })

        # Add session history (last 20 messages to stay within token limits)
        if session_history:
            for msg in session_history[-20:]:
                role = "user" if msg.get("sender") == "USER" else "assistant"
                messages.append({"role": role, "content": msg.get("content", "")})

        # Add current message
        messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )

        reply = response.choices[0].message.content.strip()

        # Extract any references mentioned
        references = extract_references(reply)

        return {
            "reply": reply,
            "references": references,
            "confidence": 0.85,
        }

    except Exception as e:
        logger.warning(f"OpenAI chat failed: {e}")
        return generate_fallback_response(message)


def generate_fallback_response(message):
    """Generate a basic response without OpenAI."""
    message_lower = message.lower()

    if any(term in message_lower for term in ["hello", "hi", "hey", "greet"]):
        reply = (
            "Hello! I'm your FYP assistant. I can help you with questions about "
            "your Final Year Project, including proposals, meetings, timelines, "
            "and more. What would you like to know?"
        )
    elif any(term in message_lower for term in ["proposal", "submit"]):
        reply = (
            "Regarding FYP proposals: " + FYP_KNOWLEDGE["proposal"] +
            "\n\nWould you like more specific advice about any part of the proposal?"
        )
    elif any(term in message_lower for term in ["meeting", "log", "supervision"]):
        reply = (
            "About meeting logs: " + FYP_KNOWLEDGE["meeting_log"] +
            "\n\nDo you have specific questions about meeting logs?"
        )
    elif any(term in message_lower for term in ["timeline", "schedule", "plan", "deadline"]):
        reply = (
            "About FYP timelines: " + FYP_KNOWLEDGE["timeline"] +
            "\n\nWould you like help creating a project timeline?"
        )
    elif any(term in message_lower for term in ["report", "write", "document"]):
        reply = (
            "About FYP reports: " + FYP_KNOWLEDGE["report"] +
            "\n\nWould you like guidance on any specific section?"
        )
    else:
        reply = (
            "I can help you with various FYP-related topics including:\n\n"
            "- **Proposal writing** and submission guidelines\n"
            "- **Meeting logs** and supervision documentation\n"
            "- **Project timeline** and milestone planning\n"
            "- **Report writing** and formatting\n"
            "- **Technical guidance** for your project\n\n"
            "For more detailed AI-powered assistance, ensure the OpenAI API key is configured. "
            "What would you like to know more about?"
        )

    return {
        "reply": reply,
        "references": [],
        "confidence": 0.5,
    }


def extract_references(text):
    """Extract any referenced topics or links from the response."""
    references = []
    keywords = {
        "proposal": "FYP Proposal Guidelines",
        "meeting log": "Meeting Log Documentation",
        "literature review": "Literature Review Guide",
        "methodology": "Research Methodology",
        "IEEE": "IEEE Citation Format",
        "APA": "APA Citation Format",
    }

    text_lower = text.lower()
    for keyword, title in keywords.items():
        if keyword in text_lower:
            references.append({"title": title, "type": "topic"})

    return references[:5]


@app.route("/ai/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ai-chatbot"})


@app.route("/ai/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        message = data.get("message", "")
        session_history = data.get("sessionHistory", [])
        context = data.get("context")

        if not message:
            return jsonify({"error": "message is required"}), 400

        result = generate_chat_response(message, session_history, context)

        return jsonify(result)

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5003))
    app.run(host="0.0.0.0", port=port, debug=True)
