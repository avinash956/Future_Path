from flask import Blueprint, request, jsonify, send_from_directory
from extensions import mongo
from bson import ObjectId
import os
from flask_jwt_extended import jwt_required, get_jwt_identity

from routes.notifications import (
    generate_password,
    send_email,
    send_sms,
    send_whatsapp,
    generate_otp
)

faculty_bp = Blueprint("faculty_bp", __name__)

# =========================================
# IMAGE UPLOAD DIR
# =========================================
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================
# STATIC FILE SERVING (FIX FOR IMAGE NOT LOADING)
# =========================================
@faculty_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# =========================================
# ADD FACULTY (FIXED WITH batch_ids)
# =========================================
@faculty_bp.route("/add-faculty", methods=["POST"])
def add_faculty():

    try:
        name = request.form.get("name")
        faculty_id = request.form.get("facultyId")

        phone = request.form.get("phone")
        email = request.form.get("email")

        post = request.form.get("post")
        department = request.form.get("department")
        experience = request.form.get("experience")

        status = request.form.get("status")
        description = request.form.get("description")

        batch = request.form.get("batch")

        # IMAGE
        image = request.files.get("image")
        filename = ""

        if image and image.filename:

            safe_filename = image.filename.replace(" ", "_")
            filename = f"{faculty_id}_{safe_filename}"

            image.save(os.path.join(UPLOAD_FOLDER, filename))

        # PASSWORD
        password = generate_password(name, phone)

        data = {
            "name": name,
            "facultyId": faculty_id,
            "phone": phone,
            "email": email,
            "post": post,
            "department": department,
            "experience": experience,
            "status": status,
            "description": description,
            "password": password,
            "image": filename,
            "batch_ids": [ObjectId(batch)] if batch else []
        }

        result = mongo.db.faculty.insert_one(data)

        try:
            if email:
                send_email(email, password)

            if phone:
                send_sms(phone, password)
                send_whatsapp(phone, password)
                generate_otp(phone)

        except Exception as e:
            print("Notification error:", e)

        return jsonify({
            "success": True,
            "message": "Faculty added successfully",
            "facultyId": str(result.inserted_id)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# GET ALL FACULTY
# =========================================
@faculty_bp.route("/get-faculty", methods=["GET"])
def get_faculty():

    try:
        data = list(mongo.db.faculty.find())

        for f in data:
            f["_id"] = str(f["_id"])
            f["batch_ids"] = [str(b) for b in f.get("batch_ids", [])]

        return jsonify({
            "success": True,
            "faculty": data
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# DELETE FACULTY
# =========================================
@faculty_bp.route("/delete-faculty/<id>", methods=["DELETE"])
def delete_faculty(id):

    try:
        res = mongo.db.faculty.delete_one({"_id": ObjectId(id)})

        return jsonify({
            "success": res.deleted_count > 0
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# FACULTY PORTAL DASHBOARD
# =========================================
@faculty_bp.route("/portal/dashboard/<faculty_id>", methods=["GET"])
def faculty_portal(faculty_id):

    faculty = mongo.db.faculty.find_one({"_id": ObjectId(faculty_id)})

    if not faculty:
        return jsonify({"success": False, "msg": "Faculty not found"}), 404

    batches = list(mongo.db.batches.find({
        "_id": {"$in": faculty.get("batch_ids", [])}
    }))

    for b in batches:
        b["_id"] = str(b["_id"])
        b["students"] = list(mongo.db.students.find({
            "batch_id": b["_id"]
        }))

        for s in b["students"]:
            s["_id"] = str(s["_id"])

    faculty["_id"] = str(faculty["_id"])

    return jsonify({
        "success": True,
        "faculty": faculty,
        "batches": batches
    })


# =========================================
# ASSIGN FACULTY TO BATCH
# =========================================
@faculty_bp.route("/assign-batch", methods=["POST"])
def assign_batch():

    try:
        data = request.json

        faculty_id = ObjectId(data["faculty_id"])
        batch_id = ObjectId(data["batch_id"])

        mongo.db.faculty.update_one(
            {"_id": faculty_id},
            {"$addToSet": {"batch_ids": batch_id}}
        )

        mongo.db.batches.update_one(
            {"_id": batch_id},
            {"$addToSet": {"faculty_ids": faculty_id}}
        )

        return jsonify({
            "success": True,
            "message": "Batch assigned to faculty"
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# REMOVE FACULTY FROM BATCH
# =========================================
@faculty_bp.route("/remove-batch", methods=["POST"])
def remove_batch():

    try:
        data = request.json

        faculty_id = ObjectId(data["faculty_id"])
        batch_id = ObjectId(data["batch_id"])

        mongo.db.faculty.update_one(
            {"_id": faculty_id},
            {"$pull": {"batch_ids": batch_id}}
        )

        mongo.db.batches.update_one(
            {"_id": batch_id},
            {"$pull": {"faculty_ids": faculty_id}}
        )

        return jsonify({
            "success": True,
            "message": "Batch removed from faculty"
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500