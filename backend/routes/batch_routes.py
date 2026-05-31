from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
from bson.errors import InvalidId

batch_bp = Blueprint("batch_bp", __name__)

# =========================================
# HELPERS
# =========================================

def serialize(batch):
    batch["_id"] = str(batch["_id"])
    return batch


def parse_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


# =========================================
# CREATE BATCH
# =========================================

@batch_bp.route("/add-batch", methods=["POST"])
def add_batch():
    try:
        data = request.form

        name = data.get("name", "").strip()
        code = data.get("code", "").strip()

        if not name or not code:
            return jsonify({
                "success": False,
                "message": "Name and Code are required"
            }), 400

        # Prevent duplicate batch code
        existing = mongo.db.batches.find_one({
            "code": code,
            "isDeleted": False
        })

        if existing:
            return jsonify({
                "success": False,
                "message": "Batch code already exists"
            }), 400

        batch = {
            "name": name,
            "code": code,
            "department": data.get("department", "").strip(),
            "strength": parse_int(data.get("strength", 0)),
            "coordinator": data.get("coordinator", "").strip(),
            "startDate": data.get("startDate", ""),
            "endDate": data.get("endDate", ""),
            "status": data.get("status", "Active"),
            "description": data.get("description", "").strip(),
            "isActive": True,
            "isDeleted": False
        }

        result = mongo.db.batches.insert_one(batch)

        return jsonify({
            "success": True,
            "message": "Batch created successfully",
            "batchId": str(result.inserted_id)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# GET BATCHES (SEARCH + PAGINATION + FILTER)
# =========================================

@batch_bp.route("/get-batch", methods=["GET"])
def get_batches():
    try:
        page = max(1, parse_int(request.args.get("page", 1), 1))
        limit = max(1, parse_int(request.args.get("limit", 10), 10))

        search = request.args.get("search", "").strip()
        status = request.args.get("status", "").strip().lower()

        query = {
            "isDeleted": False
        }

        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"code": {"$regex": search, "$options": "i"}},
                {"department": {"$regex": search, "$options": "i"}},
                {"coordinator": {"$regex": search, "$options": "i"}}
            ]

        if status == "active":
            query["isActive"] = True
        elif status == "inactive":
            query["isActive"] = False

        total = mongo.db.batches.count_documents(query)

        pages = max(1, (total + limit - 1) // limit)

        skip = (page - 1) * limit

        batches = list(
            mongo.db.batches.find(query)
            .sort("_id", -1)
            .skip(skip)
            .limit(limit)
        )

        return jsonify({
            "success": True,
            "data": [serialize(batch) for batch in batches],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# GET SINGLE BATCH
# =========================================

@batch_bp.route("/get-batch/<id>", methods=["GET"])
def get_batch_by_id(id):
    try:
        batch = mongo.db.batches.find_one({
            "_id": ObjectId(id),
            "isDeleted": False
        })

        if not batch:
            return jsonify({
                "success": False,
                "message": "Batch not found"
            }), 404

        return jsonify({
            "success": True,
            "data": serialize(batch)
        })

    except InvalidId:
        return jsonify({
            "success": False,
            "message": "Invalid ID"
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# UPDATE BATCH
# =========================================

@batch_bp.route("/update-batch/<id>", methods=["PUT"])
def update_batch(id):
    try:
        data = request.form

        update_data = {
            "name": data.get("name"),
            "code": data.get("code"),
            "department": data.get("department"),
            "strength": parse_int(data.get("strength", 0)),
            "coordinator": data.get("coordinator"),
            "startDate": data.get("startDate"),
            "endDate": data.get("endDate"),
            "status": data.get("status"),
            "description": data.get("description")
        }

        update_data = {
            key: value
            for key, value in update_data.items()
            if value is not None and value != ""
        }

        if "code" in update_data:
            existing = mongo.db.batches.find_one({
                "code": update_data["code"],
                "_id": {"$ne": ObjectId(id)},
                "isDeleted": False
            })

            if existing:
                return jsonify({
                    "success": False,
                    "message": "Batch code already exists"
                }), 400

        result = mongo.db.batches.update_one(
            {
                "_id": ObjectId(id),
                "isDeleted": False
            },
            {
                "$set": update_data
            }
        )

        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "message": "Batch not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Batch updated successfully"
        })

    except InvalidId:
        return jsonify({
            "success": False,
            "message": "Invalid ID"
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# TOGGLE ACTIVE / INACTIVE
# =========================================

@batch_bp.route("/toggle-batch/<id>", methods=["PATCH"])
def toggle_batch(id):
    try:
        batch = mongo.db.batches.find_one(
            {
                "_id": ObjectId(id),
                "isDeleted": False
            },
            {
                "isActive": 1
            }
        )

        if not batch:
            return jsonify({
                "success": False,
                "message": "Batch not found"
            }), 404

        new_status = not batch.get("isActive", True)

        mongo.db.batches.update_one(
            {
                "_id": ObjectId(id)
            },
            {
                "$set": {
                    "isActive": new_status
                }
            }
        )

        return jsonify({
            "success": True,
            "message": f"Batch status updated to {'Active' if new_status else 'Inactive'}",
            "isActive": new_status
        })

    except InvalidId:
        return jsonify({
            "success": False,
            "message": "Invalid ID"
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# SOFT DELETE
# =========================================

@batch_bp.route("/delete-batch/<id>", methods=["DELETE"])
def delete_batch(id):
    try:
        result = mongo.db.batches.update_one(
            {
                "_id": ObjectId(id),
                "isDeleted": False
            },
            {
                "$set": {
                    "isDeleted": True
                }
            }
        )

        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "message": "Batch not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Batch deleted successfully"
        })

    except InvalidId:
        return jsonify({
            "success": False,
            "message": "Invalid ID"
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
# ================ Excel download ==========================
# ==========================================================

@batch_bp.route("/students/<batch_id>", methods=["GET"])
def get_batch_students(batch_id):

    try:

        batch = mongo.db.batches.find_one({
            "_id": ObjectId(batch_id),
            "isDeleted": False
        })

        if not batch:
            return jsonify({
                "success": False,
                "message": "Batch not found"
            }), 404

        batch_code = batch.get("code", "")

        students = list(
            mongo.db.students.find({
                "batch": batch_code
            })
        )

        for student in students:
            student["_id"] = str(student["_id"])

        return jsonify({
            "success": True,
            "students": students,
            "count": len(students)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500