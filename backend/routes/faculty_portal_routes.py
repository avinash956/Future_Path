from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from datetime import datetime
from extensions import mongo

faculty_portal_bp = Blueprint("faculty_portal_bp", __name__)


# ==================================================
# GET FACULTY BATCHES
# ==================================================

@faculty_portal_bp.route("/batches", methods=["GET"])
@jwt_required()
def get_faculty_batches():
    try:
        faculty_id = get_jwt_identity()

        faculty = None

        # ObjectId search
        try:
            faculty = mongo.db.faculty.find_one({"_id": ObjectId(faculty_id)})
        except:
            pass

        # fallback string search
        if not faculty:
            for f in mongo.db.faculty.find():
                if str(f.get("_id")) == str(faculty_id):
                    faculty = f
                    break

        if not faculty:
            return jsonify({"success": False, "message": "Faculty not found", "batches": []})

        batch_ids = [str(b) for b in faculty.get("batch_ids", [])]

        batches = []
        for b in mongo.db.batches.find():
            if str(b["_id"]) in batch_ids:
                batches.append({
                    "_id": str(b["_id"]),
                    "name": b.get("name"),
                    "code": b.get("code"),
                    "department": b.get("department"),
                    "strength": b.get("strength", 0),
                    "coordinator": b.get("coordinator"),
                    "status": b.get("status")
                })

        return jsonify({"success": True, "batches": batches})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ==================================================
# STEP 1: GET STUDENTS (IMPORTANT FIRST STEP)
# ==================================================

@faculty_portal_bp.route("/attendance/students/<batch_id>", methods=["GET"])
@jwt_required()
def get_batch_students(batch_id):
    try:
        batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})

        if not batch:
            return jsonify({"success": False, "message": "Batch not found", "students": []}), 404

        batch_code = batch.get("code")

        students = list(mongo.db.students.find({
            "batch": str(batch_code)
        }))

        for s in students:
            s["_id"] = str(s["_id"])

        return jsonify({
            "success": True,
            "batchId": batch_id,
            "batchCode": batch_code,
            "students": students,
            "count": len(students)
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e), "students": []}), 500


# ==================================================
# STEP 2: SAVE ATTENDANCE
# ==================================================

@faculty_portal_bp.route("/attendance/save", methods=["POST"])
@jwt_required()
def save_attendance():
    try:
        faculty_id = get_jwt_identity()
        data = request.json

        batch_id = data.get("batchId")
        attendance = data.get("attendance", [])

        if not batch_id:
            return jsonify({"success": False, "message": "Batch ID required"}), 400

        doc = {
            "batchId": batch_id,
            "facultyId": str(faculty_id),
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "attendance": attendance,
            "createdAt": datetime.utcnow()
        }

        mongo.db.attendance.insert_one(doc)

        return jsonify({"success": True, "message": "Attendance saved successfully"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ==================================================
# ATTENDANCE HISTORY
# ==================================================

@faculty_portal_bp.route("/attendance/history/<batch_id>", methods=["GET"])
@jwt_required()
def attendance_history(batch_id):
    try:
        records = mongo.db.attendance.find({
            "batchId": batch_id
        }).sort("createdAt", -1)

        result = [{
            "_id": str(r["_id"]),
            "date": r.get("date"),
            "count": len(r.get("attendance", []))
        } for r in records]

        return jsonify({"success": True, "records": result})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ==================================================
# MATERIALS
# ==================================================

@faculty_portal_bp.route("/materials", methods=["GET"])
@jwt_required()
def get_materials():
    try:
        batch_id = request.args.get("batchId")
        query = {"batchId": batch_id} if batch_id else {}

        materials = mongo.db.materials.find(query)

        result = [{
            "_id": str(m["_id"]),
            "title": m.get("title"),
            "description": m.get("description"),
            "file": m.get("file"),
            "videoUrl": m.get("videoUrl"),
            "batchId": m.get("batchId")
        } for m in materials]

        return jsonify({"success": True, "materials": result})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@faculty_portal_bp.route("/materials/add", methods=["POST"])
@jwt_required()
def add_material():
    try:
        identity = get_jwt_identity()

        material = {
            "title": request.form.get("title"),
            "description": request.form.get("description"),
            "batchId": request.form.get("batchId"),
            "videoUrl": request.form.get("videoUrl"),
            "file": request.form.get("file"),
            "facultyId": str(identity),
            "createdAt": datetime.utcnow()
        }

        result = mongo.db.materials.insert_one(material)

        return jsonify({"success": True, "id": str(result.inserted_id)})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@faculty_portal_bp.route("/materials/<material_id>", methods=["DELETE"])
@jwt_required()
def delete_material(material_id):
    try:
        mongo.db.materials.delete_one({"_id": ObjectId(material_id)})
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ==================================================
# LIVE CLASSES
# ==================================================

@faculty_portal_bp.route("/live/create", methods=["POST"])
@jwt_required()
def create_live():
    try:
        identity = get_jwt_identity()
        data = request.json

        live = {
            "title": data.get("title"),
            "description": data.get("description"),
            "batchId": data.get("batchId"),
            "facultyId": str(identity),
            "facultyName": data.get("facultyName"),
            "meetingLink": data.get("meetingLink"),
            "scheduledDate": data.get("scheduledDate"),
            "scheduledTime": data.get("scheduledTime"),
            "createdAt": datetime.utcnow()
        }

        result = mongo.db.live_classes.insert_one(live)

        return jsonify({"success": True, "id": str(result.inserted_id)})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@faculty_portal_bp.route("/live", methods=["GET"])
@jwt_required()
def get_live():
    try:
        classes = mongo.db.live_classes.find()

        result = [{
            "_id": str(c["_id"]),
            "title": c.get("title"),
            "description": c.get("description"),
            "batchId": c.get("batchId"),
            "facultyName": c.get("facultyName"),
            "meetingLink": c.get("meetingLink"),
            "scheduledDate": c.get("scheduledDate"),
            "scheduledTime": c.get("scheduledTime")
        } for c in classes]

        return jsonify({"success": True, "classes": result})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@faculty_portal_bp.route("/live/<live_id>", methods=["DELETE"])
@jwt_required()
def delete_live(live_id):
    try:
        mongo.db.live_classes.delete_one({"_id": ObjectId(live_id)})
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ==================================================
# LIVE ATTENDANCE
# ==================================================

@faculty_portal_bp.route("/live/attendance/<live_id>", methods=["GET"])
@jwt_required()
def live_attendance(live_id):
    try:
        records = mongo.db.live_attendance.find({"classId": live_id})

        result = [{
            "userId": r.get("userId"),
            "role": r.get("role"),
            "joinedAt": str(r.get("joinedAt"))
        } for r in records]

        return jsonify({"success": True, "records": result})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500