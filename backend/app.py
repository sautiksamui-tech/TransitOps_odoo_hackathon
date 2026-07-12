import os
from flask import Flask

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from flask_cors import CORS

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

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
