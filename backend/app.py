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
        


    # --- Vehicle CRUD APIs ---

    @app.route('/api/vehicles', methods=['GET'])
    def get_vehicles():
        from db import get_db_connection
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Fetch all vehicles
                    cursor.execute("SELECT VehicleID, plate_no, maxloadcapacity, status, vehicle_type, fuel_type, odometer, acquisition_cost FROM vehicle;")
                    vehicles = cursor.fetchall()
                    
                    # Fetch all vehicle documents
                    cursor.execute("SELECT ID, VehicleID, DocumentName, filepath FROM vehicle_documents;")
                    documents = cursor.fetchall()
                    
            # Group documents by VehicleID
            vehicle_docs = {}
            for doc in documents:
                v_id = doc['VehicleID']
                if v_id not in vehicle_docs:
                    vehicle_docs[v_id] = []
                vehicle_docs[v_id].append(doc)
                
            # Attach documents to vehicles
            for v in vehicles:
                v_id = v['VehicleID']
                if v['acquisition_cost'] is not None:
                    v['acquisition_cost'] = float(v['acquisition_cost'])
                v['documents'] = vehicle_docs.get(v_id, [])
                
            return {"status": "success", "vehicles": vehicles}
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/add_vehicle', methods=['POST'])
    def add_vehicle():
        from db import get_db_connection
        
        data = request.get_json() or {}
        plate_no = data.get('plate_no') or request.args.get('plate_no')
        max_load = data.get('maxloadcapacity') or request.args.get('maxloadcapacity')
        status = data.get('status') or request.args.get('status', 'available')
        v_type = data.get('vehicle_type') or request.args.get('vehicle_type')
        fuel_type = data.get('fuel_type') or request.args.get('fuel_type', 'petrol')
        odometer = data.get('odometer') or request.args.get('odometer', 0)
        cost = data.get('acquisition_cost') or request.args.get('acquisition_cost')
        
        if not plate_no:
            return {"status": "error", "message": "plate_no is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if plate_no exists
                    cursor.execute("SELECT VehicleID FROM vehicle WHERE plate_no = %s;", (plate_no,))
                    existing = cursor.fetchone()
                    if existing:
                        return {"status": "error", "message": f"Vehicle with plate_no '{plate_no}' already exists."}, 400
                        
                    cursor.execute(
                        """
                        INSERT INTO vehicle (plate_no, maxloadcapacity, status, vehicle_type, fuel_type, odometer, acquisition_cost) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s);
                        """,
                        (plate_no, max_load, status, v_type, fuel_type, odometer, cost)
                    )
                    vehicle_id = cursor.lastrowid
            return {
                "status": "success",
                "message": "Vehicle added successfully.",
                "vehicle": {
                    "VehicleID": vehicle_id,
                    "plate_no": plate_no,
                    "maxloadcapacity": max_load,
                    "status": status,
                    "vehicle_type": v_type,
                    "fuel_type": fuel_type,
                    "odometer": odometer,
                    "acquisition_cost": cost
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/update_vehicle', methods=['POST', 'PUT'])
    def update_vehicle():
        from db import get_db_connection
        
        data = request.get_json() or {}
        vehicle_id = data.get('vehicleID') or request.args.get('vehicleID')
        plate_no = data.get('plate_no') or request.args.get('plate_no')
        max_load = data.get('maxloadcapacity') or request.args.get('maxloadcapacity')
        status = data.get('status') or request.args.get('status')
        v_type = data.get('vehicle_type') or request.args.get('vehicle_type')
        fuel_type = data.get('fuel_type') or request.args.get('fuel_type')
        odometer = data.get('odometer') or request.args.get('odometer')
        cost = data.get('acquisition_cost') or request.args.get('acquisition_cost')
        
        if not vehicle_id:
            return {"status": "error", "message": "vehicleID is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if vehicle exists
                    cursor.execute("SELECT * FROM vehicle WHERE VehicleID = %s;", (vehicle_id,))
                    vehicle = cursor.fetchone()
                    if not vehicle:
                        return {"status": "error", "message": "Vehicle not found."}, 404
                        
                    # Build updates
                    new_plate = plate_no if plate_no is not None else vehicle['plate_no']
                    new_max_load = max_load if max_load is not None else vehicle['maxloadcapacity']
                    new_status = status if status is not None else vehicle['status']
                    new_type = v_type if v_type is not None else vehicle['vehicle_type']
                    new_fuel = fuel_type if fuel_type is not None else vehicle.get('fuel_type', 'petrol')
                    new_odometer = odometer if odometer is not None else vehicle['odometer']
                    new_cost = cost if cost is not None else vehicle['acquisition_cost']
                    
                    # Verify plate_no constraint if modified
                    if new_plate != vehicle['plate_no']:
                        cursor.execute("SELECT VehicleID FROM vehicle WHERE plate_no = %s AND VehicleID != %s;", (new_plate, vehicle_id))
                        existing = cursor.fetchone()
                        if existing:
                            return {"status": "error", "message": f"Another vehicle with plate_no '{new_plate}' already exists."}, 400
                            
                    cursor.execute(
                        """
                        UPDATE vehicle 
                        SET plate_no=%s, maxloadcapacity=%s, status=%s, vehicle_type=%s, fuel_type=%s, odometer=%s, acquisition_cost=%s 
                        WHERE VehicleID=%s;
                        """,
                        (new_plate, new_max_load, new_status, new_type, new_fuel, new_odometer, new_cost, vehicle_id)
                    )
            return {
                "status": "success",
                "message": "Vehicle updated successfully.",
                "vehicle": {
                    "VehicleID": int(vehicle_id),
                    "plate_no": new_plate,
                    "maxloadcapacity": new_max_load,
                    "status": new_status,
                    "vehicle_type": new_type,
                    "fuel_type": new_fuel,
                    "odometer": new_odometer,
                    "acquisition_cost": new_cost
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/remove_vehicle', methods=['POST', 'DELETE'])
    @app.route('/api/delete_vehicle', methods=['POST', 'DELETE'])
    def delete_vehicle():
        from db import get_db_connection
        
        data = request.get_json() or {}
        vehicle_id = data.get('vehicleID') or request.args.get('vehicleID')
        
        if not vehicle_id:
            return {"status": "error", "message": "vehicleID is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if vehicle exists
                    cursor.execute("SELECT VehicleID FROM vehicle WHERE VehicleID = %s;", (vehicle_id,))
                    existing = cursor.fetchone()
                    if not existing:
                        return {"status": "error", "message": "Vehicle not found."}, 404
                        
                    cursor.execute("DELETE FROM vehicle WHERE VehicleID = %s;", (vehicle_id,))
            return {
                "status": "success",
                "message": f"Vehicle with ID {vehicle_id} deleted successfully."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    # --- Vehicle Document CRUD APIs ---

    @app.route('/api/add_vehicle_document', methods=['POST'])
    def add_vehicle_document():
        from db import get_db_connection
        
        data = request.get_json() or {}
        vehicle_id = data.get('VehicleID') or request.args.get('VehicleID')
        doc_name = data.get('DocumentName') or request.args.get('DocumentName')
        filepath = data.get('filepath') or request.args.get('filepath')
        
        if not vehicle_id or not doc_name or not filepath:
            return {"status": "error", "message": "VehicleID, DocumentName, and filepath are required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if vehicle exists
                    cursor.execute("SELECT VehicleID FROM vehicle WHERE VehicleID = %s;", (vehicle_id,))
                    vehicle_exists = cursor.fetchone()
                    if not vehicle_exists:
                        return {"status": "error", "message": f"Vehicle with ID {vehicle_id} not found."}, 404
                        
                    cursor.execute(
                        "INSERT INTO vehicle_documents (VehicleID, DocumentName, filepath) VALUES (%s, %s, %s);",
                        (vehicle_id, doc_name, filepath)
                    )
                    doc_id = cursor.lastrowid
            return {
                "status": "success",
                "message": "Vehicle document added successfully.",
                "document": {
                    "ID": doc_id,
                    "VehicleID": vehicle_id,
                    "DocumentName": doc_name,
                    "filepath": filepath
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/update_vehicle_document', methods=['POST', 'PUT'])
    def update_vehicle_document():
        from db import get_db_connection
        
        data = request.get_json() or {}
        doc_id = data.get('ID') or request.args.get('ID')
        doc_name = data.get('DocumentName') or request.args.get('DocumentName')
        filepath = data.get('filepath') or request.args.get('filepath')
        
        if not doc_id:
            return {"status": "error", "message": "ID (document ID) is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if document exists
                    cursor.execute("SELECT * FROM vehicle_documents WHERE ID = %s;", (doc_id,))
                    doc = cursor.fetchone()
                    if not doc:
                        return {"status": "error", "message": "Vehicle document not found."}, 404
                        
                    new_name = doc_name if doc_name is not None else doc['DocumentName']
                    new_filepath = filepath if filepath is not None else doc['filepath']
                    
                    cursor.execute(
                        "UPDATE vehicle_documents SET DocumentName=%s, filepath=%s WHERE ID=%s;",
                        (new_name, new_filepath, doc_id)
                    )
            return {
                "status": "success",
                "message": "Vehicle document updated successfully.",
                "document": {
                    "ID": int(doc_id),
                    "VehicleID": doc['VehicleID'],
                    "DocumentName": new_name,
                    "filepath": new_filepath
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/delete_vehicle_document', methods=['POST', 'DELETE'])
    def delete_vehicle_document():
        from db import get_db_connection
        
        data = request.get_json() or {}
        doc_id = data.get('ID') or request.args.get('ID')
        
        if not doc_id:
            return {"status": "error", "message": "ID (document ID) is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if document exists
                    cursor.execute("SELECT ID FROM vehicle_documents WHERE ID = %s;", (doc_id,))
                    existing = cursor.fetchone()
                    if not existing:
                        return {"status": "error", "message": "Vehicle document not found."}, 404
                        
                    cursor.execute("DELETE FROM vehicle_documents WHERE ID = %s;", (doc_id,))
            return {
                "status": "success",
                "message": f"Vehicle document with ID {doc_id} deleted successfully."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    # --- Driver CRUD APIs ---

    @app.route('/api/driver_list', methods=['GET'])
    def driver_list():
        from db import get_db_connection
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT DriverID, name, contact_no, safety_rating FROM driver;")
                    drivers = cursor.fetchall()
            return {"status": "success", "drivers": drivers}
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/add_driver', methods=['POST'])
    def add_driver():
        from db import get_db_connection
        
        data = request.get_json() or {}
        name = data.get('name') or request.args.get('name')
        contact_no = data.get('contact_no') or request.args.get('contact_no')
        safety_rating = data.get('safety_rating') or request.args.get('safety_rating')
        
        if not name:
            return {"status": "error", "message": "name is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO driver (name, contact_no, safety_rating) VALUES (%s, %s, %s);",
                        (name, contact_no, safety_rating)
                    )
                    driver_id = cursor.lastrowid
            return {
                "status": "success",
                "message": "Driver added successfully.",
                "driver": {
                    "DriverID": driver_id,
                    "name": name,
                    "contact_no": contact_no,
                    "safety_rating": safety_rating
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/update_driver', methods=['POST', 'PUT'])
    def update_driver():
        from db import get_db_connection
        
        data = request.get_json() or {}
        driver_id = data.get('driverID') or data.get('DriverID') or request.args.get('driverID') or request.args.get('DriverID')
        name = data.get('name') or request.args.get('name')
        contact_no = data.get('contact_no') or request.args.get('contact_no')
        safety_rating = data.get('safety_rating') or request.args.get('safety_rating')
        
        if not driver_id:
            return {"status": "error", "message": "driverID is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if driver exists
                    cursor.execute("SELECT * FROM driver WHERE DriverID = %s;", (driver_id,))
                    driver = cursor.fetchone()
                    if not driver:
                        return {"status": "error", "message": "Driver not found."}, 404
                        
                    new_name = name if name is not None else driver['name']
                    new_contact = contact_no if contact_no is not None else driver['contact_no']
                    new_rating = safety_rating if safety_rating is not None else driver['safety_rating']
                    
                    cursor.execute(
                        "UPDATE driver SET name=%s, contact_no=%s, safety_rating=%s WHERE DriverID=%s;",
                        (new_name, new_contact, new_rating, driver_id)
                    )
            return {
                "status": "success",
                "message": "Driver updated successfully.",
                "driver": {
                    "DriverID": int(driver_id),
                    "name": new_name,
                    "contact_no": new_contact,
                    "safety_rating": new_rating
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/delete_driver', methods=['POST', 'DELETE'])
    def delete_driver():
        from db import get_db_connection
        
        data = request.get_json() or {}
        driver_id = data.get('driverID') or data.get('DriverID') or request.args.get('driverID') or request.args.get('DriverID')
        
        if not driver_id:
            return {"status": "error", "message": "driverID is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if driver exists
                    cursor.execute("SELECT DriverID FROM driver WHERE DriverID = %s;", (driver_id,))
                    existing = cursor.fetchone()
                    if not existing:
                        return {"status": "error", "message": "Driver not found."}, 404
                        
                    cursor.execute("DELETE FROM driver WHERE DriverID = %s;", (driver_id,))
            return {
                "status": "success",
                "message": f"Driver with ID {driver_id} deleted successfully."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    # --- Driver Document CRUD APIs ---

    @app.route('/api/add_driver_document', methods=['POST'])
    def add_driver_document():
        from db import get_db_connection
        
        data = request.get_json() or {}
        driver_id = data.get('DriverID') or request.args.get('DriverID')
        doc_name = data.get('document_name') or request.args.get('document_name')
        filepath = data.get('filepath') or request.args.get('filepath')
        expiry_date = data.get('expiry_date') or request.args.get('expiry_date')
        
        if not driver_id or not doc_name or not filepath:
            return {"status": "error", "message": "DriverID, document_name, and filepath are required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if driver exists
                    cursor.execute("SELECT DriverID FROM driver WHERE DriverID = %s;", (driver_id,))
                    driver_exists = cursor.fetchone()
                    if not driver_exists:
                        return {"status": "error", "message": f"Driver with ID {driver_id} not found."}, 404
                        
                    cursor.execute(
                        "INSERT INTO driver_document (DriverID, document_name, filepath, expiry_date) VALUES (%s, %s, %s, %s);",
                        (driver_id, doc_name, filepath, expiry_date)
                    )
                    doc_id = cursor.lastrowid
            return {
                "status": "success",
                "message": "Driver document added successfully.",
                "document": {
                    "ID": doc_id,
                    "DriverID": driver_id,
                    "document_name": doc_name,
                    "filepath": filepath,
                    "expiry_date": expiry_date
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/update_driver_document', methods=['POST', 'PUT'])
    def update_driver_document():
        from db import get_db_connection
        
        data = request.get_json() or {}
        doc_id = data.get('ID') or request.args.get('ID')
        doc_name = data.get('document_name') or request.args.get('document_name')
        filepath = data.get('filepath') or request.args.get('filepath')
        expiry_date = data.get('expiry_date') or request.args.get('expiry_date')
        
        if not doc_id:
            return {"status": "error", "message": "ID (document ID) is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if document exists
                    cursor.execute("SELECT * FROM driver_document WHERE ID = %s;", (doc_id,))
                    doc = cursor.fetchone()
                    if not doc:
                        return {"status": "error", "message": "Driver document not found."}, 404
                        
                    new_name = doc_name if doc_name is not None else doc['document_name']
                    new_filepath = filepath if filepath is not None else doc['filepath']
                    new_expiry = expiry_date if expiry_date is not None else doc['expiry_date']
                    
                    cursor.execute(
                        "UPDATE driver_document SET document_name=%s, filepath=%s, expiry_date=%s WHERE ID=%s;",
                        (new_name, new_filepath, new_expiry, doc_id)
                    )
            return {
                "status": "success",
                "message": "Driver document updated successfully.",
                "document": {
                    "ID": int(doc_id),
                    "DriverID": doc['DriverID'],
                    "document_name": new_name,
                    "filepath": new_filepath,
                    "expiry_date": new_expiry
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/delete_driver_document', methods=['POST', 'DELETE'])
    def delete_driver_document():
        from db import get_db_connection
        
        data = request.get_json() or {}
        doc_id = data.get('ID') or request.args.get('ID')
        
        if not doc_id:
            return {"status": "error", "message": "ID (document ID) is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if document exists
                    cursor.execute("SELECT ID FROM driver_document WHERE ID = %s;", (doc_id,))
                    existing = cursor.fetchone()
                    if not existing:
                        return {"status": "error", "message": "Driver document not found."}, 404
                        
                    cursor.execute("DELETE FROM driver_document WHERE ID = %s;", (doc_id,))
            return {
                "status": "success",
                "message": f"Driver document with ID {doc_id} deleted successfully."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/dashboard_stats', methods=['GET'])
    def get_dashboard_stats():
        from db import get_db_connection
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Count users
                    cursor.execute("SELECT COUNT(*) as count FROM users;")
                    users_count = cursor.fetchone()['count']
                    
                    # Count customers
                    cursor.execute("SELECT COUNT(*) as count FROM Customer;")
                    customers_count = cursor.fetchone()['count']
                    
                    # Count vehicles
                    cursor.execute("SELECT COUNT(*) as count FROM vehicle;")
                    vehicles_count = cursor.fetchone()['count']
                    
                    # Count trips
                    cursor.execute("SELECT COUNT(*) as count FROM Trip;")
                    trips_count = cursor.fetchone()['count']
                    
                    # Vehicle status counts
                    cursor.execute("SELECT status, COUNT(*) as count FROM vehicle GROUP BY status;")
                    vehicle_status = cursor.fetchall()
                    
                    # Vehicle fuel counts
                    cursor.execute("SELECT fuel_type, COUNT(*) as count FROM vehicle GROUP BY fuel_type;")
                    vehicle_fuel = cursor.fetchall()
                    
                    # Trip status counts
                    cursor.execute("SELECT status, COUNT(*) as count, SUM(cargo_weight) as total_weight FROM Trip GROUP BY status;")
                    trip_status = cursor.fetchall()
                    
                    # Fetch recent trips to show on dashboard
                    cursor.execute("""
                        SELECT t.ID, t.cargo_weight, t.status, v.plate_no
                        FROM Trip t
                        LEFT JOIN vehicle v ON t.VehicleID = v.VehicleID
                        ORDER BY t.ID DESC LIMIT 5;
                    """)
                    recent_trips = cursor.fetchall()
                    for rt in recent_trips:
                        if rt['cargo_weight'] is not None:
                            rt['cargo_weight'] = float(rt['cargo_weight'])
                            
            # Process outputs to ensure floats are serialized correctly
            for ts in trip_status:
                if ts['total_weight'] is not None:
                    ts['total_weight'] = float(ts['total_weight'])
                    
            return {
                "status": "success",
                "stats": {
                    "users": users_count,
                    "customers": customers_count,
                    "vehicles": vehicles_count,
                    "trips": trips_count,
                    "vehicle_status": vehicle_status,
                    "vehicle_fuel": vehicle_fuel,
                    "trip_status": trip_status,
                    "recent_trips": recent_trips
                }
            }
        except Exception as e:
            import traceback
            with open('error.log', 'w') as f:
                f.write(traceback.format_exc())
            return {"status": "error", "message": str(e)}, 500

    # --- Trip CRUD APIs ---

    @app.route('/api/trip_list', methods=['GET'])
    def trip_list():
        from db import get_db_connection
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT t.ID, t.source_ID, t.dest_ID, t.VehicleID, t.DriverID, t.cargo_weight, t.status,
                               s.house_no AS source_house, s.area AS source_area, s.pincode AS source_pincode, s.town AS source_town, s.state AS source_state,
                               d.house_no AS dest_house, d.area AS dest_area, d.pincode AS dest_pincode, d.town AS dest_town, d.state AS dest_state,
                               v.plate_no, v.maxloadcapacity,
                               dr.name AS driver_name
                        FROM Trip t
                        LEFT JOIN address s ON t.source_ID = s.ID
                        LEFT JOIN address d ON t.dest_ID = d.ID
                        LEFT JOIN vehicle v ON t.VehicleID = v.VehicleID
                        LEFT JOIN driver dr ON t.DriverID = dr.DriverID;
                    """)
                    trips = cursor.fetchall()
                    for t in trips:
                        if t['cargo_weight'] is not None:
                            t['cargo_weight'] = float(t['cargo_weight'])
            return {"status": "success", "trips": trips}
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/add_trip', methods=['POST'])
    def add_trip():
        from db import get_db_connection
        
        data = request.get_json() or {}
        source_id = data.get('source_ID') or request.args.get('source_ID')
        dest_id = data.get('dest_ID') or request.args.get('dest_ID')
        vehicle_id = data.get('VehicleID') or request.args.get('VehicleID')
        driver_id = data.get('DriverID') or request.args.get('DriverID')
        cargo_weight = data.get('cargo_weight') or request.args.get('cargo_weight')
        status = data.get('status') or request.args.get('status', 'pending')
        
        if not source_id or not dest_id:
            return {"status": "error", "message": "source_ID and dest_ID are required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Validate source address exists
                    cursor.execute("SELECT ID FROM address WHERE ID = %s;", (source_id,))
                    if not cursor.fetchone():
                        return {"status": "error", "message": f"Source address with ID {source_id} not found."}, 404
                        
                    # Validate dest address exists
                    cursor.execute("SELECT ID FROM address WHERE ID = %s;", (dest_id,))
                    if not cursor.fetchone():
                        return {"status": "error", "message": f"Destination address with ID {dest_id} not found."}, 404
                        
                    # Validate vehicle load capacity
                    if vehicle_id:
                        cursor.execute("SELECT maxloadcapacity, plate_no FROM vehicle WHERE VehicleID = %s;", (vehicle_id,))
                        veh = cursor.fetchone()
                        if not veh:
                            return {"status": "error", "message": f"Vehicle with ID {vehicle_id} not found."}, 404
                        if cargo_weight and veh['maxloadcapacity'] is not None:
                            if float(cargo_weight) > float(veh['maxloadcapacity']):
                                return {
                                    "status": "error",
                                    "message": f"Cargo weight ({cargo_weight} kg) exceeds vehicle {veh['plate_no']}'s maximum load capacity ({veh['maxloadcapacity']} kg)."
                                }, 400
                                
                    cursor.execute(
                        "INSERT INTO Trip (source_ID, dest_ID, VehicleID, DriverID, cargo_weight, status) VALUES (%s, %s, %s, %s, %s, %s);",
                        (source_id, dest_id, vehicle_id, driver_id, cargo_weight, status)
                    )
                    trip_id = cursor.lastrowid
            return {
                "status": "success",
                "message": "Trip added successfully.",
                "trip": {
                    "ID": trip_id,
                    "source_ID": source_id,
                    "dest_ID": dest_id,
                    "VehicleID": vehicle_id,
                    "DriverID": driver_id,
                    "cargo_weight": cargo_weight,
                    "status": status
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/update_trip', methods=['POST', 'PUT'])
    def update_trip():
        from db import get_db_connection
        
        data = request.get_json() or {}
        trip_id = data.get('ID') or data.get('tripID') or request.args.get('ID') or request.args.get('tripID')
        source_id = data.get('source_ID') or request.args.get('source_ID')
        dest_id = data.get('dest_ID') or request.args.get('dest_ID')
        vehicle_id = data.get('VehicleID') or request.args.get('VehicleID')
        driver_id = data.get('DriverID') or request.args.get('DriverID')
        cargo_weight = data.get('cargo_weight') or request.args.get('cargo_weight')
        status = data.get('status') or request.args.get('status')
        
        if not trip_id:
            return {"status": "error", "message": "trip ID is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if trip exists
                    cursor.execute("SELECT * FROM Trip WHERE ID = %s;", (trip_id,))
                    trip = cursor.fetchone()
                    if not trip:
                        return {"status": "error", "message": "Trip not found."}, 404
                        
                    new_source = source_id if source_id is not None else trip['source_ID']
                    new_dest = dest_id if dest_id is not None else trip['dest_ID']
                    new_vehicle = vehicle_id if vehicle_id is not None else trip.get('VehicleID')
                    new_driver = driver_id if driver_id is not None else trip.get('DriverID')
                    new_weight = cargo_weight if cargo_weight is not None else trip['cargo_weight']
                    new_status = status if status is not None else trip.get('status', 'pending')
                    
                    # Validate source address exists
                    cursor.execute("SELECT ID FROM address WHERE ID = %s;", (new_source,))
                    if not cursor.fetchone():
                        return {"status": "error", "message": f"Source address with ID {new_source} not found."}, 404
                        
                    # Validate dest address exists
                    cursor.execute("SELECT ID FROM address WHERE ID = %s;", (new_dest,))
                    if not cursor.fetchone():
                        return {"status": "error", "message": f"Destination address with ID {new_dest} not found."}, 404
                        
                    # Validate vehicle load capacity
                    if new_vehicle:
                        cursor.execute("SELECT maxloadcapacity, plate_no FROM vehicle WHERE VehicleID = %s;", (new_vehicle,))
                        veh = cursor.fetchone()
                        if not veh:
                            return {"status": "error", "message": f"Vehicle with ID {new_vehicle} not found."}, 404
                        if new_weight and veh['maxloadcapacity'] is not None:
                            if float(new_weight) > float(veh['maxloadcapacity']):
                                return {
                                    "status": "error",
                                    "message": f"Cargo weight ({new_weight} kg) exceeds vehicle {veh['plate_no']}'s maximum load capacity ({veh['maxloadcapacity']} kg)."
                                }, 400
                                
                    cursor.execute(
                        "UPDATE Trip SET source_ID=%s, dest_ID=%s, VehicleID=%s, DriverID=%s, cargo_weight=%s, status=%s WHERE ID=%s;",
                        (new_source, new_dest, new_vehicle, new_driver, new_weight, new_status, trip_id)
                    )
            return {
                "status": "success",
                "message": "Trip updated successfully.",
                "trip": {
                    "ID": int(trip_id),
                    "source_ID": new_source,
                    "dest_ID": new_dest,
                    "VehicleID": new_vehicle,
                    "DriverID": new_driver,
                    "cargo_weight": new_weight,
                    "status": new_status
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/api/delete_trip', methods=['POST', 'DELETE'])
    def delete_trip():
        from db import get_db_connection
        
        data = request.get_json() or {}
        trip_id = data.get('ID') or data.get('tripID') or request.args.get('ID') or request.args.get('tripID')
        
        if not trip_id:
            return {"status": "error", "message": "trip ID is required."}, 400
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Check if trip exists
                    cursor.execute("SELECT ID FROM Trip WHERE ID = %s;", (trip_id,))
                    existing = cursor.fetchone()
                    if not existing:
                        return {"status": "error", "message": "Trip not found."}, 404
                        
                    cursor.execute("DELETE FROM Trip WHERE ID = %s;", (trip_id,))
            return {
                "status": "success",
                "message": f"Trip with ID {trip_id} deleted successfully."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500



    return app

if __name__ == '__main__':
    from werkzeug.security import generate_password_hash
    print(generate_password_hash('12345'))
    app = create_app()
    app.run(debug=True, port=5000)


