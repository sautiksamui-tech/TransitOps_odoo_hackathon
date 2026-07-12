import os
import sys

# Ensure backend directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from a2wsgi import WSGIMiddleware

# Create the Flask WSGI application instance
wsgi_app = create_app()

# Wrap WSGI app in a2wsgi middleware to expose as an ASGI application for Uvicorn
app = WSGIMiddleware(wsgi_app)
