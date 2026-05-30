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
        # Place this temporary inspection block right under 'try:' in auth_routes.py
        print("\n--- 🔍 DATABASE CONFIGURATION INSPECTION ---")
        try:
            # 1. Print the connected database name
            current_db_name = mongo.db.name
            print(f"Connected Database Name: '{current_db_name}'")
            
            # 2. Print all available collections in this database
            collections = mongo.db.list_collection_names()
            print(f"Available Collections in this DB: {collections}")
            
            # 3. Check if the target collection actually contains records
            if "users" in collections:
                total_docs = mongo.db.users.count_documents({})
                print(f"Collection 'users' status: FOUND (Contains {total_docs} documents)")
            else:
                print("Collection 'users' status: ❌ NOT FOUND! Your collection might be named differently.")
        except Exception as db_err:
            print(f"Could not inspect database: {str(db_err)}")
        print("--------------------------------------------\n")
        data = request.get_json()
        print("\n==================== LOGIN DEBUG START ====================")
        print("1. RECEIVED PAYLOAD:", data)

        # Extract and clean inputs
        login_type = data.get("loginType")
        login_input = str(data.get("loginInput", "")).strip()
        password = data.get("password")
        
        # Normalize incoming role to lowercase and strip hidden spaces
        role = str(data.get("role", "")).lower().strip()

        print(f"2. CLEANED INPUTS -> Type: '{login_type}', Input: '{login_input}', Parsed Role: '{role}'")

        user = None

        # Execute database queries
        if login_type == "email":
            print(f"3. EXECUING DB QUERY: Searching for email '{login_input}' (Case-Insensitive & Trimmed)")
            
            # Using $expr allows us to trim the database field before comparing it
            user = mongo.db.users.find_one({
                "$expr": {
                    "$eq": [
                        { "$trim": { "input": { "$toLower": "$email" } } },
                        login_input.lower()
                    ]
                }
            })

        elif login_type == "mobile":
            print(f"3. EXECUTING DB QUERY: Searching for mobile '{login_input}'")
            try:
                mobile_int = int(login_input)
                user = mongo.db.users.find_one({"$or": [{"mobile": login_input}, {"mobile": mobile_int}]})
            except ValueError:
                user = mongo.db.users.find_one({"mobile": login_input})

        # Checkpoint 1: User Existence
        if not user:
            print(f"❌ FAIL: No user document found in MongoDB for {login_type} = '{login_input}'")
            print("==================== LOGIN DEBUG END ====================\n")
            return jsonify({"success": False, "message": "Invalid Email or Mobile"}), 401

        print(f"4. DB MATCH FOUND: User ID {user.get('_id')} loaded successfully.")
        print(f"   -> DB Email: '{user.get('email')}'")
        print(f"   -> DB Role:  '{user.get('role')}'")
        print(f"   -> DB Approved Status: {user.get('approved')}")

        # Checkpoint 2: Role Validation
        if user.get("role") != role:
            print(f"❌ FAIL: Role Mismatch! Frontend sent '{role}', but Database expects '{user.get('role')}'")
            print("==================== LOGIN DEBUG END ====================\n")
            return jsonify({"success": False, "message": "Invalid Role Selected"}), 401

        # Checkpoint 3: Admin Approval (UPDATED: Admins automatically bypass this check)
        if user.get("role") != "admin" and not user.get("approved"):
            print("❌ FAIL: User status 'approved' is False or missing in DB.")   
            print("==================== LOGIN DEBUG END ====================\n")
            return jsonify({"success": False, "message": "Account Pending Admin Approval"}), 403

        # Checkpoint 4: Password Verification
        print("5. VERIFYING PASSWORD HASH...")
        if bcrypt.check_password_hash(user["password"], password):
            print("✅ SUCCESS: Password matches hash.")
            
            mongo.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.now(timezone.utc)}}
            )

            token = create_access_token(identity=str(user["_id"]))
            print("🎉 LOGIN SUCCESSFUL. Token generated.")
            print("==================== LOGIN DEBUG END ====================\n")

            return jsonify({
                "success": True,
                "message": "Login Successful",
                "token": token,
                "user": {
                    "_id": str(user["_id"]),
                    "name": user.get("name"),
                    "email": user.get("email"),
                    "mobile": user.get("mobile"),
                    "role": user.get("role"),
                    "profile_pic": user.get("profile_pic", ""),
                    "approved": user.get("approved", True) # Force true in response payload for admin
                }
            }), 200

        print("❌ FAIL: Password mismatch.")
        print("==================== LOGIN DEBUG END ====================\n")
        return jsonify({"success": False, "message": "Invalid Password"}), 401

    except Exception as e:
        print(f"💥 CRITICAL EXCEPTION: {str(e)}")
        print("==================== LOGIN DEBUG END ====================\n")
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# CHANGE PASSWORD (FIXED)
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

        # ✅ FIXED: identity is ALWAYS string now
        if not identity:
            return jsonify({"message": "Invalid token"}), 401

        try:
            user = mongo.db.users.find_one({"_id": ObjectId(identity)})
        except:
            return jsonify({"message": "Invalid user ID in token"}), 401

        if not user:
            return jsonify({"message": "User not found"}), 404

        if not bcrypt.check_password_hash(user["password"], old_password):
            return jsonify({"message": "Old password incorrect"}), 401

        hashed_password = bcrypt.generate_password_hash(new_password).decode("utf-8")

        result = mongo.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": hashed_password}}
        )

        if result.matched_count == 0:
            return jsonify({"message": "Update failed"}), 404

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        return jsonify({"message": f"Backend Error: {str(e)}"}), 500


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
            return jsonify({"success": False, "message": "Email required"}), 400

        user = mongo.db.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        otp = str(random.randint(100000, 999999))

        mongo.db.password_resets.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "otp": otp,
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
            
            # Send the message directly out to the inbox
            mail.send(msg)
            print(f"📧 EMAIL DISPATCH SUCCESS: Token delivered safely to {email}")
            
        except Exception as mail_err:
            print(f"❌ EMAIL SENDING CRASHED: {str(mail_err)}")
            # Keep terminal log backup so you can keep developing even if the network fails
            print(f"🔐 [FALLBACK DEBUG OTP] -> {otp}")

        return jsonify({
            "success": True,
            "message": "OTP sent successfully to your email inbox!"
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
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
        email = str(data.get("email", "")).strip().lower()
        new_password = data.get("newPassword")

        if not email or not new_password:
            return jsonify({"success": False, "message": "Missing required field inputs"}), 400

        record = mongo.db.password_resets.find_one({"email": email})

        if not record or not record.get("verified"):
            return jsonify({"success": False, "message": "Unauthorized entry: OTP verification skipped"}), 401

        # Secure cryptographic password encryption formatting
        hashed_password = bcrypt.generate_password_hash(new_password).decode("utf-8")

        # Overwrite legacy field payload value cleanly across the core users cluster collection
        mongo.db.users.update_one(
            {"email": {"$regex": f"^{email}$", "$options": "i"}},
            {"$set": {"password": hashed_password}}
        )

        # Drop authentication lifecycle record token cache to maintain operational single-use integrity
        mongo.db.password_resets.delete_one({"email": email})

        return jsonify({"success": True, "message": "Password updated successfully"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500