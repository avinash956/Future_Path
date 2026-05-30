from flask import Blueprint, request, jsonify
from services.groq_ai import ask_groq
from utils.intent import detect_intent

ai_bp = Blueprint("ai_bp", __name__)


@ai_bp.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message")

    intent = detect_intent(message)

    # ---------------- FEES (STATIC PUBLIC INFO) ----------------
    if intent == "fees":
        return jsonify({
            "reply": (
                "📚 Coaching Fees:\n"
                "- Science: ₹2000/month\n"
                "- Commerce: ₹1800/month\n"
                "- Admission Fee: ₹500 one-time\n"
                "For exact details, contact admin."
            )
        })

    # ---------------- TIMETABLE (STATIC) ----------------
    if intent == "timetable":
        return jsonify({
            "reply": (
                "🗓 Weekly Timetable:\n"
                "Mon: Math + Physics\n"
                "Tue: Chemistry + English\n"
                "Wed: Math + Lab\n"
                "Thu: Physics + Revision\n"
                "Fri: Test\n"
            )
        })

    # ---------------- EXAMS (STATIC) ----------------
    if intent == "exams":
        return jsonify({
            "reply": (
                "📝 Upcoming Exams:\n"
                "- Unit Test: 10 June\n"
                "- Mid Term: 25 July\n"
                "- Final Exam: 15 Dec"
            )
        })

    # ---------------- DOUBTS (GROQ AI) ----------------
    ai_response = ask_groq(message)

    return jsonify({"reply": ai_response})
 # ---------------- AI FALLBACK----------------
    ai_response = ask_groq(message)
    return jsonify({"reply": ai_response})