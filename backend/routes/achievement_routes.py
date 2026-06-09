from flask import Blueprint, request, jsonify
from extensions import mongo
from bson.objectid import ObjectId

achievement_bp = Blueprint("achievement_bp", __name__)

# =========================
# GET ALL ACHIEVEMENTS
# =========================
@achievement_bp.route("/", methods=["GET"])
def get_achievements():
    try:
        data = mongo.db.achievements.find().sort("createdAt", -1)

        result = []
        for item in data:
            result.append({
                "_id": str(item["_id"]),
                "title": item.get("title"),
                "desc": item.get("desc"),
                "createdAt": item.get("createdAt")
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# ADD ACHIEVEMENT (ADMIN)
# =========================
@achievement_bp.route("/", methods=["POST"])
def add_achievement():
    try:
        data = request.json

        new_item = {
            "title": data.get("title"),
            "desc": data.get("desc"),
            "createdAt": mongo.db.command("serverStatus")  # optional timestamp fallback
        }

        result = mongo.db.achievements.insert_one(new_item)

        return jsonify({
            "message": "Achievement added",
            "_id": str(result.inserted_id)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# DELETE ACHIEVEMENT
# =========================
@achievement_bp.route("/<id>", methods=["DELETE"])
def delete_achievement(id):
    try:
        mongo.db.achievements.delete_one({"_id": ObjectId(id)})

        return jsonify({
            "message": "Deleted successfully"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500