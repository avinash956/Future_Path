# sheet_service.py

import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
import random

SERVICE_ACCOUNT_FILE = "service_account.json"

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

creds = Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=SCOPES
)

client = gspread.authorize(creds)

# Open the main sheet
SHEET_NAME = "Fees_record"
sheet = client.open(SHEET_NAME)

# =========================================================
# SHEET SERVICE FUNCTIONS
# =========================================================
def save_fee_record(batch_name, row_data):
    """
    row_data = list like:
    [student_id, name, amount, date, receipt_no, receipt_link]
    """

    try:
        worksheet = sheet.worksheet(batch_name)
    except:
        # if batch sheet doesn't exist → create it
        worksheet = sheet.add_worksheet(title=batch_name, rows=1000, cols=20)
        worksheet.append_row([
            "Student ID", "Name", "Amount", "Date", "Receipt No", "Receipt Link"
        ])

    worksheet.append_row(row_data)