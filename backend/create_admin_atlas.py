from pymongo import MongoClient
from werkzeug.security import generate_password_hash

# 🔴 Replace with your Atlas URI
MONGO_URI="mongodb+srv://avinashnha_db_user:Avinash1710@cluster0.wwekatg.mongodb.net/future_path?retryWrites=true&w=majority"

client = MongoClient(MONGO_URI)

db = client["futurepath_db"]   # ⚠️ must match your Atlas DB name
users = db["users"]

admin = {
    "name": "Super Admin",
    "email": "avinash.nha@gmail.com",
    "password": generate_password_hash("admin@123"),
    "role": "admin"
}

if users.find_one({"email": admin["email"]}):
    print("Admin already exists")
else:
    users.insert_one(admin)
    print("Admin created successfully")