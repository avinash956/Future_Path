from dotenv import load_dotenv
import os
from pymongo import MongoClient
from datetime import timedelta

# ======================
# LOAD ENV VARIABLES
# ======================
load_dotenv()


# ======================
# CONFIG CLASS (CLEAN + SAFE)
# ======================
class Config:

    # ======================
    # DATABASE
    # ======================
    MONGO_URI = os.getenv("MONGO_URI")

    if not MONGO_URI:
        raise Exception("❌ MONGO_URI missing in .env")

    # Create Mongo Client (singleton style)
    _mongo_client = MongoClient(MONGO_URI)
    db = _mongo_client["futurepath_db"]

    print("✅ DB CONNECTED:", db.name)

    # ======================
    # SECURITY
    # ======================

    SECRET_KEY = os.getenv("SECRET_KEY","dev-secret")

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "dev-jwt-secret"
    )

    # =====================================================
    # JWT TOKEN EXPIRY
    # =====================================================

    # OPTION 1 → 30 DAYS
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

    # OPTION 2 → NEVER EXPIRE
    # JWT_ACCESS_TOKEN_EXPIRES = False

    # ======================
    # GEMINI AI
    # ======================
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    # ======================
    # FRONTEND URL
    # ======================
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5500")

    # ======================
    # FILE UPLOAD SETTINGS
    # ======================
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    # ======================
    # JWT SETTINGS
    # ======================
    JWT_ACCESS_TOKEN_EXPIRES = 86400

    # ======================
    # FLAGS
    # ======================
    DEBUG = True
    TESTING = False


# ======================
# GLOBAL EXPORT (USED IN ROUTES)
# ======================
config = Config()
db = Config.db


# ======================
# DEBUG SECTION
# ======================
if __name__ == "__main__":
    print("\n===== CONFIG DEBUG =====")
    print("DB:", db.name)
    print("MONGO OK:", Config.MONGO_URI is not None)
    print("SECRET KEY:", bool(Config.SECRET_KEY))
    print("JWT KEY:", bool(Config.JWT_SECRET_KEY))
    print("FRONTEND:", Config.FRONTEND_URL)
    print("========================\n")