from flask import Blueprint, request, jsonify, Response
from extensions import mongo
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity
from openpyxl import Workbook
import io
import csv
from config import db
from flask_cors import cross_origin

batch_bp = Blueprint("batch_bp", __name__)


# =====================================================
# HELPERS
# =====================================================
def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc


def safe_objectid(val):
    try:
        return ObjectId(str(val))
    except:
        return None


# =====================================================
# ADD BATCH
# =====================================================
@batch_bp.route("/add-batch", methods=["POST"])
@jwt_required()
def add_batch():
    try:
        data = request.form

        name = data.get("name", "").strip()
        code = data.get("code", "").strip()

        if not name or not code:
            return jsonify({"success": False, "message": "Name and Code required"}), 400

        if mongo.db.batches.find_one({"code": code, "isDeleted": False}):
            return jsonify({"success": False, "message": "Batch already exists"}), 400

        batch = {
            "name": name,
            "code": code,
            "department": data.get("department", ""),
            "strength": int(data.get("strength", 0)),
            "coordinator": data.get("coordinator", ""),
            "startDate": data.get("startDate", ""),
            "endDate": data.get("endDate", ""),
            "status": data.get("status", "active"),
            "description": data.get("description", ""),
            "isActive": True,
            "isDeleted": False,
            "faculty_ids": []
        }

        res = mongo.db.batches.insert_one(batch)

        return jsonify({
            "success": True,
            "batchId": str(res.inserted_id),
            "message": "Batch created"
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =====================================================
# GET BATCHES
# =====================================================
@batch_bp.route("/get-batch", methods=["GET"])
@jwt_required()
def get_batches():
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        search = request.args.get("search", "")
        status = request.args.get("status", "")

        query = {"isDeleted": False}

        if search:
            query["name"] = {"$regex": search, "$options": "i"}

        if status:
            query["isActive"] = True if status.lower() == "active" else False

        skip = (page - 1) * limit
        total = mongo.db.batches.count_documents(query)

        batches = list(mongo.db.batches.find(query).skip(skip).limit(limit))

        return jsonify({
            "success": True,
            "data": [serialize(b) for b in batches],
            "pagination": {
                "page": page,
                "pages": (total // limit) + (1 if total % limit else 0)
            }
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# =====================================================
# GET STUDENTS
# =====================================================
@batch_bp.route("/students/<batch_id>", methods=["GET"])
@jwt_required()
def get_students(batch_id):
    try:
        batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})

        if not batch:
            return jsonify({"success": False, "message": "Batch not found"}), 404

        batch_code = batch.get("code")

        students = list(mongo.db.students.find({
            "batch": str(batch_code)
        }))

        for s in students:
            s["_id"] = str(s["_id"])

        return jsonify({
            "success": True,
            "students": students,
            "count": len(students)
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =====================================================
# DOWNLOAD STUDENTS (EXCEL .XLSX)
# =====================================================
@batch_bp.route("/students/download/<batch_id>", methods=["GET"])
@jwt_required()
def download_students_excel(batch_id):
    try:
        batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})

        if not batch:
            return jsonify({"success": False, "message": "Batch not found"}), 404

        batch_code = batch.get("code")

        students = list(mongo.db.students.find({
            "batch": str(batch_code)
        }))

        wb = Workbook()
        ws = wb.active
        ws.title = "Students"

        ws.append(["Name", "Email", "Phone", "Batch"])

        for s in students:
            ws.append([
                s.get("name", ""),
                s.get("email", ""),
                s.get("phone", ""),
                s.get("batch", "")
            ])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return Response(
            output,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=students_{batch_code}.xlsx"
            }
        )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# =====================================================
# TOGGLE BATCH
# =====================================================
@batch_bp.route("/toggle-batch/<id>", methods=["PATCH"])
@jwt_required()
def toggle_batch(id):
    try:
        batch = mongo.db.batches.find_one({"_id": ObjectId(id)})

        if not batch:
            return jsonify({"success": False, "message": "Batch not found"}), 404

        mongo.db.batches.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"isActive": not batch.get("isActive", True)}}
        )

        return jsonify({"success": True, "message": "Batch updated"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =====================================================
# DELETE BATCH
# =====================================================
@batch_bp.route("/delete-batch/<id>", methods=["DELETE"])
@jwt_required()
def delete_batch(id):
    try:
        mongo.db.batches.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"isDeleted": True}}
        )

        return jsonify({"success": True, "message": "Batch deleted"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# =====================================================
#        FACULTY MANAGEMENT SYSTEM  
# =====================================================

# =====================================================
# FACULTY - GET ALL
# =====================================================
@batch_bp.route("/faculty/get-all", methods=["GET"])
@jwt_required()
def get_all_faculty():
    try:
        print("\n🔥 [DEBUG] HIT: /faculty/get-all")
        print("🔐 JWT USER:", get_jwt_identity())
        print("📥 Headers:", dict(request.headers))

        data = list(mongo.db.faculty.find({"status": "active"}))

        print("📦 Faculty Count:", len(data))

        response = {
            "success": True,
            "faculties": [
                {
                    "_id": str(f["_id"]),
                    "name": f.get("name"),
                    "facultyId": f.get("facultyId"),
                    "status": f.get("status")
                }
                for f in data
            ]
        }

        print("📤 Response Ready:", response)

        return jsonify(response)

    except Exception as e:
        print("❌ ERROR in get_all_faculty:", str(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =====================================================
# FACULTY - GET BY BATCH
# =====================================================
@batch_bp.route("/batch-faculty/batch/<batch_id>", methods=["GET"])
@jwt_required()
def get_batch_faculty(batch_id):
    try:
        print("\n🔥 [DEBUG] HIT: get_batch_faculty")
        print("📦 Batch ID:", batch_id)
        print("🔐 JWT USER:", get_jwt_identity())

        batch_obj_id = ObjectId(batch_id)

        batch = mongo.db.batches.find_one({"_id": batch_obj_id})

        if not batch:
            return jsonify({
                "success": False,
                "message": "Batch not found"
            }), 404

        faculty_ids = [
            str(fid)
            for fid in batch.get("facultyIds", [])
        ]

        print("👨‍🏫 Assigned Faculty IDs:", faculty_ids)

        return jsonify({
            "success": True,
            "faculty_ids": faculty_ids
        })  

    except Exception as e:
        print("❌ ERROR get_batch_faculty:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500

# =====================================================
# ASSIGN FACULTY
# =====================================================
@batch_bp.route("/batch-faculty/assign", methods=["POST"])
@jwt_required()
def assign_faculty():
    try:
        print("\n🔥 [DEBUG] HIT: assign_faculty")
        print("📥 Raw Request:", request.json)
        print("🔐 JWT USER:", get_jwt_identity())

        data = request.json

        if not data:
            return jsonify({"success": False, "message": "No JSON received"}), 400

        if "batchId" not in data or "facultyId" not in data:
            print("❌ Missing fields:", data)
            return jsonify({"success": False, "message": "Missing data"}), 400

        try:
            batch_id = ObjectId(data["batchId"])
            faculty_id = ObjectId(data["facultyId"])
        except Exception as e:
            print("❌ ObjectId Error:", e)
            return jsonify({"success": False, "message": "Invalid ID format"}), 400

        mongo.db.batches.update_one(
            {"_id": batch_id},
            {"$addToSet": {"faculty_ids": faculty_id}}
        )

        mongo.db.faculty.update_one(
            {"_id": faculty_id},
            {"$addToSet": {"batch_ids": batch_id}}
        )

        print("✅ Faculty assigned successfully")

        return jsonify({
            "success": True,
            "message": "Faculty assigned successfully"
        })

    except Exception as e:
        print("❌ ERROR assign_faculty:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500

# =====================================================
# REMOVE FACULTY FROM BATCH
# =====================================================
from bson import ObjectId
from flask import request, jsonify

@batch_bp.route("/faculty/assign-bulk", methods=["POST", "OPTIONS"])
def assign_bulk_faculty():

    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    data = request.get_json(silent=True)

    batch_id = data.get("batchId")
    faculty_ids = data.get("facultyIds", [])

    batch_oid = ObjectId(batch_id)
    faculty_oids = [ObjectId(f) for f in faculty_ids]

    print("📦 Batch:", batch_id)
    print("👨‍🏫 Faculties:", faculty_ids)

    # =========================
    # 1. UPDATE BATCH
    # =========================
    mongo.db.batches.update_one(
        {"_id": batch_oid},
        {"$set": {"facultyIds": faculty_oids}}
    )

    # =========================
    # 2. UPDATE FACULTY (IMPORTANT)
    # =========================
    for fid in faculty_oids:
        mongo.db.faculty.update_one(
            {"_id": fid},
            {"$addToSet": {"batch_ids": batch_oid}}  # prevents duplicates
        )

    return jsonify({
        "success": True,
        "message": "Faculty assigned and synced successfully"
    }), 200

@batch_bp.route("/batch-faculty/remove", methods=["DELETE"])
@jwt_required()
def remove_faculty_from_batch():
    try:
        print("\n🔥 [DEBUG] HIT: remove_faculty")
        print("📥 Args:", request.args)
        print("🔐 JWT USER:", get_jwt_identity())

        batch_id = request.args.get("batchId")
        faculty_id = request.args.get("facultyId")

        if not batch_id or not faculty_id:
            print("❌ Missing query params")
            return jsonify({
                "success": False,
                "message": "batchId and facultyId are required"
            }), 400

        try:
            batch_obj_id = ObjectId(batch_id)
            faculty_obj_id = ObjectId(faculty_id)
        except Exception as e:
            print("❌ ObjectId error:", e)
            return jsonify({"success": False, "message": "Invalid ID format"}), 400

        mongo.db.batches.update_one(
            {"_id": batch_obj_id},
            {"$pull": {"faculty_ids": faculty_obj_id}}
        )

        mongo.db.faculty.update_one(
            {"_id": faculty_obj_id},
            {"$pull": {"batch_ids": batch_obj_id}}
        )

        print("✅ Faculty removed successfully")

        return jsonify({
            "success": True,
            "message": "Faculty removed successfully"
        })

    except Exception as e:
        print("❌ ERROR remove_faculty:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500
