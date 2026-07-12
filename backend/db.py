import os
import pymysql
from contextlib import contextmanager

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Read DB Config
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_HOST = os.environ.get('DB_HOST', 'server.rwebservice.in')
DB_PORT = os.environ.get('DB_PORT', '3306')
DB_NAME = os.environ.get('DB_NAME')

@contextmanager
def get_db_connection():
    """Context manager that yields a raw MySQL database connection."""
    # Check for missing configuration variables
    missing_vars = []
    if not DB_USER: missing_vars.append("DB_USER")
    if not DB_PASSWORD: missing_vars.append("DB_PASSWORD")
    if not DB_NAME: missing_vars.append("DB_NAME")
    
    if missing_vars:
        raise ValueError(
            f"Missing required environment variable(s): {', '.join(missing_vars)}. "
            f"Please configure them in your .env file."
        )
        
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=int(DB_PORT),
            cursorclass=pymysql.cursors.DictCursor
        )
    except pymysql.MySQLError as e:
        # Provide detailed error message if connection fails
        raise ConnectionError(
            f"Failed to connect to MySQL database at {DB_HOST}:{DB_PORT} (Database: '{DB_NAME}', User: '{DB_USER}'). "
            f"Error details: {e}"
        ) from e

    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_db():
    """Initializes the database tables using raw SQL DDL."""
    print(f"Connecting to MySQL database at {DB_HOST}:{DB_PORT} to initialize tables...")
    
    queries = [
        """
        CREATE TABLE IF NOT EXISTS role (
            roleID INT AUTO_INCREMENT PRIMARY KEY,
            RoleName VARCHAR(80) UNIQUE NOT NULL
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS Rolepermissions (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            RoleID INT NOT NULL,
            permission_name VARCHAR(100) NOT NULL,
            FOREIGN KEY (RoleID) REFERENCES role(roleID) ON DELETE CASCADE
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS users (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(120) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            roleID INT,
            FOREIGN KEY (roleID) REFERENCES role(roleID) ON DELETE SET NULL
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS Customer (
            CustomerID INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            mobile_no VARCHAR(20)
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS address (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            CustomerID INT NOT NULL,
            house_no VARCHAR(50),
            area VARCHAR(150),
            pincode VARCHAR(6) NOT NULL,
            town VARCHAR(100),
            state VARCHAR(100),
            FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE CASCADE
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS Trip (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            source_ID INT NOT NULL,
            dest_ID INT NOT NULL,
            cargo_weight DECIMAL(10, 2),
            FOREIGN KEY (source_ID) REFERENCES address(ID),
            FOREIGN KEY (dest_ID) REFERENCES address(ID)
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS driver (
            DriverID INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            contact_no VARCHAR(20),
            safety_rating DECIMAL(3, 2)
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS driver_document (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            DriverID INT NOT NULL,
            document_name VARCHAR(100) NOT NULL,
            filepath VARCHAR(255) NOT NULL,
            expiry_date DATE NULL,
            FOREIGN KEY (DriverID) REFERENCES driver(DriverID) ON DELETE CASCADE
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS vehicle (
            VehicleID INT AUTO_INCREMENT PRIMARY KEY,
            plate_no VARCHAR(50) UNIQUE NOT NULL,
            maxloadcapacity DECIMAL(10, 2),
            status VARCHAR(20) DEFAULT 'available',
            vehicle_type VARCHAR(20),
            odometer DECIMAL(12, 2) DEFAULT 0,
            acquisition_cost DECIMAL(12, 2)
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS vehicle_documents (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            VehicleID INT NOT NULL,
            DocumentName VARCHAR(100) NOT NULL,
            filepath VARCHAR(255) NOT NULL,
            Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            Modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (VehicleID) REFERENCES vehicle(VehicleID) ON DELETE CASCADE
        ) ENGINE=InnoDB;
        """,
        """
        CREATE TABLE IF NOT EXISTS Odometer_reading (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            Vehicle_ID INT NOT NULL,
            reading_value DECIMAL(12, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (Vehicle_ID) REFERENCES vehicle(VehicleID) ON DELETE CASCADE
        ) ENGINE=InnoDB;
        """
    ]
        
    with get_db_connection() as conn:
        cursor = conn.cursor()
        for query in queries:
            cursor.execute(query)
        print("Database tables initialized successfully on MySQL!")

if __name__ == '__main__':
    init_db()
