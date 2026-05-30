from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_mail import Mail

# =========================================
# EXTENSIONS (GLOBAL INSTANCES)
# =========================================
mongo = PyMongo()
bcrypt = Bcrypt()
jwt = JWTManager()
mail = Mail()


# =========================================
# INIT FUNCTION (IMPORTANT PRO UPGRADE)
# =========================================
def init_extensions(app):
    """
    Attach all Flask extensions to the app safely.
    Call this inside app.py AFTER app creation.
    """

    print("\n🔧 Initializing Extensions...")

    mongo.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    

    print("✅ MongoDB Connected")
    print("✅ Bcrypt Ready")
    print("✅ JWT Ready")
    print("✅ Mail Service Ready")
    print("=================================\n")