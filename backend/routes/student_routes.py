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
# UPLOAD PATH CONFIG (IMPORTANT FIX)
# =========================================
BASE_DIR = os.getcwd()
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================
# SERVE UPLOADED IMAGES
# =========================================
@student_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# =========================================
# ADD STUDENT (IMAGE FIXED)
# =========================================
@student_bp.route("/add-student", methods=["POST"])
def add_student():

    try:

        name = request.form.get("name")
        roll = request.form.get("roll")
        email = request.form.get("email")
        phone = request.form.get("phone")
        batch = request.form.get("batch")
        year = request.form.get("year")
        dob = request.form.get("dob")
        status = request.form.get("status")
        address = request.form.get("address")

        image = request.files.get("image")

        safe_filename = ""

        # =========================================
        # IMAGE SAVE FIX (SAFE + UNIQUE)
        # =========================================
        if image:
            ext = os.path.splitext(image.filename)[1]
            safe_filename = f"{int(time.time())}_{roll}{ext}"
            image.save(os.path.join(UPLOAD_FOLDER, safe_filename))

        # =========================================
        # PASSWORD GENERATION
        # =========================================
        password = generate_password(name, phone)

        # =========================================
        # STORE STUDENT DATA
        # =========================================
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
            "image": safe_filename,   # store filename ONLY
            "password": password
        }

        mongo.db.students.insert_one(data)

        # =========================================
        # OPTIONAL NOTIFICATIONS
        # =========================================
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
            "password": password
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# GET STUDENTS (IMPORTANT IMAGE FIX FOR ID CARD)
# =========================================
@student_bp.route("/get-student", methods=["GET"])
def get_student():

    data = list(mongo.db.students.find())

    for i in data:
        i["_id"] = str(i["_id"])

        # =========================================
        # FIX: CONVERT IMAGE TO FULL URL
        # (REQUIRED FOR ID CARD + PDF DOWNLOAD)
        # =========================================
        if i.get("image"):
            i["image"] = f"{request.host_url}uploads/{i['image']}"
        else:
            i["image"] = ""

    return jsonify({"students": data})


# =========================================
# DELETE STUDENT
# =========================================
@student_bp.route("/delete-student/<id>", methods=["DELETE"])
def delete_student(id):

    try:
        mongo.db.students.delete_one({"_id": ObjectId(id)})
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500