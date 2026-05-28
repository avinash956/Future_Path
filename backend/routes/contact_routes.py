from flask import (
    Blueprint,
    request,
    jsonify
)

from extensions import mongo

contact_bp = Blueprint(
    "contact",
    __name__
)

# ======================================
# SEND CONTACT MESSAGE
# ======================================

@contact_bp.route(
"/send",
methods=["POST"]
)

def send_contact():

    try:

        data = request.json

        contact = {

            "name":
            data.get("name"),

            "email":
            data.get("email"),

            "mobile":
            data.get("mobile"),

            "message":
            data.get("message")

        }

        mongo.db.contacts.insert_one(
            contact
        )

        return jsonify({

            "message":
            "Message Sent Successfully"

        })

    except Exception as e:

        return jsonify({

            "message":
            str(e)

        }), 500