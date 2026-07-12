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
    
    # Initialize DB tables
    from db import init_db
    try:
        init_db()
    except Exception as e:
        print(f"Database initialization error: {e}")

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

    @app.route('/api/users', methods=['GET'])
    def get_users():
        from db import get_db_connection
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT u.ID, u.email, u.roleID, r.RoleName 
                        FROM users u
                        LEFT JOIN role r ON u.roleID = r.roleID;
                    """)
                    users = cursor.fetchall()
            return {"status": "success", "users": users}
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
        
    @app.route('/api/customers', methods=['GET'])
    def get_customers():
        from db import get_db_connection
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Fetch all customers
                    cursor.execute("SELECT CustomerID, name, mobile_no, email FROM Customer;")
                    customers = cursor.fetchall()
                    
                    # Fetch all addresses
                    cursor.execute("SELECT ID, CustomerID, house_no, area, pincode, town, state FROM address;")
                    addresses = cursor.fetchall()
                    
            # Group addresses by CustomerID
            customer_addresses = {}
            for addr in addresses:
                c_id = addr['CustomerID']
                if c_id not in customer_addresses:
                    customer_addresses[c_id] = []
                customer_addresses[c_id].append(addr)
                
            # Attach addresses to customers
            for cust in customers:
                cust_id = cust['CustomerID']
                cust['addresses'] = customer_addresses.get(cust_id, [])
                
            return {"status": "success", "customers": customers}
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/add_customer', methods=['POST'])
    def add_customer():
        from db import get_db_connection
        data = request.get_json() or {}
        name = data.get('name')
        mobile_no = data.get('mobile_no')
        email = data.get('email') or None
        addresses = data.get('addresses') or []
        
        if not name or not mobile_no:
            return {"status": "error", "message": "name and mobile_no are required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Insert Customer
                    cursor.execute(
                        "INSERT INTO Customer (name, mobile_no, email) VALUES (%s, %s, %s);",
                        (name, mobile_no, email)
                    )
                    customer_id = cursor.lastrowid
                    
                    # Insert Addresses
                    for addr in addresses:
                        cursor.execute(
                            """
                            INSERT INTO address (CustomerID, house_no, area, pincode, town, state) 
                            VALUES (%s, %s, %s, %s, %s, %s);
                            """,
                            (
                                customer_id,
                                addr.get('house_no'),
                                addr.get('area'),
                                addr.get('pincode'),
                                addr.get('town'),
                                addr.get('state')
                            )
                        )
            return {
                "status": "success",
                "message": "Customer and address(es) added successfully.",
                "CustomerID": customer_id
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/remove_customer', methods=['POST', 'DELETE'])
    def remove_customer():
        from db import get_db_connection
        data = request.get_json() or {}
        customer_id = data.get('customerID') or request.args.get('customerID')
        
        if not customer_id:
            return {"status": "error", "message": "customerID is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if customer exists
                    cursor.execute("SELECT CustomerID FROM Customer WHERE CustomerID = %s;", (customer_id,))
                    existing = cursor.fetchone()
                    if not existing:
                        return {"status": "error", "message": "Customer not found."}, 404
                        
                    # Delete (foreign key cascade deletes address table entries)
                    cursor.execute("DELETE FROM Customer WHERE CustomerID = %s;", (customer_id,))
            return {
                "status": "success",
                "message": f"Customer with ID {customer_id} removed successfully."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500
        
    @app.route('/api/edit_customer', methods=['POST'])
    def edit_customer():
        from db import get_db_connection
        data = request.get_json() or {}
        customer_id = data.get('CustomerID')
        name = data.get('name')
        mobile_no = data.get('mobile_no')
        email = data.get('email') or None
        addresses = data.get('addresses') or []
        
        if not customer_id or not name or not mobile_no:
            return {"status": "error", "message": "CustomerID, name, and mobile_no are required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Update Customer profile
                    cursor.execute(
                        "UPDATE Customer SET name = %s, mobile_no = %s, email = %s WHERE CustomerID = %s;",
                        (name, mobile_no, email, customer_id)
                    )
                    
                    # Delete all existing addresses for this customer
                    cursor.execute("DELETE FROM address WHERE CustomerID = %s;", (customer_id,))
                    
                    # Insert updated addresses
                    for addr in addresses:
                        cursor.execute(
                            """
                            INSERT INTO address (CustomerID, house_no, area, pincode, town, state) 
                            VALUES (%s, %s, %s, %s, %s, %s);
                            """,
                            (
                                customer_id,
                                addr.get('house_no'),
                                addr.get('area'),
                                addr.get('pincode'),
                                addr.get('town'),
                                addr.get('state')
                            )
                        )
            return {
                "status": "success",
                "message": "Customer profile and address(es) updated successfully."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500
        
    return app

if __name__ == '__main__':
    from werkzeug.security import generate_password_hash
    print(generate_password_hash('12345'))
    app = create_app()
    app.run(debug=True, port=5000)


