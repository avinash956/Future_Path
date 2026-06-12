from flask import Blueprint, request, jsonify

from extensions import mongo, bcrypt
import random
from datetime import datetime, timedelta, timezone

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    create_access_token
)

from bson.objectid import ObjectId
from bson.errors import InvalidId

from werkzeug.utils import secure_filename

from datetime import datetime, timezone

import secrets
import string
import os
from flask_mail import Message
from extensions import mail
auth_bp = Blueprint("auth", __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# =========================================
# AUTO PASSWORD GENERATOR
# =========================================
def generate_random_password():
    chars = string.ascii_letters + string.digits + "@#$"
    return ''.join(secrets.choice(chars) for _ in range(10))


# =========================================
# CREATE DEFAULT ADMIN
# =========================================
@auth_bp.route("/create-admin")
def create_admin():

    admin_email = "avinash.nha@gmail.com"

    existing = mongo.db.users.find_one({"email": admin_email})

    if existing:
        return jsonify({"message": "Admin already exists"})

    password = "FuturePath@2026"

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    admin = {
        "name": "Super Admin",
        "email": admin_email,
        "password": hashed_password,
        "role": "admin",
        "approved": True
    }

    mongo.db.users.insert_one(admin)

    management_email = "management@futurepath.com"

    existing_management = mongo.db.users.find_one({"email": management_email})

    if not existing_management:

        management_password = "Management@2026"

        hashed_management = bcrypt.generate_password_hash(management_password).decode("utf-8")

        management = {
            "name": "Management",
            "email": management_email,
            "password": hashed_management,
            "role": "management",
            "approved": True
        }

        mongo.db.users.insert_one(management)

    return jsonify({
        "message": "Admin & Management Created Successfully",
        "admin_email": admin_email,
        "admin_password": password,
        "management_email": management_email,
        "management_password": "Management@2026"
    })


# =========================================
# REGISTER
# =========================================
@auth_bp.route("/register", methods=["POST"])
def register():

    try:
        if request.content_type.startswith("multipart/form-data"):

            name = request.form.get("name")
            email = request.form.get("email")
            mobile = request.form.get("mobile")
            role = request.form.get("role")
            profile_pic = request.files.get("profilePic")

        else:
            data = request.json
            name = data.get("name")
            email = data.get("email")
            mobile = data.get("mobile")
            role = data.get("role")
            profile_pic = None

        image_path = ""

        if profile_pic:
            filename = secure_filename(profile_pic.filename)
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            profile_pic.save(image_path)

        allowed_roles = ["management", "faculty", "student"]

        if role not in allowed_roles:
            return jsonify({"message": "Invalid role selected"}), 400

        if not name or not email or not mobile:
            return jsonify({"message": "All fields required"}), 400

        existing_user = mongo.db.users.find_one({
            "$or": [{"email": email}, {"mobile": mobile}]
        })

        if existing_user:
            return jsonify({"message": "Email or Mobile already exists"}), 400

        generated_password = generate_random_password()
        hashed_password = bcrypt.generate_password_hash(generated_password).decode("utf-8")

        user = {
            "name": name,
            "email": email,
            "mobile": mobile,
            "password": hashed_password,
            "role": role,
            "profile_pic": image_path,
            "approved": False,
            "created_at": datetime.now(timezone.utc),
            "last_login": None
        }

        result = mongo.db.users.insert_one(user)

        # ✅ FIXED: identity must be STRING
        token = create_access_token(identity=str(result.inserted_id))

        return jsonify({
            "success": True,
            "message": "Registration submitted. Wait for admin approval.",
            "generated_password": generated_password,
            "token": token,
            "profile_pic": image_path
        }), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# LOGIN
# =========================================
@auth_bp.route("/login", methods=["POST"])
def login():
    try:

        print("\n==================== LOGIN DEBUG START ====================")

        # =========================================
        # REQUEST DATA
        # =========================================
        data = request.get_json()

        login_type = str(data.get("loginType", "")).strip().lower()
        login_input = str(data.get("loginInput", "")).strip()
        password = str(data.get("password", "")).strip()
        role = str(data.get("role", "")).strip().lower()

        print(f"Login Type : {login_type}")
        print(f"Login Input: {login_input}")
        print(f"Role       : {role}")

        # =========================================
        # SELECT COLLECTION BASED ON ROLE
        # =========================================
        if role == "admin":
            collection = mongo.db.users

        elif role == "student":
            collection = mongo.db.students

        elif role == "faculty":
            collection = mongo.db.faculty

        elif role == "management":
            collection = mongo.db.management

        else:
            return jsonify({
                "success": False,
                "message": "Invalid Role Selected"
            }), 400

        print(f"Using Collection: {collection.name}")

        # =========================================
        # FIND USER
        # =========================================
        user = None

        # Login by Email
        if login_type == "email":

            user = collection.find_one({
                "$expr": {
                    "$eq": [
                        {"$toLower": "$email"},
                        login_input.lower()
                    ]
                }
            })

        # Login by Mobile / Phone
        elif login_type == "mobile":

            user = collection.find_one({
                "$or": [
                    {"mobile": login_input},
                    {"phone": login_input}
                ]
            })

        else:
            return jsonify({
                "success": False,
                "message": "Invalid Login Type"
            }), 400

        # =========================================
        # USER NOT FOUND
        # =========================================
        if not user:

            print("❌ User not found")

            return jsonify({
                "success": False,
                "message": "Invalid Email or Mobile"
            }), 401

        print(f"✅ User Found: {user.get('name')}")

        # =========================================
        # ROLE VALIDATION
        # =========================================
        db_role = str(user.get("role", role)).lower()

        if db_role != role:

            print(
                f"❌ Role mismatch. "
                f"DB={db_role}, REQUEST={role}"
            )

            return jsonify({
                "success": False,
                "message": "Invalid Role Selected"
            }), 401

        # =========================================
        # APPROVAL CHECK
        # =========================================
        if role != "admin":

            if "approved" in user and not user.get("approved"):

                return jsonify({
                    "success": False,
                    "message": "Account Pending Admin Approval"
                }), 403

        # =========================================
        # PASSWORD VERIFICATION
        # =========================================
        stored_password = str(user.get("password", ""))
        print("Stored Password:", repr(stored_password))
        print("Entered Password:", repr(password))
        password_ok = False

        try:

            # BCRYPT HASHED PASSWORD
            if (
                stored_password.startswith("$2a$")
                or stored_password.startswith("$2b$")
                or stored_password.startswith("$2y$")
            ):

                password_ok = bcrypt.check_password_hash(
                    stored_password,
                    password
                )

            # PLAIN TEXT PASSWORD
            else:

                password_ok = (stored_password == password)

        except Exception as err:

            print("Password Check Error:", err)

        if not password_ok:

            print("❌ Invalid password")

            return jsonify({
                "success": False,
                "message": "Invalid Password"
            }), 401

        print("✅ Password Verified")

        # =========================================
        # UPDATE LAST LOGIN
        # =========================================
        try:

            collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "last_login": datetime.now(timezone.utc)
                    }
                }
            )

        except Exception as err:

            print("Last Login Update Failed:", err)

        # =========================================
        # GENERATE JWT TOKEN
        # =========================================
        token = create_access_token(
            identity=str(user["_id"])
        )

        print("🎉 Login Successful")
        print("==================== LOGIN DEBUG END ====================\n")

        # =========================================
        # RESPONSE
        # =========================================
        return jsonify({
            "success": True,
            "message": "Login Successful",
            "token": token,
            "user": {
                "_id": str(user["_id"]),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "mobile": user.get(
                    "mobile",
                    user.get("phone", "")
                ),
                "role": role,
                "profile_pic": user.get(
                    "profile_pic",
                    user.get("image", "")
                ),
                "approved": user.get("approved", True)
            }
        }), 200

    except Exception as e:

        print(f"💥 Login Exception: {str(e)}")

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
# =========================================
# CHANGE PASSWORD (ALL ROLES FIXED)
# =========================================
@auth_bp.route("/change-password", methods=["PUT", "POST"])
@jwt_required()
def change_password():

    try:
        data = request.json or {}

        old_password = data.get("currentPassword") or data.get("current_password")
        new_password = data.get("newPassword") or data.get("new_password")
        confirm_password = data.get("confirmPassword") or data.get("confirm_password")

        if not old_password or not new_password or not confirm_password:
            return jsonify({"message": "Missing required fields"}), 400

        if new_password != confirm_password:
            return jsonify({"message": "New password and confirmation do not match"}), 400

        identity = get_jwt_identity()

        if not identity:
            return jsonify({"message": "Invalid token"}), 401

        # ========================================
        # FIND USER IN ALL COLLECTIONS (CONCEPT 1)
        # ========================================
        user = None
        collection = None

        collections = [
            ("users", mongo.db.users),
            ("students", mongo.db.students),
            ("faculty", mongo.db.faculty),
            ("management", mongo.db.management)
        ]

        try:
            user_id = ObjectId(identity)
        except:
            return jsonify({"message": "Invalid user ID in token"}), 401

        for name, col in collections:

            user = col.find_one({"_id": user_id})

            if user:
                collection = col
                break

        if not user:
            return jsonify({"message": "User not found"}), 404

        # ========================================
        # PASSWORD VERIFICATION (CONCEPT 2)
        # ========================================
        stored_password = str(user.get("password", ""))
        password_ok = False

        try:
            # bcrypt hashed password
            if (
                stored_password.startswith("$2a$")
                or stored_password.startswith("$2b$")
                or stored_password.startswith("$2y$")
            ):
                password_ok = bcrypt.check_password_hash(
                    stored_password,
                    old_password
                )

            # plain password fallback
            else:
                password_ok = (stored_password == old_password)

        except Exception as err:
            print("Password Check Error:", err)
            password_ok = False

        if not password_ok:
            return jsonify({
                "success": False,
                "message": "Old password is incorrect"
            }), 401

        # ========================================
        # UPDATE PASSWORD
        # ========================================
        hashed_password = bcrypt.generate_password_hash(new_password).decode("utf-8")

        result = collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": hashed_password}}
        )

        if result.matched_count == 0:
            return jsonify({"message": "Update failed"}), 404

        return jsonify({
            "success": True,
            "message": "Password updated successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Backend Error: {str(e)}"
        }), 500


