from flask import Blueprint, request, jsonify
from config import db

fees_adv_bp = Blueprint("fees_adv_bp", __name__)

# =========================================
# 1. DASHBOARD SUMMARY
# =========================================
@fees_adv_bp.route("/fees/dashboard", methods=["GET"])
def fees_dashboard():

    try:

        total_collected = 0
        total_due = 0

        fees = list(db.fees.find())

        for f in fees:
            total_collected += float(f.get("paid", 0))
            total_due += float(f.get("due", 0))

        return jsonify({
            "success": True,
            "totalCollected": total_collected,
            "totalDue": total_due,
            "totalStudents": len(fees)
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================
# 2. BATCH-WISE REPORT
# =========================================
@fees_adv_bp.route("/fees/batch-report/<batch>", methods=["GET"])
def batch_report(batch):

    try:

        fees = list(db.fees.find({"batch": batch}))

        total = sum(float(f.get("totalFee", 0)) for f in fees)
        paid = sum(float(f.get("paid", 0)) for f in fees)
        due = sum(float(f.get("due", 0)) for f in fees)

        return jsonify({
            "success": True,
            "batch": batch,
            "totalFee": total,
            "paid": paid,
            "due": due,
            "students": len(fees)
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500