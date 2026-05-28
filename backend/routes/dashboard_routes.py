from flask import Blueprint, jsonify, request

from extensions import mongo

from middleware.auth_middleware import token_required

from bson.objectid import ObjectId

dashboard_bp = Blueprint("dashboard", __name__)

# =========================================
# DASHBOARD STATS
# =========================================
@dashboard_bp.route(
"/stats",
methods=["GET"]
)

@token_required
def dashboard_stats():

    try:

        total_students = (
            mongo.db.users.count_documents({
                "role": "student"
            })
        )

        total_faculty = (
            mongo.db.users.count_documents({
                "role": "faculty"
            })
        )

        total_admin = (
            mongo.db.users.count_documents({
                "role": "admin"
            })
        )

        total_users = (
            mongo.db.users.count_documents({})
        )

        pending_users = (
            mongo.db.users.count_documents({
                "approved": False
            })
        )

        total_courses = (
            mongo.db.courses.count_documents({})
        )

        total_batches = (
            mongo.db.batches.count_documents({})
        )

        return jsonify({

            "students":
            total_students,

            "faculty":
            total_faculty,

            "admins":
            total_admin,

            "users":
            total_users,

            "pending_users":
            pending_users,

            "courses":
            total_courses,

            "batches":
            total_batches

        })

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# ADD COURSE
# =========================================
@dashboard_bp.route(
"/add-course",
methods=["POST"]
)

@token_required
def add_course():

    try:

        data = request.json

        course = {

            "course_name":
            data.get("course_name"),

            "description":
            data.get("description"),

            "duration":
            data.get("duration"),

            "fees":
            data.get("fees")

        }

        mongo.db.courses.insert_one(
            course
        )

        return jsonify({

            "message":
            "Course Added Successfully"

        }), 201

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# GET ALL COURSES
# =========================================
@dashboard_bp.route(
"/courses",
methods=["GET"]
)

@token_required
def get_courses():

    try:

        course_list = []

        for course in mongo.db.courses.find():

            course_list.append({

                "id":
                str(course["_id"]),

                "course_name":
                course.get("course_name"),

                "description":
                course.get("description"),

                "duration":
                course.get("duration"),

                "fees":
                course.get("fees")

            })

        return jsonify(course_list)

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# DELETE COURSE
# =========================================
@dashboard_bp.route(
"/delete-course/<id>",
methods=["DELETE"]
)

@token_required
def delete_course(id):

    try:

        mongo.db.courses.delete_one({

            "_id":
            ObjectId(id)

        })

        return jsonify({

            "message":
            "Course Deleted Successfully"

        })

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# ADD BATCH
# =========================================
@dashboard_bp.route(
"/add-batch",
methods=["POST"]
)

@token_required
def add_batch():

    try:

        data = request.json

        batch = {

            "batch_name":
            data.get("batch_name"),

            "course":
            data.get("course"),

            "timing":
            data.get("timing"),

            "faculty":
            data.get("faculty")

        }

        mongo.db.batches.insert_one(
            batch
        )

        return jsonify({

            "message":
            "Batch Added Successfully"

        }), 201

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# GET ALL BATCHES
# =========================================
@dashboard_bp.route(
"/batches",
methods=["GET"]
)

@token_required
def get_batches():

    try:

        batch_list = []

        for batch in mongo.db.batches.find():

            batch_list.append({

                "id":
                str(batch["_id"]),

                "batch_name":
                batch.get("batch_name"),

                "course":
                batch.get("course"),

                "timing":
                batch.get("timing"),

                "faculty":
                batch.get("faculty")

            })

        return jsonify(batch_list)

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# DELETE BATCH
# =========================================
@dashboard_bp.route(
"/delete-batch/<id>",
methods=["DELETE"]
)

@token_required
def delete_batch(id):

    try:

        mongo.db.batches.delete_one({

            "_id":
            ObjectId(id)

        })

        return jsonify({

            "message":
            "Batch Deleted Successfully"

        })

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# ADD NOTES
# =========================================
@dashboard_bp.route(
"/add-note",
methods=["POST"]
)

@token_required
def add_note():

    try:

        data = request.json

        note = {

            "title":
            data.get("title"),

            "description":
            data.get("description"),

            "file_url":
            data.get("file_url")

        }

        mongo.db.notes.insert_one(note)

        return jsonify({

            "message":
            "Notes Added Successfully"

        }), 201

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# GET NOTES
# =========================================
@dashboard_bp.route(
"/notes",
methods=["GET"]
)

@token_required
def get_notes():

    try:

        notes_list = []

        for note in mongo.db.notes.find():

            notes_list.append({

                "id":
                str(note["_id"]),

                "title":
                note.get("title"),

                "description":
                note.get("description"),

                "file_url":
                note.get("file_url")

            })

        return jsonify(notes_list)

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# DELETE NOTE
# =========================================
@dashboard_bp.route(
"/delete-note/<id>",
methods=["DELETE"]
)

@token_required
def delete_note(id):

    try:

        mongo.db.notes.delete_one({

            "_id":
            ObjectId(id)

        })

        return jsonify({

            "message":
            "Note Deleted Successfully"

        })

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500


# =========================================
# GET AI ANALYTICS STATS (ADMIN ONLY)
# =========================================
@dashboard_bp.route(
"/admin/ai-stats",
methods=["GET"]
)

@token_required
def get_ai_stats():

    try:

        # Extract current user context injected by your auth middleware
        current_user = getattr(request, "user", None) or {}

        # Security check matching your role architecture
        if current_user.get("role") != "admin":
            return jsonify({"message": "Unauthorized access. Admins only."}), 403

        total_queries = mongo.db.ai_logs.count_documents({})
        student_queries = mongo.db.ai_logs.count_documents({"role": "student"})
        faculty_queries = mongo.db.ai_logs.count_documents({"role": "faculty"})

        recent_logs = list(mongo.db.ai_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(5))

        return jsonify({
            "status": "success",
            "total_queries": total_queries,
            "student_queries": student_queries,
            "faculty_queries": faculty_queries,
            "recent_activity": recent_logs
        }), 200

    except Exception as e:

        return jsonify({
            "message": "Failed to fetch analytics",
            "error": str(e)
        }), 500


# =========================================
# CLEAR ALL AI LOG HISTORY (ADMIN ONLY)
# =========================================
@dashboard_bp.route(
"/admin/clear-ai-history",
methods=["DELETE"]
)

@token_required
def clear_ai_history():

    try:

        current_user = getattr(request, "user", None) or {}

        if current_user.get("role") != "admin":
            return jsonify({"message": "Unauthorized access. Admins only."}), 403

        mongo.db.ai_logs.delete_many({})

        return jsonify({
            "status": "success",
            "message": "AI query history logs deleted successfully from database."
        }), 200

    except Exception as e:

        return jsonify({
            "message": "Failed to delete history logs",
            "error": str(e)
        }), 500

import time