# =========================================
# APPROVE USER
# =========================================
@auth_bp.route("/approve-user/<id>", methods=["PUT"])
@jwt_required()
def approve_user(id):

    try:
        result = mongo.db.users.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"approved": True}}
        )

        if result.matched_count == 0:
            return jsonify({"message": "User ID not found"}), 404

        return jsonify({"message": "User Approved Successfully"}), 200

    except InvalidId:
        return jsonify({"message": "Invalid ID format"}), 400


# =========================================
# DELETE USER
# =========================================
@auth_bp.route("/delete-user/<id>", methods=["DELETE"])
@jwt_required()
def delete_user(id):

    try:
        result = mongo.db.users.delete_one({"_id": ObjectId(id)})

        if result.deleted_count == 0:
            return jsonify({"message": "User not found"}), 404

        return jsonify({"message": "User Deleted Successfully"}), 200

    except InvalidId:
        return jsonify({"message": "Invalid ID format"}), 400


# =========================================
# GET USERS
# =========================================
@auth_bp.route("/pending-users", methods=["GET"])
@jwt_required()
def pending_users():

    users = list(mongo.db.users.find({"approved": False}, {"password": 0}))

    for u in users:
        u["_id"] = str(u["_id"])

    return jsonify(users), 200


@auth_bp.route("/all-users", methods=["GET"])
@jwt_required()
def all_users():

    users = list(mongo.db.users.find({}, {"password": 0}))

    for u in users:
        u["_id"] = str(u["_id"])

    return jsonify(users), 200

