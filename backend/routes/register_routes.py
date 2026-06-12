from flask import Blueprint, request, jsonify
from extensions import mongo
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid

register_bp = Blueprint(
    "register_bp",
    __name__
)

# ==========================================
# CONFIG
# ==========================================

UPLOAD_FOLDER = "uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp"
}


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# ==========================================
# REGISTER STUDENT
# ==========================================

@register_bp.route(
    "/api/register",
    methods=["POST"]
)
def register():

    try:

        print("\n========== REGISTER REQUEST ==========")
        print("FORM DATA :", request.form)
        print("FILES     :", request.files)

        # ----------------------------------
        # FORM DATA
        # ----------------------------------

        name = request.form.get(
            "name",
            ""
        ).strip()

        mobile = request.form.get(
            "mobile",
            ""
        ).strip()

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        role = request.form.get(
            "role",
            "student"
        ).strip()

        course = request.form.get(
            "course",
            ""
        ).strip()

        photo = request.files.get(
            "photo"
        )

        # ----------------------------------
        # VALIDATION
        # ----------------------------------

        if not name:
            return jsonify({
                "success": False,
                "message": "Name is required"
            }), 400

        if not mobile:
            return jsonify({
                "success": False,
                "message": "Mobile is required"
            }), 400

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400

        if not course:
            return jsonify({
                "success": False,
                "message": "Course is required"
            }), 400

        # ----------------------------------
        # CHECK DUPLICATE EMAIL
        # ----------------------------------

        existing = mongo.db.register_student.find_one(
            {
                "email": email
            }
        )

        if existing:

            return jsonify({
                "success": False,
                "message": "Email already registered"
            }), 409

        # ----------------------------------
        # SAVE PHOTO
        # ----------------------------------

        photo_path = ""

        if photo:

            print("PHOTO FOUND :", photo.filename)

            if photo.filename == "":

                return jsonify({
                    "success": False,
                    "message": "Please select a photo"
                }), 400

            if not allowed_file(
                photo.filename
            ):

                return jsonify({
                    "success": False,
                    "message": "Only JPG, PNG, GIF and WEBP allowed"
                }), 400

            extension = photo.filename.rsplit(
                ".",
                1
            )[1].lower()

            filename = (
                str(uuid.uuid4())
                + "."
                + extension
            )

            photo_path = os.path.join(
                UPLOAD_FOLDER,
                filename
            )

            photo.save(
                photo_path
            )

            print(
                "PHOTO SAVED:",
                photo_path
            )

        else:

            print("NO PHOTO RECEIVED")

        # ----------------------------------
        # STORE IN MONGODB
        # ----------------------------------

        student_data = {

            "name": name,
            "mobile": mobile,
            "email": email,
            "role": role,
            "course": course,

            "photo": photo_path,

            "status": "pending",

            "created_at":
                datetime.utcnow()

        }

        result = mongo.db.register_student.insert_one(
            student_data
        )

        print(
            "REGISTERED:",
            result.inserted_id
        )

        return jsonify({

            "success": True,

            "message":"Registration submitted successfully",

            "id":
                str(result.inserted_id)

        }), 201

    except Exception as e:

        print("REGISTER ERROR:", str(e))

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500