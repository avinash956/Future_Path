from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from config import Config
import os
from flask_mail import Mail

from extensions import mongo, bcrypt, jwt

# ======================
# BLUEPRINT IMPORTS
# ======================
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.ai_routes import ai_bp as ai_routes_bp
from routes.contact_routes import contact_bp
from routes.about_routes import about_bp
from routes.media_routes import media_bp
from routes.management_routes import management_bp
from routes.student_routes import student_bp
from routes.faculty_routes import faculty_bp
from routes.batch_routes import batch_bp
from routes.fees_routes import fees_bp
from routes.management_portal_routes import management_portal_bp
from routes.notes_video_routes import notes_video_bp
from routes.live_streaming_routes import live_bp
from routes.faculty_portal_routes import faculty_portal_bp
from routes.student_portal_routes import student_portal_bp

# ======================
# APP FACTORY
# ======================
def create_app():
    app = Flask(__name__)

    # ======================
    # CONFIG
    # ======================
    app.config["MONGO_URI"] = Config.MONGO_URI
    app.config["SECRET_KEY"] = Config.SECRET_KEY

    # JWT CONFIG (ONLY ONCE)
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = Config.JWT_ACCESS_TOKEN_EXPIRES

    # MAIL CONFIG
    app.config['MAIL_SERVER'] = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('SMTP_PORT', 587))
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.getenv('EMAIL_USER')
    app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PASS')
    app.config['MAIL_DEFAULT_SENDER'] = ('Future Path Admin', os.getenv('EMAIL_USER'))

    # ======================
    # EXTENSIONS INIT
    # ======================
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # @app.after_request
    # def after_request(response):
    #     response.headers.add("Access-Control-Allow-Origin", "*")
    #     response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    #     response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
    #     return response

    # INIT EXTENSIONS (ONLY ONCE)
    mongo.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    mail = Mail()
    mail.init_app(app)

    # ======================
    # MONGODB DEBUG CHECK
    # ======================
    with app.app_context():
        try:
            print("\n==============================")
            print("🔍 MONGODB CONNECTION CHECK")
            print("==============================")

            mongo.cx.admin.command("ping")

            print("✅ MongoDB Status: CONNECTED")

            try:
                print("📡 Cluster Info:", mongo.cx.address)
            except Exception:
                print("📡 Cluster Info: Not available")

            print("🗄️ Database:", mongo.db.name)

            collections = mongo.db.list_collection_names()
            print("📦 Collections Found:", len(collections))
            print(collections)

            print("==============================\n")

        except Exception as e:
            print("\n❌ MONGODB CONNECTION FAILED")
            print("TYPE:", type(e).__name__)
            print("MESSAGE:", str(e))
            print("==============================\n")

    # ======================
    # REGISTER BLUEPRINTS
    # ======================
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(ai_routes_bp, url_prefix="/api/ai")
    app.register_blueprint(contact_bp, url_prefix="/api/contact")
    app.register_blueprint(about_bp, url_prefix="/api/about")
    app.register_blueprint(media_bp, url_prefix="/api/media")
    app.register_blueprint(management_bp, url_prefix="/api/management")
    app.register_blueprint(batch_bp, url_prefix="/api/batch")
    app.register_blueprint(fees_bp, url_prefix="/api/fees")
    app.register_blueprint(management_portal_bp, url_prefix="/api/management_portal")
    app.register_blueprint(notes_video_bp, url_prefix="/api/materials")
    app.register_blueprint(faculty_portal_bp, url_prefix="/api/faculty_portal")
    app.register_blueprint(student_portal_bp, url_prefix="/api/student_portal")
    
    # ✅ LIVE STREAM FIXED
    app.register_blueprint(live_bp, url_prefix="/api/live")

    # ======================
    # HEALTH CHECK
    # ======================
    @app.route("/api/health")
    def health():
        try:
            mongo.cx.admin.command("ping")
            mongo_status = "connected"
        except Exception:
            mongo_status = "not connected"

        return jsonify({
            "success": True,
            "status": "OK",
            "mongo": mongo_status
        })

    # ======================
    # HOME
    # ======================
    @app.route("/")
    def home():
        return jsonify({
            "success": True,
            "message": "🚀 Future Path Backend Running Successfully"
        })

    # ======================
    # UPLOADS
    # ======================
    @app.route("/uploads/<path:filename>")
    def uploaded_files(filename):
        return send_from_directory("uploads", filename)

    # ======================
    # GLOBAL ERROR HANDLER
    # ======================
    @app.errorhandler(Exception)
    def handle_error(e):
        print("\n🔥 BACKEND ERROR")
        print("TYPE:", type(e).__name__)
        print("MESSAGE:", str(e))

        return jsonify({
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }), 500

    return app


# ======================
# RUN SERVER
# ======================
if __name__ == "__main__":
    app = create_app()

    print("\n===================================")
    print("🚀 SERVER STARTING")
    print("📍 http://127.0.0.1:5000")
    print("===================================\n")

    app.run(debug=True, host="0.0.0.0", port=5000)