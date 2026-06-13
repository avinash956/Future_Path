from flask import (
    Blueprint,
    request,
    jsonify,
    send_from_directory
)

from extensions import mongo

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from werkzeug.utils import secure_filename

from bson.objectid import ObjectId

import os


# =====================================================
# BLUEPRINT
# =====================================================

about_bp = Blueprint(
    "about",
    __name__
)


# =====================================================
# UPLOAD SETTINGS
# =====================================================

UPLOAD_FOLDER = "uploads/about"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# =====================================================
# ADMIN CHECK
# =====================================================

def is_admin_user(user_id):

    try:

        user = mongo.db.users.find_one({
            "_id": ObjectId(user_id)
        })

        return (
            user and
            user.get("role") == "admin"
        )

    except Exception:
        return False


# =====================================================
# GET ABOUT DATA (PUBLIC)
# =====================================================

@about_bp.route(
    "/",
    methods=["GET"]
)
def get_about():

    try:

        doc = mongo.db.about.find_one()

        if not doc:
            doc = {}

        return jsonify({

            "vision":
                doc.get(
                    "vision",
                    ""
                ),

            "mission":
                doc.get(
                    "mission",
                    ""
                ),

            "description":
                doc.get(
                    "description",
                    ""
                ),

            "founder_name":
                doc.get(
                    "founder_name",
                    "Avinash Tripathi"
                ),

            "cofounder_name":
                doc.get(
                    "cofounder_name",
                    "Kavita Tripathi"
                ),

            "founder_image":
                doc.get(
                    "founder_image",
                    ""
                ),

            "cofounder_image":
                doc.get(
                    "cofounder_image",
                    ""
                )

        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =====================================================
# SAVE ABOUT DATA (ADMIN ONLY)
# =====================================================

@about_bp.route(
    "/save",
    methods=["POST"]
)
@jwt_required()
def save_about():

    try:

        user_id = get_jwt_identity()

        if not is_admin_user(user_id):

            return jsonify({
                "success": False,
                "message": "Admin only"
            }), 403

        data = request.get_json()

        mongo.db.about.update_one(
            {},
            {
                "$set": {

                    "vision":
                        data.get(
                            "vision",
                            ""
                        ),

                    "mission":
                        data.get(
                            "mission",
                            ""
                        ),

                    "description":
                        data.get(
                            "description",
                            ""
                        ),

                    "founder_name":
                        data.get(
                            "founder_name",
                            "Avinash Tripathi"
                        ),

                    "cofounder_name":
                        data.get(
                            "cofounder_name",
                            "Kavita Tripathi"
                        )

                }
            },
            upsert=True
        )

        return jsonify({
            "success": True,
            "message": "About information updated successfully"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =====================================================
# UPLOAD FOUNDER / COFOUNDER IMAGE
# =====================================================

@about_bp.route(
    "/upload-image",
    methods=["POST"]
)
@jwt_required()
def upload_image():

    try:

        user_id = get_jwt_identity()

        if not is_admin_user(user_id):

            return jsonify({
                "success": False,
                "message": "Admin only"
            }), 403

        image = request.files.get(
            "image"
        )

        img_type = request.form.get(
            "type"
        )

        if not image:

            return jsonify({
                "success": False,
                "message": "Image not found"
            }), 400

        if img_type not in [
            "founderImg",
            "cofounderImg"
        ]:

            return jsonify({
                "success": False,
                "message": "Invalid image type"
            }), 400

        filename = secure_filename(
            image.filename
        )

        file_path = os.path.join(
            UPLOAD_FOLDER,
            filename
        )

        image.save(file_path)

        field_map = {

            "founderImg":
                "founder_image",

            "cofounderImg":
                "cofounder_image"

        }

        db_field = field_map[
            img_type
        ]

        mongo.db.about.update_one(
            {},
            {
                "$set": {
                    db_field: file_path
                }
            },
            upsert=True
        )

        return jsonify({

            "success": True,

            "message":
                "Image uploaded successfully",

            "image_url":
                file_path

        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =====================================================
# SERVE ABOUT IMAGES
# =====================================================

@about_bp.route(
    "/uploads/<path:filename>"
)
def serve_file(filename):

    return send_from_directory(
        UPLOAD_FOLDER,
        filename
    )