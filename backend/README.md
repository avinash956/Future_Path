# Future Path EduTech Institute

## INSTALLATION

### Install Python Packages

pip install -r requirements.txt

### Run Backend

python app.py

## API ROUTES

### AUTH

POST /register

POST /login

### ADMIN

GET /users

PUT /block-user/<email>

DELETE /delete-user/<email>

### FACULTY

POST /upload-notes

### STUDENT

GET /notes

GET /download/<filename>

## SECURITY

- JWT Authentication
- Password Hashing
- File Validation
- Role Based Access
- Secure Uploads
- API Rate Limiting
- HTTPS Security

## TECHNOLOGY STACK

Frontend:
- HTML
- CSS
- JavaScript

Backend:
- Flask
- MongoDB

Deployment:
- Render
- MongoDB Atlas