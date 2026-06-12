from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo
from middleware.auth_middleware import token_required
from bson.objectid import ObjectId
import random
import os

dashboard_bp = Blueprint("dashboard", __name__)

# =====================================================
# THOUGHT OF THE DAY
# =====================================================

THOUGHTS = [
    "Success is the sum of small efforts repeated every day.",
    "Education is the passport to the future.",
    "Dream big. Start small. Act now.",
    "Consistency beats talent when talent does not work hard.",
    "Every expert was once a beginner.",
    "Learning never exhausts the mind.",
    "Discipline is the bridge between goals and accomplishment.",
    "Do something today that your future self will thank you for.",
    "Knowledge grows when shared.",
    "Stay focused and never stop learning."
]

# =====================================================
# DASHBOARD STATS
# =====================================================

@dashboard_bp.route("/stats", methods=["GET"])
@token_required
def dashboard_stats():

    try:

        total_users = mongo.db.users.count_documents({})
        total_admin = mongo.db.users.count_documents({"role": "admin"})

        total_students = mongo.db.students.count_documents({})
        total_faculty = mongo.db.faculty.count_documents({})

        total_batches = mongo.db.batches.count_documents({
            "isDeleted": False
        })
        pending_registrations = mongo.db.register_student.count_documents({
            "status": "pending"
        })

        active_students = mongo.db.students.count_documents({
            "status": "active"
        })

        active_faculty = mongo.db.faculty.count_documents({
            "status": "active"
        })

        return jsonify({
            "success": True,
            "students": total_students,
            "faculty": total_faculty,
            "admins": total_admin,
            "users": total_users,
            "batches": total_batches,
            "active_students": active_students,
            "active_faculty": active_faculty,
            "pending_registrations": pending_registrations
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =====================================================
# ADMIN HOME DASHBOARD
# =====================================================

@dashboard_bp.route("/admin-overview", methods=["GET"])
@jwt_required()
def admin_overview():

    try:

        admin_id = get_jwt_identity()

        admin = None

        try:
            admin = mongo.db.users.find_one({
                "_id": ObjectId(admin_id)
            })
        except:
            pass

        if not admin:

            admin = mongo.db.users.find_one({
                "email": admin_id
            })

        admin_name = "Administrator"

        if admin:
            admin_name = admin.get("name", "Administrator")

        # =========================================
        # COUNTS
        # =========================================

        total_students = mongo.db.students.count_documents({})

        total_faculty = mongo.db.faculty.count_documents({})

        total_management = mongo.db.management.count_documents({})

        total_batches = mongo.db.batches.count_documents({
            "isDeleted": False
        })
        pending_registrations = mongo.db.register_student.count_documents({
            "status": "pending"
        })

        # =========================================
        # FEES COLLECTION
        # =========================================

        total_collection = 0
        pending_collection = 0

        fees = mongo.db.fees.find()

        total_collection = 0.0

        for i, fee in enumerate(mongo.db.fees.find()):

            payment = fee.get("payment", {})

            amount = float(payment.get("amount", 0))
            total_collection += amount

        
        # =========================================
        # RECENT STUDENTS
        # =========================================

        recent_students = []

        students = mongo.db.students.find().sort(
            "_id", -1
        ).limit(5)

        for s in students:

            recent_students.append({
                "_id": str(s["_id"]),
                "name": s.get("name"),
                "roll": s.get("roll"),
                "batch": s.get("batch")
            })

        # =========================================
        # RECENT PAYMENTS
        # =========================================

        recent_payments = []

        try:

            payments = mongo.db.fees.find().sort(
                "_id", -1
            ).limit(5)

            for p in payments:

                recent_payments.append({
                    "student": p.get("studentName"),
                    "amount": p.get("paidAmount", 0),
                    "date": p.get("paymentDate")
                })

        except:
            pass

        # =========================================
        # UPCOMING CLASSES
        # =========================================

        upcoming_classes = []

        try:

            classes = mongo.db.live_classes.find().limit(5)

            for c in classes:

                upcoming_classes.append({
                    "title": c.get("title"),
                    "faculty": c.get("facultyName"),
                    "date": c.get("scheduledDate"),
                    "time": c.get("scheduledTime")
                })

        except:
            pass

        # =========================================
        # RESPONSE
        # =========================================

        return jsonify({

            "success": True,

            "adminName": admin_name,

            "thought": random.choice(
                THOUGHTS
            ),

            "stats": {

                "students": total_students,
                "faculty": total_faculty,
                "management": total_management,
                "batches": total_batches,

                "revenue": total_collection,
                "pending": pending_collection,
                "pending_registrations": pending_registrations
            },

            "recentStudents": recent_students,

            "recentPayments": recent_payments,

            "upcomingClasses": upcoming_classes

        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =====================================================
# COURSES
# =====================================================

@dashboard_bp.route("/courses", methods=["GET"])
@token_required
def get_courses():

    try:

        courses = list(
            mongo.db.courses.find()
        )

        for c in courses:
            c["_id"] = str(c["_id"])

        return jsonify(courses)

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500


@dashboard_bp.route("/add-course", methods=["POST"])
@token_required
def add_course():

    try:

        mongo.db.courses.insert_one(
            request.json
        )

        return jsonify({
            "message": "Course Added Successfully"
        }), 201

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500


@dashboard_bp.route("/delete-course/<id>", methods=["DELETE"])
@token_required
def delete_course(id):

    try:

        mongo.db.courses.delete_one({
            "_id": ObjectId(id)
        })

        return jsonify({
            "message": "Deleted"
        })

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500


# =====================================================
# BATCHES
# =====================================================

@dashboard_bp.route("/batches", methods=["GET"])
@token_required
def get_batches():

    try:

        batches = list(
            mongo.db.batches.find({
                "isDeleted": False
            })
        )

        for b in batches:

            b["_id"] = str(b["_id"])

            b["faculty_count"] = len(
                b.get("faculty_ids", [])
            )

            b["student_count"] = len(
                b.get("student_ids", [])
            )

        return jsonify(batches)

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500


@dashboard_bp.route("/delete-batch/<id>", methods=["DELETE"])
@token_required
def delete_batch(id):

    try:

        mongo.db.batches.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"isDeleted": True}}
        )

        return jsonify({
            "message": "Batch Deleted Successfully"
        })

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500


# =====================================================
# NOTES
# =====================================================

@dashboard_bp.route("/notes", methods=["GET"])
@token_required
def get_notes():

    try:

        notes = list(
            mongo.db.notes.find()
        )

        for n in notes:
            n["_id"] = str(n["_id"])

        return jsonify(notes)

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500


# =====================================================
# AI STATS
# =====================================================

@dashboard_bp.route("/admin/ai-stats", methods=["GET"])
@token_required
def get_ai_stats():

    try:

        total = mongo.db.ai_logs.count_documents({})

        return jsonify({
            "total_queries": total
        })

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500


# =====================================================
# CLEAR AI HISTORY
# =====================================================

@dashboard_bp.route("/admin/clear-ai-history", methods=["DELETE"])
@token_required
def clear_ai_history():

    try:

        mongo.db.ai_logs.delete_many({})

        return jsonify({
            "message": "Cleared"
        })

    except Exception as e:

        return jsonify({
            "message": str(e)
        }), 500
    
# =====================================================
# REGISTRATION REQUESTS
# =====================================================

@dashboard_bp.route(
    "/registration-requests",
    methods=["GET"]
)
@jwt_required()
def registration_requests():

    try:

        registrations = []

        data = mongo.db.register_student.find().sort(
            "_id",
            -1
        )

        for r in data:

            registrations.append({

                "_id": str(r["_id"]),

                "name": r.get("name", ""),

                "mobile": r.get("mobile", ""),

                "email": r.get("email", ""),

                "course": r.get("course", ""),

                "photo": r.get("photo", ""),

                "status": r.get(
                    "status",
                    "pending"
                )

            })

        return jsonify({

            "success": True,

            "registrations":
                registrations

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


# =====================================================
# REGISTRATION COUNT
# =====================================================

@dashboard_bp.route(
    "/registration-count",
    methods=["GET"]
)
@jwt_required()
def registration_count():

    try:

        pending = mongo.db.register_student.count_documents({
            "status": "pending"
        })

        approved = mongo.db.register_student.count_documents({
            "status": "approved"
        })

        rejected = mongo.db.register_student.count_documents({
            "status": "rejected"
        })

        return jsonify({

            "success": True,

            "pending": pending,

            "approved": approved,

            "rejected": rejected

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


# =====================================================
# GET ALL REGISTERED STUDENTS
# =====================================================

@dashboard_bp.route(
    "/registrations",
    methods=["GET"]
)
@jwt_required()
def get_registrations():

    try:

        registrations = []

        for reg in mongo.db.register_student.find().sort("_id", -1):

            reg["_id"] = str(reg["_id"])

            registrations.append(reg)

        return jsonify({

            "success": True,

            "registrations": registrations

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500

# =====================================================
# APPROVE REGISTRATION
# =====================================================

@dashboard_bp.route(
    "/approve-registration/<id>",
    methods=["POST"]
)
@jwt_required()
def approve_registration(id):

    try:

        data = request.json

        batch_id = data.get("batch_id")

        if not batch_id:

            return jsonify({

                "success": False,
                "message": "Batch is required"

            }), 400

        registration = mongo.db.register_student.find_one({

            "_id": ObjectId(id)

        })

        if not registration:

            return jsonify({

                "success": False,
                "message": "Registration not found"

            }), 404

        # Prevent duplicate approval

        if registration.get("status") == "approved":

            return jsonify({

                "success": False,
                "message": "Already approved"

            }), 400

        batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})

        batch_name = ""
        batch_code = ""

        if batch:
            batch_name = batch.get("name", "")   # "XI"
            batch_code = batch.get("code", "")   # "XI-26-01"

        photo = registration.get("photo", "")

# CLEAN IMAGE PATH (remove uploads/ prefix if exists)
        if photo:
            photo = os.path.basename(photo)

        student_data = {
            "name": registration.get("name"),
            "phone": registration.get("mobile"),
            "email": registration.get("email"),
            "course": registration.get("course"),

            # FIXED IMAGE FIELD
            "image": photo,

            "batch_id": batch_id,
            "batch_code": batch_code,
            "batch": batch_name,
            "status": "active",

            "roll": "",        # optional (or generate later)
            "address": ""      # optional
        }
        inserted_student = mongo.db.students.insert_one(
            student_data
        )

        mongo.db.register_student.update_one(

            {
                "_id": ObjectId(id)
            },

            {
                "$set": {

                    "status":"approved",

                    "batch_id":batch_id,
                    "batch_code": batch_code,
                    "batch":batch_name,

                    "student_id":str(inserted_student.inserted_id)

                }
            }
        )

        return jsonify({

            "success": True,

            "message":
                "Student Approved Successfully"

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500

# =====================================================
# REJECT REGISTRATION
# =====================================================

@dashboard_bp.route(
    "/reject-registration/<id>",
    methods=["POST"]
)
@jwt_required()
def reject_registration(id):

    try:

        result = mongo.db.register_student.update_one(

            {
                "_id": ObjectId(id)
            },

            {
                "$set": {
                    "status": "rejected"
                }
            }
        )

        if result.matched_count == 0:

            return jsonify({

                "success": False,
                "message": "Registration not found"

            }), 404

        return jsonify({

            "success": True,

            "message":
                "Registration Rejected"

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500
# =====================================================
# Delete REGISTRATION
# ===================================================== 
@dashboard_bp.route('/delete-registration/<id>', methods=['DELETE'])
@jwt_required()
def delete_registration(id):

    result = mongo.db.register_student.delete_one({
        "_id": ObjectId(id)
    })

    if result.deleted_count == 0:
        return jsonify({
            "success": False,
            "message": "Registration not found"
        }), 404

    return jsonify({
        "success": True,
        "message": "Registration deleted successfully"
    })