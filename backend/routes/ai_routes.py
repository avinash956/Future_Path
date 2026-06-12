from flask import Blueprint, request, jsonify, current_app
from google import genai
from google.genai import types  # Import types for correct configuration
from pydantic import BaseModel, Field
from typing import List, Optional
from config import Config
from extensions import mongo
import jwt
import time
import traceback

ai_bp = Blueprint("ai", __name__)

# =====================================================
# GEMINI CLIENT & SCHEMA DEFINITIONS
# =====================================================

_client = None

def get_client():
    global _client
    if _client:
        return _client
    if not Config.GEMINI_API_KEY:
        return None
    _client = genai.Client(api_key=Config.GEMINI_API_KEY)
    return _client

# Schema to force Gemini to separate sections and limit array items to single sentences
class StudyNotesSchema(BaseModel):
    topic_name: str = Field(description="The clean name of the educational topic.")
    definitions: List[str] = Field(description="Exactly two separate, single-sentence definition points.")
    key_points: List[str] = Field(description="Exactly four separate, single-sentence key points.")
    formula: Optional[List[str]] = Field(default=None, description="Exactly one mathematical formula written in LaTeX format (e.g., \\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}). Leave empty or pass null if not applicable.")
    example: Optional[List[str]] = Field(default=None, description="Exactly one single-sentence practical example.")
    final_summary: List[str] = Field(description="Exactly one single-sentence concluding summary.")


# =====================================================
# STARTUP DEBUG
# =====================================================

print("\n========== GEMINI INITIALIZATION ==========")
if Config.GEMINI_API_KEY:
    print("✅ GEMINI KEY LOADED")
    print("KEY PREVIEW:", Config.GEMINI_API_KEY[:8] + "..." + Config.GEMINI_API_KEY[-4:])
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
            return jsonify({"success": False, "message": "Gemini key missing"}), 500

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Say Hello"
        )
        return jsonify({"success": True, "reply": response.text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# =====================================================
# AI CHAT ROUTE
# =====================================================

@ai_bp.route("/chat", methods=["POST"])
def ai_chat():
    start_time = time.time()

    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "message": "Invalid JSON body"}), 422

        message = str(data.get("message", "")).strip()
        if not message:
            return jsonify({"success": False, "message": "Message is required"}), 422

        client = get_client()
        if not client:
            return jsonify({"success": False, "message": "AI service unavailable"}), 500

        # High-enforcement engineering instructions for structured outputs
        system_instruction = (
                    "You are Future Path EduTech AI Assistant.\n"
                    "You generate structured educational notes.\n\n"

                    "STRICT RULES:\n"
                    "1. Output must be clean structured notes.\n"
                    "2. No markdown (#, *, ```).\n"
                    "3. Each point = ONE sentence only.\n"
                    "4. Max 6–7 key points only.\n"
                    "5. NO paragraph writing allowed.\n\n"

                    "FORMULA RULE (IMPORTANT):\n"
                    "- Always write formulas ONLY inside $$ $$\n"
                    "- Never use \\[ \\] or plain text formulas\n\n"

                    "OUTPUT FORMAT:\n"
                    "Topic\n"
                    "Definition:\n"
                    "Key Points:\n"
                    "Formula:\n"
                    "Example:\n"
                    "Summary:\n"
                )
        try:
            # Explicitly configure GenerateContentConfig using google.genai types
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=StudyNotesSchema,
                temperature=0.1 # Lower temperature means stricter structural alignment
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"User Question: {message}",
                config=config
            )

            # Parse Gemini's validated structural response
            notes_data = StudyNotesSchema.model_validate_json(response.text)

            # Build the exact flat layout string programmatically
            # This completely bypasses AI layout mistakes and guarantees absolute consistency
            reply_lines = []
            
            reply_lines.append(notes_data.topic_name.upper())
            reply_lines.append("")  # Empty line separator
            
            reply_lines.append("Definition:")
            for idx, item in enumerate(notes_data.definitions, 1):
                reply_lines.append(f"{idx}. {item}")
            reply_lines.append("")

            reply_lines.append("Key Points:")
            for idx, item in enumerate(notes_data.key_points, 1):
                reply_lines.append(f"{idx}. {item}")
            reply_lines.append("")

            # Protect against empty arrays or null responses
            if notes_data.formula and len(notes_data.formula) > 0:
                reply_lines.append("Formula:")
                for idx, item in enumerate(notes_data.formula, 1):
                    reply_lines.append(f"{idx}. {item}")
                reply_lines.append("")

            if notes_data.example and len(notes_data.example) > 0:
                reply_lines.append("Example:")
                for idx, item in enumerate(notes_data.example, 1):
                    reply_lines.append(f"{idx}. {item}")
                reply_lines.append("")

            reply_lines.append("Final Summary:")
            for idx, item in enumerate(notes_data.final_summary, 1):
                reply_lines.append(f"{idx}. {item}")

            reply = "\n".join(reply_lines).strip()

        except Exception as gemini_error:
            err = str(gemini_error)
            print("🔥 GEMINI ERROR:", err)
            print(traceback.format_exc())

            if "RESOURCE_EXHAUSTED" in err:
                return jsonify({"success": False, "message": "AI quota exceeded"}), 429
            if "NOT_FOUND" in err:
                return jsonify({"success": False, "message": "AI model not found"}), 503
            return jsonify({"success": False, "message": "AI service temporarily unavailable"}), 503

        # =================================================
        # USER AUTH (FIXED BUG)
        # =================================================
        username = "anonymous"
        role = "guest"

        try:
            auth = request.headers.get("Authorization")
            if auth and auth.startswith("Bearer "):
                token_parts = auth.split(" ")
                if len(token_parts) > 1:
                    token = token_parts[1]
                    if token and token != "guest":
                        secret = current_app.config.get("JWT_SECRET_KEY")
                        if secret:
                            decoded = jwt.decode(token, secret, algorithms=["HS256"])
                            username = decoded.get("username", "anonymous")
                            role = decoded.get("role", "guest")
        except Exception:
            pass

        # =================================================
        # DB LOGGING (SAFE NON-BLOCKING)
        # =================================================
        try:
            mongo.db.ai_logs.insert_one({
                "username": username,
                "role": role,
                "user_message": message,
                "ai_reply": reply,
                "timestamp": time.time(),
                "duration_ms": round((time.time() - start_time) * 1000)
            })
        except Exception as db_err:
            print("⚠ MongoDB logging failed:", db_err)

        # =================================================
        # RESPONSE
        # =================================================
        print(f"✅ AI SUCCESS [{round((time.time() - start_time) * 1000)}ms]")
        return jsonify({
            "success": True,
            "reply": reply
        })

    except Exception as e:
        print("🔥 CRITICAL ERROR:")
        print(traceback.format_exc())
        return jsonify({"success": False, "message": "Internal server error"}), 500