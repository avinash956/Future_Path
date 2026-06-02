from flask import Blueprint, request, jsonify

from extensions import mongo

about_bp = Blueprint("about",__name__)

# ======================================
# GET ABOUT DATA
# ======================================

@about_bp.route("/", methods=["GET"])
def get_about():

    data = list(mongo.db.about.find())

    for item in data:

        item["_id"] = str(item["_id"])

    return jsonify(data)


# ======================================
# SAVE ABOUT DATA
# ======================================

@about_bp.route("/save", methods=["POST"])
def save_about():

    try:

        data = request.json

        # CLEAR OLD DATA
        mongo.db.about.delete_many({})

        # INSERT NEW DATA
        if data:

            mongo.db.about.insert_many(data)

        return jsonify({
            "message":
            "About Data Saved Successfully"
        })

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500


# ======================================
# IMPORTS FOR MANAGEMENT
# ======================================

from werkzeug.utils import secure_filename
from bson.objectid import ObjectId
import os


# ======================================
# ADD MANAGEMENT
# ======================================

@about_bp.route("/add-management", methods=["POST", "OPTIONS"])
def add_management():

    try:

        name = request.form.get("name")
        post = request.form.get("post")
        email = request.form.get("email")
        phone = request.form.get("phone")
        department = request.form.get("department")
        status = request.form.get("status")
        description = request.form.get("description")

        image = request.files.get("image")

        image_path = ""

        if image:

            filename = secure_filename(image.filename)

            upload_folder = "uploads"

            os.makedirs(upload_folder, exist_ok=True)

            image_path = os.path.join(upload_folder, filename)

            image.save(image_path)

        management_data = {
            "name": name,
            "post": post,
            "email": email,
            "phone": phone,
            "department": department,
            "status": status,
            "description": description,
            "image": image_path
        }

        mongo.db.management.insert_one(management_data)

        return jsonify({
            "success": True,
            "message": "Management Added Successfully"
        })

    except Exception as e:

        print("ADD MANAGEMENT ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ======================================
# GET MANAGEMENT
# ======================================

@about_bp.route("/get-management", methods=["GET"])
def get_management():

    try:

        data = list(mongo.db.management.find())

        for item in data:

            item["_id"] = str(item["_id"])

        return jsonify({
            "management": data
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ======================================
# DELETE MANAGEMENT
# ======================================

@about_bp.route("/delete-management/<id>", methods=["DELETE"])
def delete_management(id):

    try:

        mongo.db.management.delete_one({
            "_id": ObjectId(id)
        })

        return jsonify({
            "success": True,
            "message": "Deleted Successfully"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500