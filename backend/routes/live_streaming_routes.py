from flask import Blueprint, request, jsonify
from extensions import mongo
from datetime import datetime
from bson.objectid import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity

live_bp = Blueprint("live_bp", __name__)

# ==========================================================
# SAFE CURRENT USER
# Works for BOTH:
# 1. JWT identity = user id string
# 2. JWT identity = user object/dict
# ==========================================================

def get_current_user():

    identity = get_jwt_identity()

    print("JWT Identity:", identity)
    print("Type:", type(identity))

    # JWT contains only user id
    if isinstance(identity, str):

        user = mongo.db.users.find_one({
            "_id": ObjectId(identity)
        })

        if user:

            user["_id"] = str(user["_id"])

        return user

    # JWT already contains user object
    elif isinstance(identity, dict):

        return identity

    return None

# ==========================================================
# GET ACTIVE BATCHES
# ==========================================================

@live_bp.route("/batches", methods=["GET"])
@jwt_required()
def get_batches():

    batches = []

    for batch in mongo.db.batches.find({"status": "active"}):

        batches.append({
            "_id": str(batch["_id"]),
            "name": batch.get("name", ""),
            "code": batch.get("code", "")
        })

    return jsonify(batches)


# ==========================================================
# GET ACTIVE FACULTY
# ==========================================================

@live_bp.route("/faculty", methods=["GET"])
@jwt_required()
def get_faculty():

    faculty_list = []

    for faculty in mongo.db.faculty.find({"status": "active"}):

        faculty_list.append({
            "_id": str(faculty["_id"]),
            "name": faculty.get("name", ""),
            "facultyId": faculty.get("facultyId", "")
        })

    return jsonify(faculty_list)


# ==========================================================
# CREATE LIVE CLASS
# ==========================================================

@live_bp.route("/create", methods=["POST"])
@jwt_required()
def create_live():

    try:

        user = get_current_user()

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        role = user.get("role", "")

        if role not in ["admin", "faculty", "management"]:
            return jsonify({
                "success": False,
                "message": "Unauthorized"
            }), 403

        data = request.get_json() or {}

        live = {
            "title": data.get("title", ""),
            "description": data.get("description", ""),
            "batchId": data.get("batchId", ""),
            "batchName": data.get("batchName", ""),
            "facultyId": data.get("facultyId", ""),
            "facultyName": data.get("facultyName", ""),
            "platform": data.get("platform", ""),
            "meetingLink": data.get("meetingLink", ""),
            "scheduledDate": data.get("scheduledDate", ""),
            "scheduledTime": data.get("scheduledTime", ""),
            "status": "scheduled",
            "recordingLink": "",
            "createdBy": user.get("_id") or user.get("id"),
            "createdAt": datetime.utcnow()
        }

        result = mongo.db.live_classes.insert_one(live)

        return jsonify({
            "success": True,
            "id": str(result.inserted_id)
        })

    except Exception as e:

        print("CREATE LIVE ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }), 500

# ==========================================================
# GET ALL LIVE CLASSES
# ==========================================================

@live_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_classes():

    classes = []

    for cls in mongo.db.live_classes.find().sort("createdAt", -1):

        cls["_id"] = str(cls["_id"])

        classes.append(cls)

    return jsonify(classes)


# ==========================================================
# JOIN LIVE CLASS
# ==========================================================

@live_bp.route("/join/<class_id>", methods=["POST"])
@jwt_required()
def join_live(class_id):

    try:

        user = get_current_user()

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        user_id = user.get("_id") or user.get("id")

        attendance_exists = mongo.db.live_attendance.find_one({
            "classId": class_id,
            "userId": user_id
        })

        if not attendance_exists:

            mongo.db.live_attendance.insert_one({
                "classId": class_id,
                "userId": user_id,
                "name": user.get("name", ""),
                "role": user.get("role", ""),
                "joinedAt": datetime.utcnow()
            })

        return jsonify({
            "success": True
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }), 500

# ==========================================================
# GET ATTENDANCE
# ==========================================================

@live_bp.route("/attendance/<class_id>", methods=["GET"])
@jwt_required()
def get_attendance(class_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    role = user.get("role", "")

    if role not in ["admin", "faculty", "management"]:
        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 403

    attendance = []

    for record in mongo.db.live_attendance.find({
        "classId": class_id
    }):

        attendance.append({
            "_id": str(record["_id"]),
            "userId": record.get("userId", ""),
            "name": record.get("name", ""),
            "role": record.get("role", ""),
            "joinedAt": str(record.get("joinedAt", ""))
        })

    return jsonify(attendance)


# ==========================================================
# DELETE LIVE CLASS
# ==========================================================

@live_bp.route("/delete/<class_id>", methods=["DELETE"])
@jwt_required()
def delete_live(class_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    role = user.get("role", "")
    

    if role not in ["admin", "faculty", "management"]:
        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 403

    result = mongo.db.live_classes.delete_one({
        "_id": ObjectId(class_id)
    })

    if result.deleted_count == 0:

        return jsonify({
            "success": False,
            "message": "Class not found"
        }), 404

    mongo.db.live_attendance.delete_many({
        "classId": class_id
    })

    return jsonify({
        "success": True,
        "message": "Class deleted successfully"
    })


# ==========================================================
# GET SINGLE LIVE CLASS
# ==========================================================

@live_bp.route("/<class_id>", methods=["GET"])
@jwt_required()
def get_single_class(class_id):

    cls = mongo.db.live_classes.find_one({
        "_id": ObjectId(class_id)
    })

    if not cls:

        return jsonify({
            "success": False,
            "message": "Class not found"
        }), 404

    cls["_id"] = str(cls["_id"])

    return jsonify(cls)