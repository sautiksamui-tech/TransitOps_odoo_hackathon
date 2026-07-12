import os
import base64
import json
import hmac
import hashlib
import time
from flask import Flask, request
from werkzeug.security import check_password_hash

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from flask_cors import CORS

def generate_jwt(payload, secret):
    header = {"alg": "HS256", "typ": "JWT"}
    
    def base64url_encode(data):
        if isinstance(data, dict):
            data = json.dumps(data).encode('utf-8')
        return base64.urlsafe_b64encode(data).replace(b'=', b'').decode('utf-8')
        
    header_encoded = base64url_encode(header)
    payload_encoded = base64url_encode(payload)
    
    signature_base = f"{header_encoded}.{payload_encoded}".encode('utf-8')
    signature = hmac.new(secret.encode('utf-8'), signature_base, hashlib.sha256).digest()
    signature_encoded = base64.urlsafe_b64encode(signature).replace(b'=', b'').decode('utf-8')
    
    return f"{header_encoded}.{payload_encoded}.{signature_encoded}"

def create_app(test_config=None):
    app = Flask(__name__)
    CORS(app)  # Enable Cross-Origin Resource Sharing for all origins
    
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
    )

    if test_config:
        app.config.from_mapping(test_config)

    @app.route('/')
    def index():
        return {"status": "success", "message": "TransitOps Backend API is running."}

    @app.route('/api/roles', methods=['GET'])
    def get_roles():
        from db import get_db_connection
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT roleID, RoleName FROM role;")
                    roles = cursor.fetchall()
            return {"status": "success", "roles": roles}
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/login', methods=['POST'])
    def login():
        from db import get_db_connection
     
        
        data = request.get_json() or {}
        email = data.get('email') or request.args.get('email')
        password = data.get('password') or request.args.get('password')
        role_id = data.get('roleID') or request.args.get('roleID')
        
        if not email or not password or not role_id:
            return {"status": "error", "message": "email, password, and roleID parameters are required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT ID, email, password, roleID FROM users WHERE email = %s;", (email,))
                    user = cursor.fetchone()
            
            if not user or not check_password_hash(user['password'], password):
                return {"status": "error", "message": "Invalid email or password."}, 401
                
            if str(user['roleID']) != str(role_id):
                return {"status": "error", "message": "Invalid role specified for this user."}, 401
                
            token = generate_jwt({
                "user_id": user['ID'],
                "email": user['email'],
                "role_id": user['roleID'],
                "exp": int(time.time()) + 86400  # 24 hour expiry
            }, app.config['SECRET_KEY'])

            return {
                "status": "success",
                "message": "Login successful.",
                "token": token,
                "user": {
                    "ID": user['ID'],
                    "email": user['email'],
                    "roleID": user['roleID']
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    
    @app.route('/api/add_user', methods=['POST'])
    def add_users():
        from db import get_db_connection
        from werkzeug.security import generate_password_hash
        
        data = request.get_json() or {}
        email = data.get('email') or request.args.get('email')
        password = data.get('password') or request.args.get('password')
        role_id = data.get('roleID') or request.args.get('roleID')
        
        if not email or not password:
            return {"status": "error", "message": "Email and password are required."}, 400
            
        try:
            hashed_password = generate_password_hash(password)
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if user already exists
                    cursor.execute("SELECT ID FROM users WHERE email = %s;", (email,))
                    existing = cursor.fetchone()
                    if existing:
                        return {"status": "error", "message": "User with this email already exists."}, 400
                        
                    cursor.execute(
                        "INSERT INTO users (email, password, roleID) VALUES (%s, %s, %s);",
                        (email, hashed_password, role_id)
                    )
                    user_id = cursor.lastrowid
            return {
                "status": "success",
                "message": "User created successfully.",
                "user": {
                    "ID": user_id,
                    "email": email,
                    "roleID": role_id
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/remove_user', methods=['POST', 'DELETE'])
    def remove_users():
        from db import get_db_connection
        
        data = request.get_json() or {}
        user_id = data.get('userID') or request.args.get('userID')
        
        if not user_id:
            return {"status": "error", "message": "userID is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if user exists
                    cursor.execute("SELECT ID FROM users WHERE ID = %s;", (user_id,))
                    existing = cursor.fetchone()
                    if not existing:
                        return {"status": "error", "message": "User not found."}, 404
                        
                    cursor.execute("DELETE FROM users WHERE ID = %s;", (user_id,))
            return {
                "status": "success",
                "message": f"User with ID {user_id} removed successfully."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500
        
    return app

if __name__ == '__main__':
    from werkzeug.security import generate_password_hash
    print(generate_password_hash('12345'))
    app = create_app()
    app.run(debug=True, port=5000)


