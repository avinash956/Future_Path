from flask import Blueprint, request, jsonify, send_from_directory
from extensions import mongo
from bson import ObjectId
import os
import time

from routes.notifications import (
    generate_password,
    send_email,
    send_sms,
    send_whatsapp,
    generate_otp
)

student_bp = Blueprint("student_bp", __name__)

# =========================================
# UPLOAD CONFIG
# =========================================
BASE_DIR = os.getcwd()
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================
# SERVE IMAGES
# =========================================
@student_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# =========================================
# UTILITY: CLEAN ROLL FORMAT
# =========================================
def clean_roll(roll):
    if not roll:
        return ""
    return roll.strip().upper().replace(" ", "")


# =========================================
# ADD STUDENT (PRO SAFE VERSION)
# =========================================
@student_bp.route("/add-student", methods=["POST"])
def add_student():

    try:
        name = request.form.get("name")
        roll = clean_roll(request.form.get("roll"))
        email = request.form.get("email")
        phone = request.form.get("phone")
        batch = request.form.get("batch")
        year = request.form.get("year")
        dob = request.form.get("dob")
        status = request.form.get("status")
        address = request.form.get("address")

        print("➕ ADD STUDENT REQUEST:", roll)

        # =========================
        # VALIDATION
        # =========================
        if not name or not roll:
            return jsonify({
                "success": False,
                "message": "Name and Roll required"
            }), 400

        # =========================
        # DUPLICATE ROLL CHECK (IMPORTANT FIX)
        # =========================
        existing = mongo.db.students.find_one({"roll": roll})
        if existing:
            return jsonify({
                "success": False,
                "message": "Roll already exists"
            }), 409

        # =========================
        # IMAGE SAVE
        # =========================
        image = request.files.get("image")
        safe_filename = ""

        if image:
            ext = os.path.splitext(image.filename)[1]
            safe_filename = f"{int(time.time())}_{roll}{ext}"
            image.save(os.path.join(UPLOAD_FOLDER, safe_filename))

        # =========================
        # PASSWORD GENERATION
        # =========================
        password = generate_password(name, phone)

        # =========================
        # STUDENT OBJECT
        # =========================
        data = {
            "name": name,
            "roll": roll,
            "email": email,
            "phone": phone,
            "batch": batch,
            "year": year,
            "dob": dob,
            "status": status,
            "address": address,
            "image": safe_filename,
            "password": password,
            "created_at": time.time(),
            "history": []
        }

        mongo.db.students.insert_one(data)

        print("✅ STUDENT ADDED:", roll)

        # =========================
        # NOTIFICATIONS (SAFE TRY)
        # =========================
        try:
            if email:
                send_email(email, password)

            if phone:
                send_sms(phone, password)
                send_whatsapp(phone, password)
                generate_otp(phone)

        except Exception as e:
            print("⚠️ Notification error:", e)

        return jsonify({
            "success": True,
            "message": "Student added successfully",
            "roll": roll,
            "password": password
        })

    except Exception as e:
        print("❌ ADD ERROR:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# GET ALL STUDENTS (LEGACY SAFE)
# =========================================
@student_bp.route("/get-student", methods=["GET"])
def get_student():

    data = list(mongo.db.students.find())

    for i in data:
        i["_id"] = str(i["_id"])
        i["image"] = (
            f"{request.host_url}uploads/{i['image']}"
            if i.get("image") else ""
        )

    return jsonify({"students": data})


# =========================================
# GET STUDENTS (FILTER + SEARCH OPTIMIZED)
# =========================================
@student_bp.route("/get-students", methods=["GET"])
def get_students():

    batch = request.args.get("batch")
    search = request.args.get("search")

    query = {}

    if batch:
        query["batch"] = batch

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"roll": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]

    print("🔍 QUERY:", query)

    data = list(mongo.db.students.find(query))

    for i in data:
        i["_id"] = str(i["_id"])
        i["image"] = (
            f"{request.host_url}uploads/{i['image']}"
            if i.get("image") else ""
        )

    return jsonify({
        "success": True,
        "count": len(data),
        "students": data
    })


# =========================================
# DELETE STUDENT
# =========================================
@student_bp.route("/delete-student/<id>", methods=["DELETE"])
def delete_student(id):

    try:
        print("🗑 DELETE:", id)

        mongo.db.students.delete_one({"_id": ObjectId(id)})

        return jsonify({"success": True})

    except Exception as e:
        print("❌ DELETE ERROR:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# UPDATE STUDENT (SAFE + FLEXIBLE)
# =========================================
@student_bp.route("/update-student/<id>", methods=["PUT"])
def update_student(id):

    try:
        print("✏️ UPDATE:", id)

        data = request.form.to_dict()
        update_data = {}

        allowed_fields = [
            "name", "roll", "email", "phone",
            "batch", "year", "dob", "status", "address"
        ]

        for field in allowed_fields:
            if field in data and data[field] is not None:
                update_data[field] = data[field]

        # IMAGE UPDATE
        image = request.files.get("image")

        if image:
            ext = os.path.splitext(image.filename)[1]
            filename = f"{int(time.time())}_{id}{ext}"
            image.save(os.path.join(UPLOAD_FOLDER, filename))
            update_data["image"] = filename

        if not update_data:
            return jsonify({
                "success": False,
                "message": "Nothing to update"
            }), 400

        mongo.db.students.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )

        print("✅ UPDATED SUCCESS")

        return jsonify({"success": True})

    except Exception as e:
        print("❌ UPDATE ERROR:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500