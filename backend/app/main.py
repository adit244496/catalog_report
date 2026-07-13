import sys
import os

# Ensure the parent directory is in the Python path so 'app.x' imports work!
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, jsonify
from flask_cors import CORS
from app.database import engine, Base
from app.core.config import settings

def create_app():
    import app.models
    from sqlalchemy import text, create_engine
    from sqlalchemy.exc import ProgrammingError, OperationalError
    from app.core.config import settings
    
    # Check if database exists, create it if it doesn't
    try:
        with engine.connect() as conn:
            pass
    except (ProgrammingError, OperationalError) as e:
        error_str = str(e).lower()
        if "does not exist" in error_str or "unknown database" in error_str:
            base_url = settings.DATABASE_URL.rsplit('/', 1)[0]
            db_name = settings.DATABASE_URL.rsplit('/', 1)[1]
            
            # Connect to default 'postgres' database to create the new one
            default_engine = create_engine(f"{base_url}/postgres", isolation_level="AUTOCOMMIT")
            with default_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE {db_name}"))
        else:
            raise e

    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize default users if they don't exist
    from app.database import SessionLocal
    from app import crud
    
    with SessionLocal() as db:
        if not crud.get_user_by_username(db, username="superadmin"):
            crud.create_user(db, username="superadmin", password="Kolkata@123", role_str="super_admin")
        if not crud.get_user_by_username(db, username="admin"):
            crud.create_user(db, username="admin", password="Kolkata@123", role_str="admin")
    app = Flask(__name__)
    app.config['SECRET_KEY'] = settings.SECRET_KEY
    
    # Configure CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register Blueprints
    from app.api.auth import bp as auth_bp
    from app.api.categories import bp as categories_bp
    from app.api.materials import bp as materials_bp
    from app.api.projects import bp as projects_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(materials_bp)
    app.register_blueprint(projects_bp)

    @app.route("/")
    def read_root():
        return jsonify({"message": "Welcome to MatCat API (Flask Version)."})

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=8000)
