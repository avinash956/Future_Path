from functools import wraps

from flask import (
    jsonify,
    request
)


# =========================================
# ROLE REQUIRED
# =========================================
def role_required(*roles):

    def wrapper(fn):

        @wraps(fn)
        def decorator(*args, **kwargs):

            # =============================
            # GET USER FROM TOKEN
            # =============================
            current_user = getattr(
                request,
                "user",
                None
            )

            if not current_user:

                return jsonify({

                    "message":
                    "Authentication Required"

                }), 401

            # =============================
            # ROLE CHECK
            # =============================
            if current_user.get("role") not in roles:

                return jsonify({

                    "message":
                    "Unauthorized Access"

                }), 403

            return fn(*args, **kwargs)

        return decorator

    return wrapper