from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from config import Config
import os
from flask_mail import Mail
from extensions import mongo, bcrypt, jwt

# ======================
# IMPORT ROUTES
# ======================
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.ai_routes import ai_bp
from routes.contact_routes import contact_bp
from routes.about_routes import about_bp
from routes.media_routes import media_bp
from routes.management_routes import management_bp
from routes.student_routes import student_bp
from routes.faculty_routes import faculty_bp
from routes.batch_routes import batch_bp
from routes.fees_routes import fees_bp


# ======================
# APP INIT
# ======================
app = Flask(__name__)

# ======================
# CONFIG
# ======================
app.config["MONGO_URI"] = Config.MONGO_URI
app.config["SECRET_KEY"] = Config.SECRET_KEY
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY


# ======================
# EXTENSIONS INIT
# ======================
mongo.init_app(app)
bcrypt.init_app(app)

from flask_jwt_extended import JWTManager
jwt = JWTManager()
jwt.init_app(app)


# ======================
# 🔥 MONGODB CONNECTION DEBUG (RESTORED + IMPROVED)
# ======================
try:
    with app.app_context():
        mongo.cx.admin.command("ping")
        print("\n✅ MongoDB Connected Successfully")
        print(f"📡 Connected Cluster: {mongo.cx.address}")

except Exception as e:
    print("\n❌ MongoDB Connection FAILED")
    print(f"🔥 ERROR TYPE: {type(e).__name__}")
    print(f"🔥 ERROR MSG: {str(e)}")

# ======================
# 🔥 CORS (FINAL STABLE CONFIG)
# ======================
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)
# Load configurations from your exact .env variables
app.config['MAIL_SERVER'] = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('SMTP_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('EMAIL_USER')
app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PASS')
app.config['MAIL_DEFAULT_SENDER'] = ('Future Path Admin', os.getenv('EMAIL_USER'))

# Initialize Flask-Mail
mail = Mail(app)

# ======================
# 🔥 PRE-FLIGHT + RESPONSE FIX
# ======================
@app.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response


# ======================
# 🔍 REQUEST DEBUG LOGGER
# ======================
@app.before_request
def log_request():
    if request.path.startswith("/api"):
        print("\n==============================")
        print("🌐 REQUEST:", request.method, request.path)
        print("🔐 AUTH:", request.headers.get("Authorization"))
        print("📦 CONTENT-TYPE:", request.content_type)
        print("==============================\n")


# ======================
# REGISTER BLUEPRINTS
# ======================
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(student_bp, url_prefix="/api/student")
app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(ai_bp, url_prefix="/api/ai")
app.register_blueprint(contact_bp, url_prefix="/api/contact")
app.register_blueprint(about_bp, url_prefix="/api/about")
app.register_blueprint(media_bp, url_prefix="/api/media")
app.register_blueprint(management_bp, url_prefix="/api/management")
app.register_blueprint(batch_bp, url_prefix="/api/batch")
app.register_blueprint(fees_bp, url_prefix="/api/fees")

# ======================
#  AI chatbot
# ======================
from routes.ai_chatbot_routes import ai_bp

app.register_blueprint(ai_bp, url_prefix="/api")
# ======================
# HOME ROUTE
# ======================
@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "🚀 Future Path Backend Running Successfully"
    })


# ======================
# HEALTH CHECK (IMPORTANT FOR DEBUGGING)
# ======================
@app.route("/api/health")
def health():
    return jsonify({
        "success": True,
        "status": "OK",
        "mongo": "connected" if mongo.db else "not set"
    })


# ======================
# GLOBAL ERROR HANDLER
# ======================
@app.errorhandler(Exception)
def handle_error(e):
    print("\n🔥 BACKEND ERROR TRIGGERED")
    print("TYPE:", type(e).__name__)
    print("ERROR:", str(e))

    return jsonify({
        "success": False,
        "error": str(e),
        "type": type(e).__name__
    }), 500
print("\n===== REGISTERED ROUTES =====")

for rule in app.url_map.iter_rules():
    print(rule)

print("=============================\n")

# ======================
# UPLOADS
# ======================
@app.route("/uploads/<path:filename>")
def uploaded_files(filename):
    return send_from_directory("uploads", filename)


# ======================
# RUN SERVER
# ======================
if __name__ == "__main__":
    print("\n===================================")
    print("🚀 SERVER STARTING")
    print("📍 http://127.0.0.1:5000")
    print("===================================\n")

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )