from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
import os

from routes.notifications import (
    generate_password,
    send_email,
    send_sms,
    send_whatsapp,
    generate_otp
)

faculty_bp = Blueprint("faculty_bp", __name__)


# =========================
# ADD FACULTY
# =========================
@faculty_bp.route("/add-faculty", methods=["POST"])
def add_faculty():

    print("\n==============================")
    print("🚀 ADD FACULTY API CALLED")
    print("==============================")

    try:

        # =========================
        # DEBUG REQUEST
        # =========================

        print("📩 FORM DATA RECEIVED:")
        print(request.form)

        print("📂 FILES RECEIVED:")
        print(request.files)

        # =========================
        # GET FORM VALUES
        # =========================

        name = request.form.get("name")
        faculty_id = request.form.get("facultyId")

        phone = request.form.get("phone")
        email = request.form.get("email")

        post = request.form.get("post")
        department = request.form.get("department")

        experience = request.form.get("experience")

        status = request.form.get("status")
        description = request.form.get("description")

        # =========================
        # PRINT VALUES
        # =========================

        print("✅ Name:", name)
        print("✅ Faculty ID:", faculty_id)

        print("✅ Phone:", phone)
        print("✅ Email:", email)

        print("✅ Post:", post)
        print("✅ Department:", department)

        print("✅ Experience:", experience)

        print("✅ Status:", status)
        print("✅ Description:", description)

        # =========================
        # IMAGE HANDLING
        # =========================

        image = request.files.get("image")

        safe_filename = ""

        if image and image.filename != "":

            print("🖼 IMAGE RECEIVED:", image.filename)

            os.makedirs("uploads", exist_ok=True)

            safe_filename = image.filename.replace(" ", "_")

            image_path = os.path.join("uploads", safe_filename)

            image.save(image_path)

            print("✅ IMAGE SAVED:", image_path)

        else:

            print("⚠️ No image uploaded")

        # =========================
        # PASSWORD GENERATION
        # =========================

        print("🔐 Generating password...")

        password = generate_password(name, phone)

        print("✅ Password Generated:", password)

        # =========================
        # PREPARE DATABASE DATA
        # =========================

        data = {

            "name": name,
            "facultyId": faculty_id,

            "phone": phone,
            "email": email,

            "post": post,
            "department": department,

            "experience": experience,

            "status": status,
            "description": description,

            "password": password,

            "image": safe_filename
        }

        print("📦 FINAL DATABASE OBJECT:")
        print(data)

        # =========================
        # INSERT INTO MONGODB
        # =========================

        print("💾 Inserting faculty into MongoDB...")

        result = mongo.db.faculty.insert_one(data)

        print("✅ MongoDB Insert Success")
        print("🆔 Inserted ID:", result.inserted_id)

        # =========================
        # SEND EMAIL
        # =========================

        try:

            if email:

                print("📧 Sending Email...")

                send_email(email, password)

                print("✅ Email Sent Successfully")

            else:

                print("⚠️ Email not provided")

        except Exception as email_error:

            print("❌ EMAIL ERROR:")
            print(email_error)

        # =========================
        # SEND SMS
        # =========================

        try:

            if phone:

                print("📱 Sending SMS...")

                send_sms(phone, password)

                print("✅ SMS Sent Successfully")

            else:

                print("⚠️ Phone not provided for SMS")

        except Exception as sms_error:

            print("❌ SMS ERROR:")
            print(sms_error)

        # =========================
        # SEND WHATSAPP
        # =========================

        try:

            if phone:

                print("💬 Sending WhatsApp Message...")

                send_whatsapp(phone, password)

                print("✅ WhatsApp Sent Successfully")

            else:

                print("⚠️ Phone not provided for WhatsApp")

        except Exception as whatsapp_error:

            print("❌ WHATSAPP ERROR:")
            print(whatsapp_error)

        # =========================
        # GENERATE OTP
        # =========================

        try:

            if phone:

                print("🔢 Generating OTP...")

                generate_otp(phone=phone)

                print("✅ OTP Generated Successfully")

            else:

                print("⚠️ Phone not provided for OTP")

        except Exception as otp_error:

            print("❌ OTP ERROR:")
            print(otp_error)

        # =========================
        # SUCCESS RESPONSE
        # =========================

        print("🎉 FACULTY ADDED SUCCESSFULLY")

        return jsonify({
            "success": True,
            "message": "Faculty added successfully",
            "facultyId": str(result.inserted_id)
        }), 200

    except Exception as e:

        print("\n❌ ADD FACULTY FATAL ERROR")
        print(str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================
# GET ALL FACULTY
# =========================
@faculty_bp.route("/get-faculty", methods=["GET"])
def get_faculty():

    try:

        print("\n📥 GET FACULTY API CALLED")

        faculty_list = list(mongo.db.faculty.find())

        print("📄 Total Faculty Found:", len(faculty_list))

        for item in faculty_list:
            item["_id"] = str(item["_id"])

        return jsonify({
            "success": True,
            "faculty": faculty_list
        }), 200

    except Exception as e:

        print("❌ GET FACULTY ERROR:")
        print(str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================
# DELETE FACULTY
# =========================
@faculty_bp.route("/delete-faculty/<id>", methods=["DELETE"])
def delete_faculty(id):

    try:

        print("\n🗑 DELETE FACULTY API CALLED")
        print("🆔 Faculty ID:", id)

        result = mongo.db.faculty.delete_one({
            "_id": ObjectId(id)
        })

        print("🗑 Deleted Count:", result.deleted_count)

        if result.deleted_count > 0:

            print("✅ Faculty Deleted Successfully")

            return jsonify({
                "success": True,
                "message": "Faculty deleted successfully"
            }), 200

        else:

            print("⚠️ Faculty not found")

            return jsonify({
                "success": False,
                "message": "Faculty not found"
            }), 404

    except Exception as e:

        print("❌ DELETE FACULTY ERROR:")
        print(str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500