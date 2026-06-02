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
# SERVE UPLOADED IMAGES (FIXED)
# =========================================
@student_bp.route('/uploads/<filename>')
def uploaded_file(filename):

    response = send_from_directory(
        UPLOAD_FOLDER,
        filename
    )

    # REMOVE THIS LINE
    # response.headers["Access-Control-Allow-Origin"] = "*"

    response.headers["Cache-Control"] = \
        "no-cache, no-store, must-revalidate"

    return response


# =========================================
# UTILITY
# =========================================
def clean_roll(roll):
    if not roll:
        return ""
    return roll.strip().upper().replace(" ", "")


# =========================================
# ADD STUDENT
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

        print("➕ ADD STUDENT:", roll)

        if not name or not roll:
            return jsonify({"success": False, "message": "Name and Roll required"}), 400

        existing = mongo.db.students.find_one({"roll": roll})
        if existing:
            return jsonify({"success": False, "message": "Roll already exists"}), 409

        image = request.files.get("image")
        filename = ""

        if image:
            ext = os.path.splitext(image.filename)[1]
            filename = f"{int(time.time())}_{roll}{ext}"
            image.save(os.path.join(UPLOAD_FOLDER, filename))

        password = generate_password(name, phone)

        data = {
            "name": name,
            "roll": roll,
            "email": email,
            "phone": phone,
            "batch": batch,   # KEEP STRING (IMPORTANT FIX FOR YOUR CURRENT SYSTEM)
            "year": year,
            "dob": dob,
            "status": status,
            "address": address,
            "image": filename,
            "password": password,
            "created_at": time.time(),
            "history": []
        }

        mongo.db.students.insert_one(data)

        print("✅ STUDENT ADDED:", roll)

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
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# GET ALL STUDENTS (FIXED IMAGE URL)
# =========================================
@student_bp.route("/get-student", methods=["GET"])
def get_student():

    data = list(mongo.db.students.find())

    for i in data:
        i["_id"] = str(i["_id"])

        # FIXED IMAGE URL
        i["image"] = (
            f"{request.host_url}api/student/uploads/{i['image']}"
            if i.get("image") else ""
        )

    return jsonify({"students": data})


# =========================================
# GET FILTERED STUDENTS (FIXED)
# =========================================
@student_bp.route("/get-students", methods=["GET"])
def get_students():

    batch = request.args.get("batch")
    search = request.args.get("search")

    query = {}

    if batch:
        query["batch"] = batch   # FIXED (no ObjectId usage)

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"roll": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]

    data = list(mongo.db.students.find(query))

    for i in data:
        i["_id"] = str(i["_id"])

        i["image"] = (
            f"{request.host_url}api/student/uploads/{i['image']}"
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
        mongo.db.students.delete_one({"_id": ObjectId(id)})
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# UPDATE STUDENT
# =========================================
@student_bp.route("/update-student/<id>", methods=["PUT"])
def update_student(id):

    try:
        data = request.form.to_dict()
        update_data = {}

        allowed_fields = [
            "name", "roll", "email", "phone",
            "year", "dob", "status", "address", "batch"
        ]

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        image = request.files.get("image")

        if image:
            ext = os.path.splitext(image.filename)[1]
            filename = f"{int(time.time())}_{id}{ext}"
            image.save(os.path.join(UPLOAD_FOLDER, filename))
            update_data["image"] = filename

        mongo.db.students.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# PORTAL DASHBOARD
# =========================================
@student_bp.route("/portal/dashboard/<student_id>", methods=["GET"])
def student_portal(student_id):

    student = mongo.db.students.find_one({"_id": ObjectId(student_id)})

    if not student:
        return jsonify({"success": False, "msg": "Student not found"}), 404

    student["_id"] = str(student["_id"])

    if student.get("image"):
        student["image"] = f"{request.host_url}api/student/uploads/{student['image']}"

    return jsonify({
        "success": True,
        "student": student
    })