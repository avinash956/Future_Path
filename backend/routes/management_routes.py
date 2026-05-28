from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
import os

from routes.notifications import (
    generate_password,
    send_email,
    send_sms,
    send_whatsapp,
    generate_otp
)

management_bp = Blueprint("management_bp", __name__)

otp_store = {}


@management_bp.route("/add-management", methods=["POST"])
def add_management():

    try:

        name = request.form.get("name")
        post = request.form.get("post")
        Id = request.form.get("Id")
        email = request.form.get("email")
        phone = request.form.get("phone")
        department = request.form.get("department")
        status = request.form.get("status")
        description = request.form.get("description")

        image = request.files.get("image")

        safe_filename = ""

        if image:
            os.makedirs("uploads", exist_ok=True)
            safe_filename = image.filename.replace(" ", "_")
            image.save(os.path.join("uploads", safe_filename))

        # 🔐 PASSWORD GENERATION
        password = generate_password(name, phone)

        data = {
            "name": name,
            "post": post,
            "Id": Id,
            "email": email,
            "phone": phone,
            "department": department,
            "status": status,
            "description": description,
            "password": password,
            "image": safe_filename
        }

        mongo.db.management.insert_one(data)

        # 📡 NOTIFICATIONS
        try:
            if email:
                send_email(email, password)

            if phone:
                send_whatsapp(phone, password)
                generate_otp(email, phone)

        except Exception as e:
            print("⚠️ Notification error:", e)

        return jsonify({
            "success": True,
            "message": "Management added",
            "password": password
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@management_bp.route("/get-management", methods=["GET"])
def get_management():

    data = list(mongo.db.management.find())

    for i in data:
        i["_id"] = str(i["_id"])

    return jsonify({"management": data})


@management_bp.route("/delete-management/<id>", methods=["DELETE"])
def delete_management(id):

    mongo.db.management.delete_one({"_id": ObjectId(id)})

    return jsonify({"success": True})