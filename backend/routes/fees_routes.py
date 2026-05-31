from flask import Blueprint, request, jsonify
from config import db
from datetime import datetime
import random
import logging
import os
import openpyxl
from openpyxl import Workbook
# from drive_service import upload_to_drive
# from sheet_service import save_fee_record

# =========================================================
# LOGGING CONFIG
# =========================================================
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Hide unnecessary MongoDB internal logs
logging.getLogger('pymongo').setLevel(logging.WARNING)
logging.getLogger('mongodb').setLevel(logging.WARNING)

fees_bp = Blueprint("fees", __name__, url_prefix="/api/fees")


# =========================================================
# DEBUG HELPER (ENHANCED)
# =========================================================
def debug_log(title, data=None):

    print("\n" + "=" * 70)
    print(f"🔍 {title}")

    if data is not None:
        print("📦 DATA:", data)

    print("=" * 70 + "\n")


# =========================================================
# 1. GET STUDENT BY ROLL (FEES MODULE CORE API)
# =========================================================
@fees_bp.route('/student/<roll>', methods=['GET'])
def get_student(roll):

    debug_log("GET STUDENT REQUEST", roll)

    try:

        clean_roll = roll.strip().upper()

        print("🎓 Clean Roll:", clean_roll)

        student = db.students.find_one({"roll": clean_roll})

        if not student:

            debug_log("STUDENT NOT FOUND", clean_roll)

            return jsonify({
                "success": False,
                "message": "Student not found"
            }), 404

        debug_log("STUDENT FOUND", student.get("name"))

        print("✅ Student Data:")
        print("Name :", student.get("name"))
        print("Batch:", student.get("batch"))
        print("Phone:", student.get("phone"))

        history = student.get("history") or []

        print("📦 History Count:", len(history))

        return jsonify({
            "success": True,
            "name": student.get("name", ""),
            "roll": student.get("roll", ""),
            "batch": student.get("batch", ""),
            "parentPhone": student.get("phone", ""),
            "history": history
        })

    except Exception as e:

        debug_log("GET STUDENT ERROR", str(e))

        return jsonify({
            "success": False,
            "message": "Server error"
        }), 500


