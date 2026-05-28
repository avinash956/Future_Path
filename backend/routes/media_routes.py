from flask import Blueprint, request, jsonify
from extensions import mongo
from middleware.auth_middleware import token_required
from middleware.role_required import role_required
from datetime import datetime
import os

from bson.objectid import ObjectId

from werkzeug.utils import secure_filename

from flask import send_from_directory

media_bp = Blueprint("media", __name__)


# =========================
# UPLOAD MEDIA (ADMIN/FACULTY)
# =========================
@media_bp.route("/upload", methods=["POST"])
@token_required
@role_required("admin")
def upload_media():

    data = request.json

    media = {
        "title": data.get("title"),
        "media_type": data.get("media_type"),  # video/image/pdf
        "filename": data.get("filename"),
        "course": data.get("course"),
        "batch": data.get("batch"),
        "uploaded_by": data.get("uploaded_by"),
        "created_at": datetime.utcnow()
    }

    mongo.db.media.insert_one(media)

    return jsonify({
        "message": "Media uploaded successfully"
    })


# =========================
# GET ALL MEDIA
# =========================
@media_bp.route("/all", methods=["GET"])
@token_required
def get_media():

    media_list = []

    for m in mongo.db.media.find():

        media_list.append({
            "id": str(m["_id"]),
            "title": m.get("title"),
            "media_type": m.get("media_type"),
            "filename": m.get("filename"),
            "course": m.get("course"),
            "batch": m.get("batch")
        })

    return jsonify(media_list)
# =========================================
# GALLERY UPLOAD FOLDERS
# =========================================

IMAGE_FOLDER = "uploads/images"

VIDEO_FOLDER = "uploads/videos"

ALLOWED_IMAGE = {
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp"
}

ALLOWED_VIDEO = {
    "mp4",
    "mov",
    "avi",
    "mkv"
}

# =========================================
# CHECK FILE EXTENSION
# =========================================

def allowed_file(filename, allowed):

    return (
        "." in filename
        and
        filename.rsplit(".", 1)[1]
        .lower() in allowed
    )

# =========================================
# GALLERY MEDIA UPLOAD
# =========================================

@media_bp.route(
    "/gallery-upload",
    methods=["POST"]
)

@token_required
@role_required("admin")
def gallery_upload():

    try:

        if "file" not in request.files:

            return jsonify({

                "message":
                "No file selected"

            }), 400

        file = request.files["file"]

        title = request.form.get(
            "title"
        )

        description = request.form.get(
            "description"
        )

        category = request.form.get(
            "category"
        )

        if file.filename == "":

            return jsonify({

                "message":
                "Empty filename"

            }), 400

        filename = secure_filename(
            file.filename
        )

        extension = filename.rsplit(
            ".",
            1
        )[1].lower()

        # =====================
        # IMAGE
        # =====================

        if extension in ALLOWED_IMAGE:

            folder = IMAGE_FOLDER

            media_type = "image"

        # =====================
        # VIDEO
        # =====================

        elif extension in ALLOWED_VIDEO:

            folder = VIDEO_FOLDER

            media_type = "video"

        else:

            return jsonify({

                "message":
                "Invalid file type"

            }), 400

        # =====================
        # CREATE FOLDER
        # =====================

        os.makedirs(

            folder,

            exist_ok=True

        )

        # =====================
        # UNIQUE FILE NAME
        # =====================

        unique_name = (

            str(datetime.utcnow().timestamp())

            .replace(".", "")

            + "_"

            + filename

        )

        filepath = os.path.join(

            folder,

            unique_name

        )

        file.save(filepath)

        # =====================
        # SAVE DB
        # =====================

        media = {

            "title":
            title,

            "description":
            description,

            "category":
            category,

            "media_type":
            media_type,

            "filename":
            unique_name,

            "filepath":
            filepath.replace("\\", "/"),

            "created_at":
            datetime.utcnow()

        }

        mongo.db.gallery.insert_one(
            media
        )

        return jsonify({

            "message":
            "Gallery media uploaded successfully"

        })

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500

# =========================================
# GET GALLERY MEDIA
# =========================================

@media_bp.route(
    "/gallery",
    methods=["GET"]
)

def get_gallery():

    try:

        gallery = []

        for item in mongo.db.gallery.find():

            gallery.append({

                "id":
                str(item["_id"]),

                "title":
                item.get("title"),

                "description":
                item.get("description"),

                "category":
                item.get("category"),

                "media_type":
                item.get("media_type"),

                "filepath":
                item.get("filepath")

            })

        return jsonify(gallery)

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500

# =========================================
# DELETE GALLERY MEDIA
# =========================================

@media_bp.route(
    "/gallery-delete/<id>",
    methods=["DELETE"]
)

@token_required
@role_required("admin")
def delete_gallery_media(id):

    try:

        media = mongo.db.gallery.find_one({

            "_id":
            ObjectId(id)

        })

        if not media:

            return jsonify({

                "message":
                "Media not found"

            }), 404

        # DELETE FILE

        filepath = media.get(
            "filepath"
        )

        if filepath and os.path.exists(filepath):

            os.remove(filepath)

        # DELETE DATABASE

        mongo.db.gallery.delete_one({

            "_id":
            ObjectId(id)

        })

        return jsonify({

            "message":
            "Gallery media deleted successfully"

        })

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500