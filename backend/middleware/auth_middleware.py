from functools import wraps

from flask import request, jsonify, current_app

import jwt
from flask_jwt_extended import decode_token


# =========================================
# TOKEN REQUIRED MIDDLEWARE (FIXED SAFE VERSION)
# =========================================
def token_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        token = None

        # =================================
        # GET AUTH HEADER
        # =================================
        auth_header = request.headers.get("Authorization")

        if auth_header:

            # =================================
            # REMOVE "Bearer "
            # =================================
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

            else:
                token = auth_header

        # =================================
        # TOKEN MISSING
        # =================================
        if not token:
            return jsonify({
                "message": "Token Missing"
            }), 401

        try:

            # =========================================
            # PRIMARY: FLASK-JWT-EXTENDED DECODER
            # =========================================
            try:

                decoded = decode_token(token)

                # ================================
                # FIX: SAFE ROLE EXTRACTION (IMPORTANT FIX)
                # ================================
                request.user = {
                    "user_id": decoded.get("sub"),
                    "identity": decoded.get("sub"),
                    "role": (
                        decoded.get("role")
                        or decoded.get("additional_claims", {}).get("role")
                        or decoded.get("user_claims", {}).get("role")
                    )
                }

            # =========================================
            # FALLBACK: PYJWT DECODER (LEGACY SUPPORT)
            # =========================================
            except Exception:

                secret = current_app.config.get("JWT_SECRET_KEY")

                if not secret:
                    return jsonify({
                        "message": "JWT Secret Key Missing in Config"
                    }), 500

                decoded = jwt.decode(
                    token,
                    secret,
                    algorithms=["HS256"]
                )

                request.user = decoded

        # =================================
        # JWT SPECIFIC ERRORS
        # =================================
        except jwt.ExpiredSignatureError:

            return jsonify({
                "message": "Token Expired"
            }), 401

        except jwt.InvalidTokenError:

            return jsonify({
                "message": "Invalid Token"
            }), 401

        except Exception as e:

            return jsonify({
                "message": "Authentication Failed",
                "error": str(e)
            }), 401

        return f(*args, **kwargs)

    return decorated