# ========================================
#   Forgot Password (requires email sending setup)
# ========================================
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json() or {}
        email = str(data.get("email", "")).strip().lower()

        if not email:
            return jsonify({
                "success": False,
                "message": "Email required"
            }), 400

        # ========================================
        # FIND USER IN ALL COLLECTIONS
        # ========================================
        user = None
        collection_name = None

        collections = [
            ("users", mongo.db.users),
            ("students", mongo.db.students),
            ("faculty", mongo.db.faculty),
            ("management", mongo.db.management)
        ]

        for name, collection in collections:

            user = collection.find_one({
                "email": {
                    "$regex": f"^{email}$",
                    "$options": "i"
                }
            })

            if user:
                collection_name = name
                break

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        # ========================================
        # GENERATE OTP
        # ========================================
        otp = str(random.randint(100000, 999999))

        # ========================================
        # SAVE RESET REQUEST
        # ========================================
        mongo.db.password_resets.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "otp": otp,
                    "collection": collection_name,
                    "verified": False,
                    "expires_at": datetime.utcnow() + timedelta(minutes=10)
                }
            },
            upsert=True
        )

        # ===================================================
        # ✉️ LIVE EMAIL TRANSMISSION
        # ===================================================
        try:
            msg = Message(
                subject="Future Path Security - Password Reset Verification Code",
                recipients=[email]
            )

            msg.body = f"""Hello,

You requested a password reset for your Future Path account.

Your 6-digit OTP verification security code is: {otp}

This authentication token code is valid for exactly 10 minutes. If you did not make this request, please safely ignore this email.

Best regards,
Future Path Administrative System Management Team"""

            mail.send(msg)

            print(
                f"📧 EMAIL DISPATCH SUCCESS: "
                f"Token delivered safely to {email}"
            )

        except Exception as mail_err:

            print(
                f"❌ EMAIL SENDING CRASHED: "
                f"{str(mail_err)}"
            )

            print(
                f"🔐 [FALLBACK DEBUG OTP] -> {otp}"
            )

        return jsonify({
            "success": True,
            "message": "OTP sent successfully to your email inbox!"
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
# ========================================
#   Verify OTP Checkpoint
# ========================================
@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json() or {}
        email = str(data.get("email", "")).strip().lower()
        otp = str(data.get("otp", "")).strip()

        if not email or not otp:
            return jsonify({"success": False, "message": "Email and OTP are required"}), 400

        record = mongo.db.password_resets.find_one({"email": email})

        if not record:
            return jsonify({"success": False, "message": "No validation request found"}), 404

        if record["otp"] != otp:
            return jsonify({"success": False, "message": "Invalid OTP code entered"}), 401

        # Evaluate token lifecycle constraint window using standardized naive tracking
        if record["expires_at"] < datetime.utcnow():
            return jsonify({"success": False, "message": "OTP expired"}), 401

        mongo.db.password_resets.update_one(
            {"email": email},
            {"$set": {"verified": True}}
        )

        return jsonify({"success": True, "message": "OTP verified successfully"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ========================================
#   Reset Password Execution
# ========================================

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:

        data = request.get_json() or {}

        email = str(
            data.get("email", "")
        ).strip().lower()

        new_password = data.get(
            "newPassword"
        )

        if not email or not new_password:
            return jsonify({
                "success": False,
                "message": "Missing required field inputs"
            }), 400

        # ========================================
        # GET OTP RECORD
        # ========================================
        record = mongo.db.password_resets.find_one({
            "email": email
        })

        if record is None:
            return jsonify({
                "success": False,
                "message": "Password reset request not found"
            }), 404

        if not record.get("verified", False):
            return jsonify({
                "success": False,
                "message": "OTP verification required"
            }), 401

        # ========================================
        # GET COLLECTION NAME
        # ========================================
        collection_name = record.get("collection")

        if collection_name == "users":
            collection = mongo.db.users

        elif collection_name == "students":
            collection = mongo.db.students

        elif collection_name == "faculty":
            collection = mongo.db.faculty

        elif collection_name == "management":
            collection = mongo.db.management

        else:
            return jsonify({
                "success": False,
                "message": "Invalid collection stored"
            }), 500

        # ========================================
        # HASH PASSWORD
        # ========================================
        hashed_password = bcrypt.generate_password_hash(
            new_password
        ).decode("utf-8")

        # ========================================
        # UPDATE PASSWORD
        # ========================================
        result = collection.update_one(
            {
                "email": {
                    "$regex": f"^{email}$",
                    "$options": "i"
                }
            },
            {
                "$set": {
                    "password": hashed_password
                }
            }
        )

        print("Collection:", collection_name)
        print("Email:", email)
        print("Matched:", result.matched_count)
        print("Modified:", result.modified_count)

        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "message": "User not found in collection"
            }), 404

        # ========================================
        # DELETE OTP RECORD
        # ========================================
        mongo.db.password_resets.delete_one({
            "email": email
        })

        return jsonify({
            "success": True,
            "message": "Password updated successfully"
        }), 200

    except Exception as e:

        print("RESET PASSWORD ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500