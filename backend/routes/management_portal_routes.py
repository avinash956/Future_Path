from flask import Blueprint, jsonify, request
from extensions import mongo
from middleware.auth_middleware import token_required
from bson.objectid import ObjectId

management_portal_bp = Blueprint("management_portal", __name__)


# =========================================
# DASHBOARD STATS (FIXED FOR NEW SYSTEM)
# =========================================
@management_portal_bp.route("/stats", methods=["GET"])
@token_required
def dashboard_stats():

    try:
        # STUDENT SYSTEM (NEW FIX)
        total_students = mongo.db.students.count_documents({})

        total_faculty = mongo.db.faculty.count_documents({})

        total_batches = mongo.db.batches.count_documents({
            "isDeleted": False
        })

        # ACTIVE STUDENTS
        active_students = mongo.db.students.count_documents({
            "status": "active"
        })

        # ACTIVE FACULTY
        active_faculty = mongo.db.faculty.count_documents({
            "status": "active"
        })

        return jsonify({
            "students": total_students,
            "faculty": total_faculty,
            "batches": total_batches,
            "active_students": active_students,
            "active_faculty": active_faculty
        })

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# =========================================
# ADD COURSE 
# =========================================
@management_portal_bp.route("/add-course", methods=["POST"])
@token_required
def add_course():

    try:
        data = request.json

        mongo.db.courses.insert_one(data)

        return jsonify({"message": "Course Added Successfully"}), 201

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# =========================================
# GET COURSES
# =========================================
@management_portal_bp.route("/courses", methods=["GET"])
@token_required
def get_courses():

    try:

        courses = list(mongo.db.courses.find())

        for c in courses:
            c["_id"] = str(c["_id"])

        return jsonify(courses)

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# =========================================
# DELETE COURSE
# =========================================
@management_portal_bp.route("/delete-course/<id>", methods=["DELETE"])
@token_required
def delete_course(id):

    try:
        mongo.db.courses.delete_one({"_id": ObjectId(id)})
        return jsonify({"message": "Deleted"})

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# =========================================
# BATCH LIST (FIXED)
# =========================================
@management_portal_bp.route("/batches", methods=["GET"])
@token_required
def get_batches():

    try:

        batches = list(mongo.db.batches.find({"isDeleted": False}))

        for b in batches:
            b["_id"] = str(b["_id"])
            b["faculty_count"] = len(b.get("faculty_ids", []))
            b["student_count"] = len(b.get("student_ids", []))

        return jsonify(batches)

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# =========================================
# DELETE BATCH (SAFE)
# =========================================
@management_portal_bp.route("/delete-batch/<id>", methods=["DELETE"])
@token_required
def delete_batch(id):

    try:
        mongo.db.batches.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"isDeleted": True}}
        )

        return jsonify({"message": "Batch Deleted Successfully"})

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# =========================================
# NOTES (UNCHANGED)
# =========================================
@management_portal_bp.route("/notes", methods=["GET"])
@token_required
def get_notes():

    try:

        notes = list(mongo.db.notes.find())

        for n in notes:
            n["_id"] = str(n["_id"])

        return jsonify(notes)

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# =========================================
# AI STATS (FIXED SAFE)
# =========================================
@management_portal_bp.route("/admin/ai-stats", methods=["GET"])
@token_required
def get_ai_stats():

    try:

        current_user = getattr(request, "user", None) or {}

        if current_user.get("role") != "admin":
            return jsonify({"message": "Unauthorized"}), 403

        total = mongo.db.ai_logs.count_documents({})

        return jsonify({
            "total_queries": total
        })

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# =========================================
# CLEAR AI HISTORY
# =========================================
@management_portal_bp.route("/admin/clear-ai-history", methods=["DELETE"])
@token_required
def clear_ai_history():

    try:

        current_user = getattr(request, "user", None) or {}

        if current_user.get("role") != "admin":
            return jsonify({"message": "Unauthorized"}), 403

        mongo.db.ai_logs.delete_many({})

        return jsonify({"message": "Cleared"})

    except Exception as e:
        return jsonify({"message": str(e)}), 500