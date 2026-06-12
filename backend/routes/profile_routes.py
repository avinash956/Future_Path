from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from extensions import mongo
from bson import ObjectId
from werkzeug.utils import secure_filename

import os
import time

profile_bp = Blueprint(
    "profile_bp",
    __name__
)

UPLOAD_FOLDER = "uploads"
os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# =========================================
# FIND USER COLLECTION
# =========================================

def find_user_by_id(user_id):

    try:

        oid = ObjectId(user_id)

    except:

        return None, None

    student = mongo.db.students.find_one(
        {"_id": oid}
    )

    if student:
        return student, mongo.db.students

    faculty = mongo.db.faculty.find_one(
        {"_id": oid}
    )

    if faculty:
        return faculty, mongo.db.faculty

    management = mongo.db.management.find_one(
        {"_id": oid}
    )

    if management:
        return management, mongo.db.management

    admin = mongo.db.users.find_one(
        {"_id": oid}
    )

    if admin:
        return admin, mongo.db.users

    return None, None


# =========================================
# GET PROFILE
# =========================================

@profile_bp.route(
    "/api/profile/get-profile",
    methods=["GET"]
)
@jwt_required()
def get_profile():

    try:

        user_id = get_jwt_identity()

        user, collection = find_user_by_id(
            user_id
        )

        if not user:

            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        return jsonify({

            "success": True,

            "name":
            user.get("name", ""),

            "email":
            user.get("email", ""),

            "mobile":
            user.get(
                "mobile",
                user.get("phone", "")
            ),

            "image":
            user.get(
                "image",
                user.get(
                    "profile_pic",
                    ""
                )
            )

        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================
# UPDATE PROFILE
# =========================================

@profile_bp.route(
    "/api/profile/update-profile",
    methods=["PUT"]
)
@jwt_required()
def update_profile():

    try:

        user_id = get_jwt_identity()

        user, collection = find_user_by_id(
            user_id
        )

        if not user:

            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        update_data = {}

        name = request.form.get("name")
        email = request.form.get("email")
        mobile = request.form.get("mobile")

        if name:
            update_data["name"] = name

        if email:
            update_data["email"] = email

        # student uses phone field
        if collection.name == "students":

            if mobile:
                update_data["phone"] = mobile

        else:

            if mobile:
                update_data["mobile"] = mobile

        # =====================================
        # IMAGE UPDATE
        # =====================================

        image = request.files.get(
            "profilePic"
        )

        if image:

            filename = (
                str(int(time.time()))
                + "_"
                + secure_filename(
                    image.filename
                )
            )

            filepath = os.path.join(
                UPLOAD_FOLDER,
                filename
            )

            image.save(filepath)

            if collection.name == "users":

                update_data[
                    "profile_pic"
                ] = filename

            else:

                update_data[
                    "image"
                ] = filename

        collection.update_one(
            {
                "_id":
                ObjectId(user_id)
            },
            {
                "$set":
                update_data
            }
        )

        return jsonify({
            "success": True,
            "message": "Profile Updated Successfully"
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500