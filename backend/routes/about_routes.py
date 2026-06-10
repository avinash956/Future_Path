from flask import Blueprint, request, jsonify, send_from_directory
from extensions import mongo
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import os

about_bp = Blueprint("about", __name__)

UPLOAD_FOLDER = "uploads/about"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ======================================
# GET CURRENT USER ROLE FROM DB
# ======================================
def is_admin_user(user_id):
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    return user and user.get("role") == "admin"


# ======================================
# SAFE GET ABOUT
# ======================================
@about_bp.route("/", methods=["GET"])
def get_about():

    doc = mongo.db.about.find_one()

    if not doc:
        return jsonify({
            "vision": "",
            "mission": "",
            "description": "",
            "founder_image": "",
            "cofounder_image": "",
            "founder_name": "Founder",
            "cofounder_name": "Co-Founder"
        })

    doc["_id"] = str(doc["_id"])
    return jsonify(doc)


# ======================================
# SAVE TEXT (ADMIN ONLY - JWT)
# ======================================
@about_bp.route("/save", methods=["POST"])
@jwt_required()
def save_about():

    user_id = get_jwt_identity()

    if not is_admin_user(user_id):
        return jsonify({"success": False, "message": "Admin only"}), 403

    data = request.get_json() or {}

    mongo.db.about.update_one(
        {},
        {"$set": {
            "vision": data.get("vision", ""),
            "mission": data.get("mission", ""),
            "description": data.get("description", "")
        }},
        upsert=True
    )

    return jsonify({"success": True, "message": "Updated"})


# ======================================
# UPLOAD IMAGE (ADMIN ONLY - JWT)
# ======================================
@about_bp.route("/upload-image", methods=["POST"])
@jwt_required()
def upload_image():

    user_id = get_jwt_identity()

    if not is_admin_user(user_id):
        return jsonify({"success": False, "message": "Admin only"}), 403

    image = request.files.get("image")
    img_type = request.form.get("type")

    if not image or not img_type:
        return jsonify({"success": False, "message": "Invalid request"}), 400

    filename = secure_filename(image.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    image.save(file_path)

    field_map = {
        "founderImg": "founder_image",
        "cofounderImg": "cofounder_image"
    }

    if img_type not in field_map:
        return jsonify({"success": False, "message": "Invalid type"}), 400

    db_field = field_map[img_type]

    mongo.db.about.update_one(
        {},
        {"$set": {db_field: file_path}},
        upsert=True
    )

    return jsonify({
        "success": True,
        "image_url": file_path
    })


# ======================================
# SERVE IMAGE FILES
# ======================================
@about_bp.route("/uploads/<path:filename>")
def serve_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)