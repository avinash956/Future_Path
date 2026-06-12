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
# SERVE UPLOADED IMAGES
# =========================================
@student_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    response = send_from_directory(UPLOAD_FOLDER, filename)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


# =========================================
# UTILITY
# =========================================
def clean_roll(roll):
    if not roll:
        return ""
    return roll.strip().upper().replace(" ", "")


# =========================================
# ADD STUDENT (AUTO ROLL FIXED)
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

        if not name:
            return jsonify({"success": False, "message": "Name required"}), 400

        # AUTO ROLL GENERATION IF EMPTY
        if not roll:
            last_student = mongo.db.students.find_one(
                {"batch": batch},
                sort=[("_id", -1)]
            )

            last_roll = 0
            if last_student and last_student.get("roll"):
                try:
                    last_roll = int(last_student["roll"].split("-")[-1])
                except:
                    last_roll = 0

            roll = f"{batch}-{int(time.time()) % 100}-{last_roll + 1:02d}"

        # Duplicate check
        if mongo.db.students.find_one({"roll": roll}):
            return jsonify({"success": False, "message": "Roll already exists"}), 409

        # IMAGE UPLOAD
        image = request.files.get("image")
        filename = ""

        if image:
            ext = os.path.splitext(image.filename)[1]
            filename = f"{int(time.time())}_{roll}{ext}"
            image.save(os.path.join(UPLOAD_FOLDER, filename))

        # PASSWORD
        password = generate_password(name, phone)

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
            "image": filename,
            "password": password,
            "created_at": time.time(),
            "history": []
        }

        mongo.db.students.insert_one(data)

        # SEND PASSWORD EMAIL
        try:
            if email:
                send_email(email, password)

            if phone:
                send_sms(phone, password)
                send_whatsapp(phone, password)
                generate_otp(phone)

            print("📧 Notification sent successfully:", email)

        except Exception as e:
            print("⚠️ Notification error:", e)

        return jsonify({
            "success": True,
            "message": "Student added successfully",
            "roll": roll,
            "password": password
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# GET STUDENT LIST
# =========================================
@student_bp.route("/get-student", methods=["GET"])
def get_student():
    data = list(mongo.db.students.find())

    for i in data:
        i["_id"] = str(i["_id"])
        i["image"] = (
            f"{request.host_url}api/student/uploads/{i['image']}"
            if i.get("image") else ""
        )

    return jsonify({"students": data})


# =========================================
# FILTER STUDENTS
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
# UPDATE STUDENT (FIXED PASSWORD LOGIC)
# =========================================
@student_bp.route("/update-student/<id>", methods=["PUT"])
def update_student(id):
    try:
        student = mongo.db.students.find_one({"_id": ObjectId(id)})

        if not student:
            return jsonify({"success": False, "message": "Student not found"}), 404

        data = request.form.to_dict()
        update_data = {}

        allowed_fields = [
            "name", "email", "phone",
            "year", "dob", "status", "address", "batch"
        ]

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        # ROLL SAFE LOGIC
        existing_roll = student.get("roll", "")
        new_roll = clean_roll(data.get("roll", ""))

        update_data["roll"] = new_roll if new_roll else existing_roll

        # IMAGE UPDATE
        image = request.files.get("image")

        if image:
            ext = os.path.splitext(image.filename)[1]
            filename = f"{int(time.time())}_{id}{ext}"
            image.save(os.path.join(UPLOAD_FOLDER, filename))
            update_data["image"] = filename

        # PASSWORD CHECK (FIXED LOGIC)
        if not student.get("password"):
            name = update_data.get("name") or student.get("name")
            phone = update_data.get("phone") or student.get("phone")

            new_password = generate_password(name, phone)
            update_data["password"] = new_password

            email = update_data.get("email") or student.get("email")

            try:
                if email:
                    send_email(email, new_password)
                    print("📧 Password email sent:", email)

            except Exception as e:
                print("❌ Email error:", e)

        # UPDATE DB
        mongo.db.students.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# STUDENT PORTAL
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