# =========================================================
# 2. SAVE PAYMENT (QR / MANUAL PAYMENT)
# =========================================================
@fees_bp.route('/pay', methods=['POST'])
def pay_fees():

    print("\n================ PAYMENT API STARTED ================\n")

    # DEBUG: SHOW FIRST STUDENT DOCUMENT
    print("📦 First Student Document:")
    print(db.students.find_one())

    data = request.get_json()

    debug_log("PAYMENT REQUEST RECEIVED", data)

    try:

        student_id = data.get("studentId")
        amount = data.get("amount")
        mode = data.get("mode")

        print("🎓 Student ID:", student_id)
        print("💰 Amount:", amount)
        print("💳 Mode:", mode)

        # =========================================================
        # VALIDATION
        # =========================================================
        if not student_id or not amount:

            debug_log("MISSING PAYMENT DATA", data)

            return jsonify({
                "success": False,
                "message": "Missing payment data"
            }), 400

        # =========================================================
        # CLEAN ROLL
        # =========================================================
        clean_roll = str(student_id).strip().upper()

        print("🧹 Clean Roll:", clean_roll)

        # =========================================================
        # FIND STUDENT
        # =========================================================
        student = db.students.find_one({"roll": clean_roll})

        if not student:

            debug_log("STUDENT NOT FOUND FOR PAYMENT", clean_roll)

            return jsonify({
                "success": False,
                "message": "Student not found"
            }), 404

        print("✅ Student Found:", student.get("name"))

        # =========================================================
        # CONVERT AMOUNT
        # =========================================================
        amount = float(amount)

        print("✅ Converted Amount:", amount)

        # =========================================================
        # GENERATE RECEIPT
        # =========================================================
        receipt_no = "FPR-" + datetime.now().strftime("%Y%m%d") + "-" + f"{random.randint(1, 9999):04d}"

        print("🧾 Receipt Number:", receipt_no)

        # =========================================================
        # CREATE PAYMENT RECORD
        # =========================================================
        record = {
            "receiptNo": receipt_no,
            "amount": amount,
            "mode": mode,
            "status": "Paid",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        debug_log("PAYMENT RECORD GENERATED", record)

        # =========================================================
        # 🔥 SAVE TO MONGODB (your existing logic continues)
        # =========================================================
        db.fees.insert_one({
            "studentId": clean_roll,
            "name": student.get("name"),
            "batch": student.get("batch"),
            "payment": record
        })

        print("🗄️ Saved to MongoDB")
        # =========================================================
        # SAVE PAYMENT INTO STUDENT HISTORY
        # =========================================================

        db.students.update_one(
            {"roll": clean_roll},
            {
                "$push": {
                    "history": record
                }
            }
        )

        print("📜 Payment added to student history")

        # # =========================================================
        # # 📊 GOOGLE SHEET INTEGRATION
        # # =========================================================

        # batch_name = student.get("batch")

        # sheet_row = [
        #     clean_roll,
        #     student.get("name"),
        #     amount,
        #     record["date"],
        #     receipt_no,
        #     mode
        # ]
        # try:
        #     save_fee_record(batch_name, sheet_row)
        #     print("📊 Saved to Google Sheet batch:", batch_name)
        # except Exception as e:
        #     print("🔥 ERROR SAVING TO GOOGLE SHEET:", str(e))

        # # =========================================================
        # # 📄 CREATE LOCAL RECEIPT FILE
        # # =========================================================

        # upload_folder = "uploads"
        # os.makedirs(upload_folder, exist_ok=True)

        # receipt_file_path = os.path.join(upload_folder, f"{receipt_no}.txt")

        # with open(receipt_file_path, "w") as f:
        #     f.write(str(record))

        # print("📄 Local receipt file created")

        # # =========================================================
        # # ☁️ GOOGLE DRIVE UPLOAD
        # # =========================================================
        # drive_link = ""
        # file_id = ""
        
        # try:
        #     file_id, drive_link = upload_to_drive(
        #         file_path=receipt_file_path,
        #         file_name=f"{clean_roll}_{receipt_no}.txt",
        #         folder_id="1kvGSa1FFcPrOMHjuk9RbIS3Hp5BZ47p1"  # FuturePath_fees_record folder ID
        #     )

        #     print("☁️ Uploaded to Drive:", drive_link)

        #     # add drive link into record
        #     record["driveLink"] = drive_link
        #     record["fileId"] = file_id
        # except Exception as e:
        #     print("🔥 ERROR UPLOADING TO GOOGLE DRIVE:", str(e))
        #     record["driveLink"] = ""
        #     record["fileId"] = ""
        # =========================================================
        # RESPONSE
        # =========================================================
        return jsonify({
            "success": True,
            "message": "Payment successful",
            "receiptNo": receipt_no,
            
            "data": record
        })

    except Exception as e:

        print("🔥 ERROR:", str(e))
        result = db.students.update_one(
            {"roll": clean_roll},
            {
                "$push": {
                    "history": record
                }
            }
        )
        return jsonify({
            "success": False,
            "message": "Payment failed",
            "error": str(e)
        }), 500

        # =========================================================
        # SAVE HISTORY
        # =========================================================
        print("\n================ MONGODB UPDATE ================\n")

        

        print("Matched Documents :", result.matched_count)
        print("Modified Documents:", result.modified_count)

        if result.matched_count == 0:
            print("❌ No matching student found")

        elif result.modified_count == 0:
            print("⚠ Student found but NOT modified")

        else:
            print("✅ Payment history saved successfully")

        # =========================================================
        # VERIFY UPDATED HISTORY
        # =========================================================
        updated_student = db.students.find_one({"roll": clean_roll})

        updated_history = updated_student.get("history") or []

        print("📦 Updated History Count:", len(updated_history))

        if updated_history:
            print("📄 Latest Record:", updated_history[-1])

        debug_log("PAYMENT SAVED TO DB", clean_roll)

        print("\n================ PAYMENT API SUCCESS ================\n")

        return jsonify({
            "success": True,
            "receiptNo": receipt_no,
            "record": record,
            "student": {
                "id": clean_roll,
                "name": student.get("name", ""),
                "batch": student.get("batch", "")
            }
        })

    except Exception as e:

        debug_log("PAYMENT ERROR", str(e))

        print("\n================ PAYMENT API FAILED ================\n")

        return jsonify({
            "success": False,
            "message": "Payment failed"
        }), 500


# =========================================================
# 3. ADD FEE STRUCTURE (TOTAL / PAID / DUE)
# =========================================================
@fees_bp.route('/add', methods=['POST'])
def add_fee_record():

    try:

        data = request.get_json()

        debug_log("FEE STRUCTURE REQUEST", data)

        roll = data.get("roll")
        total_fee = float(data.get("totalFee", 0))
        paid = float(data.get("paid", 0))

        print("🎓 Roll:", roll)
        print("💰 Total Fee:", total_fee)
        print("💵 Paid:", paid)

        clean_roll = roll.strip().upper()

        student = db.students.find_one({"roll": clean_roll})

        if not student:

            debug_log("STUDENT NOT FOUND (FEE ADD)", clean_roll)

            return jsonify({
                "success": False,
                "message": "Student not found"
            }), 404

        due = total_fee - paid

        print("📉 Due:", due)

        # =========================================================
        # STATUS LOGIC
        # =========================================================
        if paid == 0:
            status = "unpaid"

        elif due > 0:
            status = "partial"

        else:
            status = "paid"

        print("📌 Status:", status)

        fee_record = {
            "roll": clean_roll,
            "name": student.get("name"),
            "batch": student.get("batch"),
            "receiptNo": student.get("receiptNo", "N/A"),
            "totalFee": total_fee,
            "paid": paid,
            "due": due,
            "status": status,
            "date": datetime.now().strftime("%Y-%m-%d")
        }

        debug_log("FEE RECORD GENERATED", fee_record)

        # =========================================================
        # INSERT FEE RECORD
        # =========================================================
        insert_result = db.fees.insert_one(fee_record)

        print("✅ Fee Record Inserted")
        print("Inserted ID:", insert_result.inserted_id)

        # =========================================================
        # UPDATE EXISTING RECORD
        # =========================================================
        update_result = db.fees.update_one(
            {"roll": clean_roll},
            {
                "$set": {
                    "paid": paid,
                    "due": due,
                    "status": status
                }
            }
        )

        print("Matched Fee Docs :", update_result.matched_count)
        print("Modified Fee Docs:", update_result.modified_count)

        debug_log("FEE RECORD SAVED", fee_record)

        return jsonify({
            "success": True,
            "message": "Fee record saved"
        })

    except Exception as e:

        debug_log("FEE ADD ERROR", str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# 4. GET FEE HISTORY BY STUDENT
# =========================================================
@fees_bp.route('/history/<roll>', methods=['GET'])
def get_fee_history(roll):

    debug_log("GET FEE HISTORY", roll)

    try:

        clean_roll = roll.strip().upper()

        print("🧹 Clean Roll:", clean_roll)

        print("\n================ HISTORY SEARCH ================\n")

        student = db.students.find_one({
            "roll": clean_roll
        })

        if not student:

            print("❌ Student NOT Found")

            return jsonify({
                "success": False,
                "message": "Student not found"
            }), 404

        print("✅ Student Found")
        print("Name:", student.get("name"))
        print("Roll:", student.get("roll"))

        history = student.get("history") or []

        print("📦 History Count:", len(history))

        for i, h in enumerate(history):
            print(f"📄 Record {i + 1}:", h)

        print("\n================ HISTORY SUCCESS ================\n")

        return jsonify({
            "success": True,
            "count": len(history),
            "fees": history
        })

    except Exception as e:

        debug_log("FEE HISTORY ERROR", str(e))

        print("\n================ HISTORY FAILED ================\n")

        return jsonify({
            "success": False,
            "message": "Failed to fetch fee history"
        }), 500


# =========================================================
# 5. GET ALL FEES
# =========================================================
@fees_bp.route('/export', methods=['GET'])
def export_fees():

    try:

        export_type = request.args.get("type", "all")

        roll = request.args.get("roll")

        batch = request.args.get("batch")

        students = list(db.students.find({}))

        total_payments = []

        for student in students:

            student_roll = student.get("roll", "")

            student_batch = student.get("batch", "")

            # ==========================
            # Student Filter
            # ==========================
            if export_type == "student":

                if student_roll != roll:
                    continue

            # ==========================
            # Batch Filter
            # ==========================
            elif export_type == "batch":

                if student_batch != batch:
                    continue

            history = student.get("history", [])

            for h in history:

                payment_datetime = h.get("date", "")

                date_part = payment_datetime

                try:

                    split_data = str(payment_datetime).split(" ")

                    if len(split_data) >= 1:
                        date_part = split_data[0]

                except:
                    pass

                total_payments.append({

                    "Roll": student_roll,

                    "Name": student.get("name", ""),

                    "Batch": student_batch,

                    "Amount Paid": h.get("amount", 0),

                    "Receipt No": h.get("receiptNo", ""),

                    "Mode": h.get("mode", ""),

                    "Date": date_part
                })

        return jsonify({

            "success": True,

            "count": len(total_payments),

            "fees": total_payments
        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500
    
# # =========================================================
# # 6. UPLOAD EXCEL TO GOOGLE DRIVE
# # =========================================================
# @fees_bp.route("/upload-receipt", methods=["POST"])
# def upload_receipt():

#     file = request.files.get("file")
#     student_id = request.form.get("student_id")

#     if not file:
#         return jsonify({"success": False, "message": "No file"}), 400

#     upload_folder = "uploads"
#     os.makedirs(upload_folder, exist_ok=True)

#     file_path = os.path.join(upload_folder, file.filename)
#     file.save(file_path)

#     file_id, link = upload_to_drive(
#         file_path,
#         f"{student_id}_{file.filename}",
#         folder_id=None  # optional Drive folder ID
#     )

#     return jsonify({
#         "success": True,
#         "file_id": file_id,
#         "drive_link": link
#     })