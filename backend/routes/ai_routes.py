from flask import Blueprint, request, jsonify, current_app
# UPDATED: Importing the modern Google GenAI library
from google import genai
from config import Config
from extensions import mongo
import jwt
import time

ai_bp = Blueprint("ai", __name__)

# =========================
# GEMINI INITIALIZATION + DEBUG
# =========================
print("\n========== GEMINI INITIALIZATION ==========")

if not Config.GEMINI_API_KEY:
    print("❌ GEMINI KEY: MISSING")
    client = None
else:
    print("✅ GEMINI KEY LOADED")
    print("KEY PREVIEW:", Config.GEMINI_API_KEY[:8] + "..." + Config.GEMINI_API_KEY[-4:])
    print("KEY LENGTH:", len(Config.GEMINI_API_KEY))
    client = genai.Client(api_key=Config.GEMINI_API_KEY)

print("==========================================\n")


# =========================
# AI CHAT ROUTE
# =========================
@ai_bp.route("/chat", methods=["POST"])
def ai_chat():

    request_start = time.time()

    try:
        # =========================
        # REQUEST DEBUG LAYER 1
        # =========================
        print("\n========== NEW AI REQUEST ==========")
        print("TIME:", time.strftime("%Y-%m-%d %H:%M:%S"))
        print("REMOTE IP:", request.remote_addr)
        print("METHOD:", request.method)
        print("URL:", request.url)

        # HEADERS DEBUG
        print("\n--- HEADERS ---")
        print(dict(request.headers))

        # RAW BODY DEBUG
        print("\n--- RAW BODY ---")
        print(request.data)

        # =========================
        # JSON PARSE DEBUG
        # =========================
        data = request.get_json(silent=True)

        print("\n--- PARSED JSON ---")
        print(data)

        if not data:
            print("❌ JSON ERROR: No valid JSON received")
            return jsonify({
                "stage": "json_parse",
                "message": "Invalid or missing JSON body"
            }), 422

        message = data.get("message")

        print("\nUSER MESSAGE:", message)

        # =========================
        # MESSAGE VALIDATION
        # =========================
        if not message:
            print("❌ VALIDATION ERROR: message is empty")
            return jsonify({
                "stage": "validation",
                "message": "Message is required"
            }), 422

        if not client:
            print("❌ CLIENT ERROR: Gemini client was not initialized due to missing key")
            return jsonify({
                "stage": "gemini_initialization",
                "message": "Gemini API key configuration error"
            }), 500

        # =========================
        # GEMINI REQUEST DEBUG
        # =========================
        print("\n🚀 CALLING GEMINI API...")
        print("MODEL: gemini-2.5-flash")

        try:
            prompt = f"You are Future Path EduTech AI Assistant.\nUser: {message}"

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )

        except Exception as gemini_error:

            print("\n🔥 GEMINI API ERROR")
            print("TYPE:", type(gemini_error))
            print("DETAILS:", repr(gemini_error))

            return jsonify({
                "stage": "gemini_request",
                "message": "Gemini API failed",
                "error": str(gemini_error)
            }), 500

        # =========================
        # RESPONSE DEBUG
        # =========================
        reply = response.text if response else ""

        print("\n✅ GEMINI RESPONSE RECEIVED")
        print("REPLY LENGTH:", len(reply))
        print("REPLY SAMPLE:", reply[:100])

        # =========================
        # SAFE METRIC LOGGING (OPTIONAL AUTH)
        # =========================
        try:
            user_profile = {"username": "anonymous", "role": "guest"}
            auth_header = request.headers.get("Authorization")

            if auth_header and auth_header.startswith("Bearer "):
                parts = auth_header.split(" ")
                
                # Double-verify that it's a real token list block before decoding
                if len(parts) > 1 and parts[1] != "guest":
                    token_str = parts[1]
                    try:
                        decoded = jwt.decode(
                            token_str,
                            current_app.config["JWT_SECRET_KEY"],
                            algorithms=["HS256"]
                        )
                        user_profile = decoded
                    except Exception:
                        print("⚠️ Token decoding failed. Logging as guest session.")

            log_entry = {
                "username": user_profile.get("username", "anonymous"),
                "role": user_profile.get("role", "guest"),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "query_length": len(message)
            }
            
            mongo.db.ai_logs.insert_one(log_entry)
            print(f"📊 AI usage logged to database for role: {user_profile.get('role')}")
            
        except Exception as db_log_error:
            print("⚠️ MongoDB metrics logging failed:", str(db_log_error))

        # =========================
        # FINAL RESPONSE
        # =========================
        total_time = round(time.time() - request_start, 2)

        print("\n⏱ TOTAL TIME:", total_time, "seconds")

        return jsonify({
            "stage": "success",
            "reply": reply,
            "time_taken": total_time
        }), 200

    except Exception as e:

        print("\n🔥 SYSTEM ERROR (UNCAUGHT)")
        print("TYPE:", type(e))
        print("DETAILS:", repr(e))

        return jsonify({
            "stage": "system_error",
            "message": "AI service crashed",
            "error": str(e)
        }), 500