from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from extensions import mongo
import random

student_portal_bp = Blueprint(
    "student_portal_bp",
    __name__
)

# ==================================================
# THOUGHT OF THE DAY
# ==================================================

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

# ==================================================
# GET CURRENT STUDENT
# ==================================================

@student_portal_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_student_profile():

    try:

        student_id = get_jwt_identity()

        student = None

        try:
            student = mongo.db.students.find_one(
                {"_id": ObjectId(student_id)}
            )
        except:
            pass

        if not student:

            for s in mongo.db.students.find():

                if str(s["_id"]) == str(student_id):
                    student = s
                    break

        if not student:

            return jsonify({
                "success": False,
                "message": "Student not found"
            })

        return jsonify({

            "success": True,

            "student": {

                "_id": str(student["_id"]),
                "name": student.get("name"),
                "roll": student.get("roll"),
                "email": student.get("email"),
                "phone": student.get("phone"),
                "batch": student.get("batch"),
                "year": student.get("year"),
                "image": student.get("image")

            },

            "thought": random.choice(THOUGHTS)

        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==================================================
# GET STUDENT BATCH
# ==================================================

@student_portal_bp.route("/batch", methods=["GET"])
@jwt_required()
def get_student_batch():

    try:

        student_id = get_jwt_identity()

        student = None

        try:
            student = mongo.db.students.find_one(
                {"_id": ObjectId(student_id)}
            )
        except:
            pass

        if not student:

            for s in mongo.db.students.find():

                if str(s["_id"]) == str(student_id):
                    student = s
                    break

        if not student:

            return jsonify({
                "success": False,
                "message": "Student not found"
            })

        batch_code = student.get("batch")

        batch = mongo.db.batches.find_one({
            "code": batch_code
        })

        if not batch:

            return jsonify({
                "success": False,
                "message": "Batch not found"
            })

        result = {

            "_id": str(batch["_id"]),
            "name": batch.get("name"),
            "code": batch.get("code"),
            "department": batch.get("department"),
            "strength": batch.get("strength", 0),
            "coordinator": batch.get("coordinator"),
            "status": batch.get("status")

        }

        return jsonify({
            "success": True,
            "batch": result
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==================================================
# STUDENT MATERIALS
# ==================================================

@student_portal_bp.route("/materials", methods=["GET"])
@jwt_required()
def get_student_materials():

    try:

        student_id = get_jwt_identity()

        student = None

        try:
            student = mongo.db.students.find_one(
                {"_id": ObjectId(student_id)}
            )
        except:
            pass

        if not student:

            for s in mongo.db.students.find():

                if str(s["_id"]) == str(student_id):
                    student = s
                    break

        if not student:

            return jsonify({
                "success": False,
                "message": "Student not found"
            })

        batch_code = student.get("batch")

        batch = mongo.db.batches.find_one({
            "code": batch_code
        })

        if not batch:

            return jsonify({
                "success": False,
                "materials": []
            })

        materials = mongo.db.materials.find({
            "batchId": str(batch["_id"])
        })

        result = []

        for m in materials:

            result.append({

                "_id": str(m["_id"]),
                "title": m.get("title"),
                "description": m.get("description"),
                "file": m.get("file"),
                "videoUrl": m.get("videoUrl"),
                "batchId": m.get("batchId")

            })

        return jsonify({
            "success": True,
            "materials": result
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==================================================
# STUDENT LIVE CLASSES
# ==================================================

@student_portal_bp.route("/live", methods=["GET"])
@jwt_required()
def get_student_live_classes():

    try:

        student_id = get_jwt_identity()

        student = None

        try:
            student = mongo.db.students.find_one(
                {"_id": ObjectId(student_id)}
            )
        except:
            pass

        if not student:

            for s in mongo.db.students.find():

                if str(s["_id"]) == str(student_id):
                    student = s
                    break

        if not student:

            return jsonify({
                "success": False,
                "message": "Student not found"
            })

        batch_code = student.get("batch")

        batch = mongo.db.batches.find_one({
            "code": batch_code
        })

        if not batch:

            return jsonify({
                "success": False,
                "classes": []
            })

        classes = mongo.db.live_classes.find({
            "batchId": str(batch["_id"])
        })

        result = []

        for c in classes:

            result.append({

                "_id": str(c["_id"]),
                "title": c.get("title"),
                "description": c.get("description"),
                "facultyName": c.get("facultyName"),
                "meetingLink": c.get("meetingLink"),
                "scheduledDate": c.get("scheduledDate"),
                "scheduledTime": c.get("scheduledTime"),
                "batchId": c.get("batchId")

            })

        return jsonify({
            "success": True,
            "classes": result
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500