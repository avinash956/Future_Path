from xmlrpc import client
from dotenv import load_dotenv
import os
from pymongo import MongoClient
# ======================
# LOAD ENV VARIABLES
# ======================
load_dotenv()
# ======================
# CONFIG CLASS
# ======================
class Config:
    # ======================
    # DATABASE
    # ======================

    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        raise Exception("❌ MONGO_URI missing in .env")
    
    client = MongoClient(MONGO_URI)
    db = client["futurepath_db"]
    print("✅ DB LOADED:", db.name)
    # ======================
    # SECURITY
    # ======================

    SECRET_KEY = os.getenv("SECRET_KEY")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # ======================
    # GEMINI AI
    # ======================

    GEMINI_API_KEY = os.getenv(
        "GEMINI_API_KEY"
    )

    # ======================
    # FRONTEND URL
    # ======================

    FRONTEND_URL = os.getenv("FRONTEND_URL","http://127.0.0.1:5500")

    # ======================
    # FILE UPLOAD SETTINGS
    # ======================

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER","uploads")

    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    # ======================
    # JWT TOKEN SETTINGS
    # ======================

    JWT_ACCESS_TOKEN_EXPIRES = 86400

    # ======================
    # OPTIONAL FLAGS
    # ======================

    DEBUG = True

    TESTING = False


# ======================
# CONFIG DEBUG
# ======================

print("\n===== CONFIG DEBUG =====")

print("MONGO_URI LOADED:",Config.MONGO_URI is not None)

print("SECRET_KEY LOADED:",Config.SECRET_KEY is not None)

print("GEMINI_API_KEY LOADED:",Config.GEMINI_API_KEY is not None)

print("JWT_SECRET_KEY LOADED:",Config.JWT_SECRET_KEY is not None)

print("FRONTEND_URL:",Config.FRONTEND_URL)

print("UPLOAD_FOLDER:",Config.UPLOAD_FOLDER)

print("MAX_CONTENT_LENGTH:",Config.MAX_CONTENT_LENGTH)

print("JWT_ACCESS_TOKEN_EXPIRES:",Config.JWT_ACCESS_TOKEN_EXPIRES)
print("========================\n")

# Create an instance of Config to export variables globally
config = Config()
db = config.db
