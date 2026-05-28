from flask import Blueprint, request, jsonify
from config import db
from datetime import datetime
import random

fees_bp = Blueprint("fees_bp", __name__)

# ==========================================
# 1. GET STUDENT BY ROLL (USED IN fetchStudent)
# ==========================================
@fees_bp.route('/fees/student/<roll>', methods=['GET'])
def get_student(roll):

    print("🔍 Searching student:", roll)

    student = db.students.find_one({"roll": roll.strip().upper()})

    if not student:
        print("❌ Student not found")
        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    print("✅ Student found:", student.get("name"))

    return jsonify({
        "success": True,
        "name": student.get("name", ""),
        "batch": student.get("batch", ""),
        "parentPhone": student.get("parentPhone", ""),
        "history": student.get("history", [])
    })


# ==========================================
# 2. SAVE PAYMENT (USED IN generateQR)
# ==========================================
@fees_bp.route('/fees/pay', methods=['POST'])
def pay_fees():

    data = request.get_json()

    print("💰 PAYMENT REQUEST:", data)

    student_id = data.get("studentId")
    amount = data.get("amount")
    mode = data.get("mode")

    if not student_id or not amount:
        return jsonify({
            "success": False,
            "message": "Missing data"
        }), 400

    student = db.students.find_one({"roll": str(student_id)})

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    # Generate receipt number
    receipt_no = "RCPT" + str(random.randint(10000, 99999))

    record = {
        "receiptNo": receipt_no,
        "amount": amount,
        "mode": mode,
        "status": "Paid",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    # Update MongoDB (append history)
    db.students.update_one(
        {"roll": str(student_id)},
        {"$push": {"history": record}}
    )

    print("✅ Payment saved:", record)

    return jsonify({
        "success": True,
        "receiptNo": receipt_no,
        "record": record
    })