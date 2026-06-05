from flask import Blueprint, request, jsonify, Response
from extensions import mongo
from bson import ObjectId
import os
import time
from flask_jwt_extended import jwt_required, get_jwt_identity
from gridfs import GridFS
from bson import ObjectId

notes_video_bp = Blueprint("notes_video_bp", __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "materials")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# =========================================
# SERVE FILES
# =========================================
@notes_video_bp.route("/uploads/<filename>", methods=["GET"])
def uploaded_file(filename):

    filepath = os.path.join(UPLOAD_FOLDER, filename)

    print("=" * 50)
    print("UPLOAD_FOLDER:", UPLOAD_FOLDER)
    print("FILENAME:", filename)
    print("FILEPATH:", filepath)
    print("EXISTS:", os.path.exists(filepath))
    print("=" * 50)

    return send_from_directory(UPLOAD_FOLDER, filename)


# =========================================
# ADD MATERIAL (Admin/Manager/Faculty only)
# =========================================
from gridfs import GridFS

@notes_video_bp.route("/add-material", methods=["POST"])
@jwt_required()
def add_material():

    fs = GridFS(mongo.db)
    try:
        identity = get_jwt_identity()

        # Handle both dict and string identity
        if isinstance(identity, dict):
            role = identity.get("role", "student")
            faculty = identity.get("name", "Unknown")
        else:
            user = mongo.db.users.find_one({"_id": ObjectId(identity)})
            role = user.get("role", "student") if user else "student"
            faculty = user.get("name", "Unknown") if user else "Unknown"

        if role not in ["admin", "manager", "faculty"]:
            return jsonify({
                "success": False,
                "message": "Not authorized"
            }), 403

        title = request.form.get("title") or ""
        material_type = request.form.get("type") or ""
        print("================================")
        print("TYPE:", material_type)
        print("FORM:", request.form)
        print("FILES:", request.files)
        print("================================")
        batch = request.form.get("batch") or ""
        description = request.form.get("description") or ""

        video_url = ""
        file_id = None

        # =========================
        # NOTE UPLOAD
        # =========================
        file_id = None
        video_url = ""

        if material_type in ["note", "video"]:
            print("TYPE:", material_type)
            print("FILES RECEIVED:", request.files)
            uploaded_file = request.files.get("file")
            print("UPLOADED FILE:", uploaded_file)
            if uploaded_file and uploaded_file.filename:

                     file_id = fs.put(
                        uploaded_file,
                        filename=uploaded_file.filename,
                        content_type=uploaded_file.content_type
                )

        # =========================
        # SAVE MATERIAL
        # =========================
        data = {
            "title": title,
            "type": material_type,
            "batch": batch,
            "faculty": faculty,
            "description": description,

            "file_id": file_id,

            "videoUrl": video_url,

            "views": 0,
            "downloads": 0,
            "created_at": time.time()
        }

        mongo.db.study_materials.insert_one(data)

        return jsonify({
            "success": True,
            "message": "Material added successfully"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
# =========================================
# GET MATERIALS (All roles can view)
# =========================================
@notes_video_bp.route("/get-materials", methods=["GET"])
@jwt_required()
def get_materials():
    try:
        batch_code = request.args.get("batch")

        query = {}

        if batch_code:
            query["batch"] = batch_code

        materials = list(mongo.db.study_materials.find(query))

        for m in materials:

            m["_id"] = str(m["_id"])

            # Batch lookup
            m["batch_name"] = None
            m["batch_code"] = None

            if m.get("batch"):

                try:
                    batch = mongo.db.batches.find_one({
                        "_id": ObjectId(m["batch"])
                    })

                    if batch:
                        m["batch_name"] = batch.get("name")
                        m["batch_code"] = batch.get("code")

                except Exception:
                    pass

            # GridFS file URL
            if m.get("file_id"):

                m["file"] = f"/materials/file/{str(m['file_id'])}"
                m["file_id"] = str(m["file_id"])

            else:
                m["file"] = ""

        return jsonify({
            "success": True,
            "materials": materials
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# DOWNLOAD / VIEW TRACKING
# =========================================
@notes_video_bp.route("/download-log", methods=["POST"])
@jwt_required()
def download_log():
    try:
        data = request.get_json()
        url = data.get("url")

        mongo.db.download_logs.insert_one({
            "url": url,
            "time": time.time()
        })

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# DELETE MATERIAL (Admin/Manager/Faculty only)
# =========================================

@notes_video_bp.route("/delete-material/<id>", methods=["DELETE"])
@jwt_required()

def delete_material(id):
    print("JWT:", get_jwt_identity())
    fs = GridFS(mongo.db)

    try:

        identity = get_jwt_identity()

        if isinstance(identity, dict):

            role = identity.get("role", "student")

        else:

            user = mongo.db.users.find_one({
                "_id": ObjectId(identity)
            })

            role = user.get("role", "student") if user else "student"

        if role not in ["admin", "manager", "faculty"]:

            return jsonify({
                "success": False,
                "message": "Not authorized"
            }), 403

        material = mongo.db.study_materials.find_one({
            "_id": ObjectId(id)
        })

        if not material:

            return jsonify({
                "success": False,
                "message": "Material not found"
            }), 404

        # Delete GridFS file
        if material.get("file_id"):

            fs.delete(ObjectId(material["file_id"]))

        # Delete material record
        mongo.db.study_materials.delete_one({
            "_id": ObjectId(id)
        })

        return jsonify({
            "success": True,
            "message": "Material deleted"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    

@notes_video_bp.route("/file/<file_id>", methods=["GET"])
def get_file(file_id):

    fs = GridFS(mongo.db)

    try:

        grid_file = fs.get(ObjectId(file_id))

        return Response(
            grid_file.read(),
            mimetype=grid_file.content_type
        )

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 404