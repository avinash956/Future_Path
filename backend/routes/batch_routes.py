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
    except:
        return default


# =========================================
# CREATE BATCH
# =========================================
@batch_bp.route("/add-batch", methods=["POST"])
def add_batch():

    try:
        data = request.form

        name = data.get("name")
        code = data.get("code")

        if not name or not code:
            return jsonify({
                "success": False,
                "message": "Name and Code are required"
            }), 400

        batch = {
            "name": data.get("name", ""),
            "code": data.get("code", ""),
            "department": data.get("department", ""),
            "strength": parse_int(data.get("strength", 0)),
            "coordinator": data.get("coordinator", ""),
            "startDate": data.get("startDate", ""),
            "endDate": data.get("endDate", ""),
            "status": data.get("status", "Active"),
            "description": data.get("description", ""),

            # MODERN FLAGS
            "isActive": True,
            "isDeleted": False
        }

        mongo.db.batches.insert_one(batch)

        return jsonify({
            "success": True,
            "message": "Batch created successfully"
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# GET BATCHES (SEARCH + PAGINATION + FILTER)
# =========================================
@batch_bp.route("/get-batch", methods=["GET"])
def get_batches():

    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        search = request.args.get("search", "")
        status = request.args.get("status", "")  # Active/Inactive

        query = {
            "isDeleted": False
        }

        # SEARCH by name/code
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"code": {"$regex": search, "$options": "i"}}
            ]

        # FILTER by status
        if status == "active":
            query["isActive"] = True
        elif status == "inactive":
            query["isActive"] = False

        skip = (page - 1) * limit

        batches = list(
            mongo.db.batches.find(query)
            .sort("_id", -1)
            .skip(skip)
            .limit(limit)
        )

        total = mongo.db.batches.count_documents(query)

        return jsonify({
            "success": True,
            "data": [serialize(b) for b in batches],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total // limit) + (1 if total % limit else 0)
            }
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# GET SINGLE BATCH
# =========================================
@batch_bp.route("/get-batch/<id>", methods=["GET"])
def get_batch_by_id(id):

    try:
        batch = mongo.db.batches.find_one({"_id": ObjectId(id), "isDeleted": False})

        if not batch:
            return jsonify({"success": False, "message": "Batch not found"}), 404

        return jsonify({"success": True, "data": serialize(batch)})

    except InvalidId:
        return jsonify({"success": False, "message": "Invalid ID"}), 400


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
            "strength": parse_int(data.get("strength")),
            "coordinator": data.get("coordinator"),
            "startDate": data.get("startDate"),
            "endDate": data.get("endDate"),
            "status": data.get("status"),
            "description": data.get("description"),
        }

        # remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        result = mongo.db.batches.update_one(
            {"_id": ObjectId(id), "isDeleted": False},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"success": False, "message": "Batch not found"}), 404

        return jsonify({"success": True, "message": "Batch updated"})

    except InvalidId:
        return jsonify({"success": False, "message": "Invalid ID"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# TOGGLE ACTIVE / INACTIVE
# =========================================
@batch_bp.route("/toggle-batch/<id>", methods=["PATCH"])
def toggle_batch(id):
    try:
        # Projection optimization: Only fetch the 'isActive' field to save memory
        batch = mongo.db.batches.find_one(
            {"_id": ObjectId(id), "isDeleted": False},
            {"isActive": 1}
        )

        if not batch:
            return jsonify({"success": False, "message": "Batch not found or has been deleted"}), 404

        # Flip the boolean state cleanly (defaults to True if field is missing)
        new_status = not batch.get("isActive", True)

        mongo.db.batches.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"isActive": new_status}}
        )

        return jsonify({
            "success": True,
            "message": f"Batch status updated to {'Active' if new_status else 'Inactive'}",
            "isActive": new_status
        }), 200

    except InvalidId:
        return jsonify({"success": False, "message": "The provided batch ID is structurally invalid."}), 400
    except Exception as e:
        # Catch unexpected database or connection failures
        return jsonify({"success": False, "message": "Internal server configuration error."}), 500

# =========================================
# SOFT DELETE (MODERN SAFE DELETE)
# =========================================
@batch_bp.route("/delete-batch/<id>", methods=["DELETE"])
def delete_batch(id):

    try:
        result = mongo.db.batches.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"isDeleted": True}}
        )

        if result.matched_count == 0:
            return jsonify({"success": False, "message": "Batch not found"}), 404

        return jsonify({"success": True, "message": "Batch deleted (soft delete)"})

    except InvalidId:
        return jsonify({"success": False, "message": "Invalid ID"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500