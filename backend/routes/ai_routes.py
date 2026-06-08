from flask import Blueprint, request, jsonify, current_app
import os
from google import genai
from config import Config
from extensions import mongo
import jwt
import time
import traceback

ai_bp = Blueprint("ai", __name__)

# =====================================================
# GEMINI CLIENT
# =====================================================

def get_client():
    """
    Create fresh Gemini client.
    Useful if API key changes and server restarts.
    """
    if not Config.GEMINI_API_KEY:
        return None

    return genai.Client(
        api_key=Config.GEMINI_API_KEY
    )


# =====================================================
# STARTUP DEBUG
# =====================================================

print("\n========== GEMINI INITIALIZATION ==========")

if Config.GEMINI_API_KEY:

    preview = (
        Config.GEMINI_API_KEY[:8]
        + "..."
        + Config.GEMINI_API_KEY[-4:]
    )

    print("✅ GEMINI KEY LOADED")
    print("KEY PREVIEW:", preview)
    print("KEY LENGTH:", len(Config.GEMINI_API_KEY))

else:

    print("❌ GEMINI KEY MISSING")

print("==========================================\n")


# =====================================================
# TEST ROUTE
# =====================================================

@ai_bp.route("/test", methods=["GET"])
def test_ai():

    try:

        client = get_client()

        if not client:
            return jsonify({
                "success": False,
                "message": "Gemini key missing"
            }), 500

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Say Hello"
        )

        return jsonify({
            "success": True,
            "reply": response.text
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =====================================================
# AI CHAT
# =====================================================

@ai_bp.route("/chat", methods=["POST"])
def ai_chat():

    request_start = time.time()

    try:

        print("\n========== NEW AI REQUEST ==========")
        print("TIME:", time.strftime("%Y-%m-%d %H:%M:%S"))
        print("REMOTE IP:", request.remote_addr)

        # =================================================
        # JSON
        # =================================================

        data = request.get_json(silent=True)

        if not data:

            return jsonify({
                "success": False,
                "message": "Invalid JSON body"
            }), 422

        message = str(
            data.get("message", "")
        ).strip()

        if not message:

            return jsonify({
                "success": False,
                "message": "Message is required"
            }), 422

        # =================================================
        # GEMINI
        # =================================================

        client = get_client()

        if not client:

            return jsonify({
                "success": False,
                "message": "Gemini API key missing"
            }), 500

        prompt = f"""
You are Future Path EduTech AI Assistant, an expert teacher for school, college, engineering, diploma, competitive exams, programming, mathematics, science, and technology.

RESPONSE FORMAT RULES:

GENERAL:
- Give clean, professional, student-friendly answers.
- Do NOT use Markdown symbols such as:
  #, ##, ###, *, **, _, -, ``` .
- Use plain text only.
- Avoid unnecessary decorations.
- Keep language clear and educational.

STRUCTURE:

For theory questions use:

TOPIC

Overview:
Brief introduction.

Key Points:
1. Point one
2. Point two
3. Point three

Detailed Explanation:
Explain concepts in simple language using paragraphs and numbered points.

Example:
Give a practical example whenever possible.

Summary:
Provide a short conclusion.

--------------------------------------------------

For science and engineering questions use:

TOPIC

Definition:
...

Working Principle:
1. ...
2. ...
3. ...

Components (if applicable):
1. ...
2. ...
3. ...

Advantages:
1. ...
2. ...
3. ...

Disadvantages:
1. ...
2. ...
3. ...

Applications:
1. ...
2. ...
3. ...

Conclusion:
...

--------------------------------------------------

For mathematics questions:

TOPIC

Given:
...

Formula:
Use LaTeX format enclosed in $$ $$.

Example:
$$x = \\frac{{-b \\pm \\sqrt{{b^2-4ac}}}}{{2a}}$$

Solution:
Step 1:
...

Step 2:
...

Step 3:
...

Final Answer:
...

--------------------------------------------------

For programming questions:

Problem:
...

Approach:
...

Algorithm:
1. ...
2. ...
3. ...

Code:
Provide clean code.

Explanation:
Explain the code line by line.

Output:
...

--------------------------------------------------

For comparison questions:

COMPARISON TABLE

Feature | Item A | Item B

Then provide:
1. Similarities
2. Differences
3. Recommended Usage

--------------------------------------------------

IMPORTANT:

- Always use headings.
- Always use numbered points.
- Always use examples where appropriate.
- Keep answers visually organized.
- Avoid long unstructured paragraphs.
- Avoid Markdown bullets (*).
- Avoid Markdown headings (#).
- Avoid Markdown code fences unless code is requested.
- Make responses look like professional study notes.

User Question:
{message}
"""
        try:

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            reply = response.text.strip()

        except Exception as gemini_error:

            error_text = str(gemini_error)

            print("\n🔥 GEMINI API ERROR")
            print(error_text)

            # -----------------------------------------
            # API KEY DISABLED
            # -----------------------------------------

            if "reported as leaked" in error_text:

                return jsonify({
                    "success": False,
                    "message":
                    "AI service unavailable. API key disabled."
                }), 403

            # -----------------------------------------
            # MODEL ERROR
            # -----------------------------------------

            if "NOT_FOUND" in error_text:

                return jsonify({
                    "success": False,
                    "message":
                    "AI model unavailable."
                }), 503

            # -----------------------------------------
            # QUOTA EXCEEDED
            # -----------------------------------------

            if (
                "RESOURCE_EXHAUSTED"
                in error_text
            ):

                return jsonify({
                    "success": False,
                    "message":
                    "Daily AI quota exceeded. Try again later."
                }), 429

            # -----------------------------------------
            # FALLBACK
            # -----------------------------------------

            return jsonify({
                "success": False,
                "message":
                "AI service temporarily unavailable."
            }), 503

        # =================================================
        # USER LOGGING & DB AUDIT
        # =================================================

        try:
            user_profile = {
                "username": "anonymous",
                "role": "guest"
            }

            auth_header = request.headers.get("Authorization")

            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

                if token != "guest":
                    try:
                        decoded = jwt.decode(
                            token,
                            current_app.config["JWT_SECRET_KEY"],
                            algorithms=["HS256"]
                        )
                        user_profile = decoded
                    except Exception:
                        pass

            # Complete MongoDB interaction safely
            mongo.db.ai_logs.insert_one({
                "username": user_profile.get("username", "anonymous"),
                "role": user_profile.get("role", "guest"),
                "user_message": message,
                "ai_reply": reply,
                "timestamp": time.time(),
                "duration_ms": round((time.time() - request_start) * 1000)
            })

        except Exception as db_err:
            print("⚠ MongoDB Logging Failed:", str(db_err))
            # Pass silently so that DB downtime does not break user chat execution

        # =================================================
        # DISPATCH RESPONSE
        # =================================================
        print(f"✅ REQUEST SUCCESSFUL [{round((time.time() - request_start) * 1000)}ms]")
        return jsonify({
            "success": True,
            "reply": reply
        })

    except Exception as general_error:
        print("\n🔥 CRITICAL CONTROLLER CRASH")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "message": "An unexpected internal server error occurred."
        }), 500