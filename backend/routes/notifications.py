import random
import smtplib
import requests

from email.mime.text import MIMEText
from datetime import datetime, timedelta

otp_store = {}

# =========================
# PASSWORD GENERATOR
# =========================

def generate_password(name, phone):

    prefix = "FuturePath_"

    name_part = (name or "").replace(" ", "")[:2].upper()

    phone_part = (phone or "")[:2]

    random_part = random.randint(10, 99)

    return f"{prefix}{name_part}{phone_part}_{random_part}"


# =========================
# EMAIL SENDER
# =========================

def send_email(to_email, password):

    try:

        msg = MIMEText(
            f"Your FuturePath password is: {password}"
        )

        msg["Subject"] = "Login Credentials"

        msg["From"] = "avinash.nha@gmail.com"

        msg["To"] = to_email

        server = smtplib.SMTP(
            "smtp.gmail.com",
            587
        )

        server.starttls()

        server.login(
            "avinash.nha@gmail.com",
            "gzja gkzp qlfj sbbi"
        )

        server.send_message(msg)

        server.quit()

        print("✅ EMAIL SENT SUCCESSFULLY to:", to_email)

    except Exception as e:

        print("❌ EMAIL ERROR:", e)


# =========================
# SMS SENDER (FAST2SMS)
# =========================

def send_sms(phone, password):

    try:

        url = "https://www.fast2sms.com/dev/bulkV2"

        payload = {
            "route": "q",
            "message": f"Your FuturePath password is {password}",
            "language": "english",
            "numbers": phone
        }

        headers = {
            "authorization": "YOUR_FAST2SMS_API_KEY"
        }

        response = requests.post(
            url,
            data=payload,
            headers=headers
        )

        print("📩 SMS STATUS CODE:", response.status_code)

        print("📩 SMS RESPONSE:", response.text)

        if response.status_code == 200:

            print("✅ SMS SENT SUCCESSFULLY")

            return True

        else:

            print("❌ SMS FAILED")

            return False

    except Exception as e:

        print("❌ SMS ERROR:", e)

        return False


# =========================
# WHATSAPP SENDER
# =========================

def send_whatsapp(phone, message):

    try:

        # =========================
        # META DETAILS
        # =========================

        PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID"

        ACCESS_TOKEN = "YOUR_PERMANENT_ACCESS_TOKEN"

        # =========================
        # API URL
        # =========================

        url = f"https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages"

        # =========================
        # HEADERS
        # =========================

        headers = {
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }

        # =========================
        # FORMAT PHONE
        # =========================

        formatted_phone = f"91{phone[-10:]}"

        # =========================
        # PAYLOAD
        # =========================

        payload = {
            "messaging_product": "whatsapp",
            "to": formatted_phone,
            "type": "text",
            "text": {
                "body": str(message)
            }
        }

        # =========================
        # SEND REQUEST
        # =========================

        response = requests.post(
            url,
            json=payload,
            headers=headers
        )

        print("📱 WHATSAPP STATUS CODE:", response.status_code)

        print("📱 WHATSAPP RESPONSE:", response.text)

        if response.status_code in [200, 201]:

            print("✅ WHATSAPP MESSAGE SENT SUCCESSFULLY")

            return True

        else:

            print("❌ WHATSAPP FAILED")

            return False

    except Exception as e:

        print("❌ WHATSAPP ERROR:", e)

        return False


# =========================
# EMAIL OTP SENDER
# =========================

def send_email_otp(email, otp):

    try:

        msg = MIMEText(f"Your OTP is: {otp}")

        msg["Subject"] = "OTP Verification"

        msg["From"] = "avinash.nha@gmail.com"

        msg["To"] = email

        server = smtplib.SMTP(
            "smtp.gmail.com",
            587
        )

        server.starttls()

        server.login(
            "avinash.nha@gmail.com",
            "gzja gkzp qlfj sbbi"
        )

        server.send_message(msg)

        server.quit()

        print("📧 OTP SENT TO EMAIL")

    except Exception as e:

        print("❌ EMAIL OTP ERROR:", e)


# =========================
# OTP GENERATOR
# =========================

def generate_otp(email, phone=None):

    otp = random.randint(100000, 999999)

    otp_store[email] = {
        "otp": otp,
        "expires": datetime.now() + timedelta(minutes=10)
    }

    print("🔐 OTP GENERATED:", otp, "for", email)

    # =========================
    # SEND EMAIL OTP
    # =========================

    send_email_otp(email, otp)

    # =========================
    # SEND SMS OTP
    # =========================

    if phone:

        send_sms(phone, f"Your OTP is {otp}")

    # =========================
    # SEND WHATSAPP OTP
    # =========================

    if phone:

        send_whatsapp(
            phone,
            f"Your OTP is: {otp}"
        )

    return otp


# =========================
# VERIFY OTP
# =========================

def verify_otp(email, otp):

    record = otp_store.get(email)

    if not record:

        print("❌ OTP NOT FOUND")

        return False, "OTP not found"

    if datetime.now() > record["expires"]:

        print("⏰ OTP EXPIRED")

        return False, "OTP expired"

    if str(record["otp"]) == str(otp):

        print("✅ OTP VERIFIED")

        return True, "OTP verified"

    print("❌ INVALID OTP")

    return False, "Invalid OTP"


# =========================
# SEND PASSWORD TO ALL
# =========================

def send_credentials(email, phone, password):

    # EMAIL
    send_email(email, password)

    # SMS
    if phone:

        send_sms(
            phone,
            password
        )

    # WHATSAPP
    if phone:

        send_whatsapp(
            phone,
            f"Your FuturePath password is: {password}"
        )