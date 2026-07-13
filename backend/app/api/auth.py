from functools import wraps
from flask import Blueprint, request, jsonify, send_file
import io
import pandas as pd
from datetime import timedelta
import jwt

from app import crud, models
from app.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.config import settings

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split(" ")
            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]
        
        if not token:
            return jsonify({"detail": "Token is missing"}), 401
            
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username = payload.get("sub")
            with get_db() as db:
                current_user = crud.get_user_by_username(db, username=username)
                if not current_user:
                    return jsonify({"detail": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"detail": "Token is invalid or expired"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role.value not in roles:
                return jsonify({"detail": "You do not have permission to perform this action"}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

@bp.route("/login", methods=["POST"])
def login():
    # Can accept JSON or Form data depending on how frontend sends it
    data = request.get_json(silent=True)
    if data is None:
        data = request.form
    username = data.get("username")
    password = data.get("password")
    
    with get_db() as db:
        user = crud.get_user_by_username(db, username=username)
        if not user or not verify_password(password, user.hashed_password):
            return jsonify({"detail": "Incorrect username or password"}), 401
            
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role.value}, expires_delta=access_token_expires
        )
        return jsonify({
            "access_token": access_token, 
            "token_type": "bearer",
            "is_first_login": user.is_first_login
        })

@bp.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = "Kolkata@123"
    role = data.get("role", "viewer")
    
    with get_db() as db:
        db_user = crud.get_user_by_username(db, username=username)
        if db_user:
            return jsonify({"detail": "Username already registered"}), 400
        
        user = crud.create_user(db=db, username=username, password=password, role_str=role)
        return jsonify({"id": user.id, "username": user.username, "role": user.role.value}), 201

@bp.route("/reset-password", methods=["POST"])
@token_required
def reset_password(current_user):
    data = request.json
    new_password = data.get("new_password")
    
    if not new_password:
        return jsonify({"detail": "New password is required"}), 400
        
    with get_db() as db:
        user = crud.reset_user_password(db, current_user.id, new_password)
        if not user:
            return jsonify({"detail": "Error resetting password"}), 500
        return jsonify({"detail": "Password reset successfully"})

@bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user):
    return jsonify({"id": current_user.id, "username": current_user.username, "role": current_user.role.value})

@bp.route("/users", methods=["GET"])
@token_required
@role_required("super_admin")
def list_users(current_user):
    with get_db() as db:
        users = crud.get_users(db)
        return jsonify([{"id": u.id, "username": u.username, "role": u.role.value} for u in users])

@bp.route("/users/<int:user_id>", methods=["PUT"])
@token_required
@role_required("super_admin")
def update_user(current_user, user_id):
    data = request.json
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    
    with get_db() as db:
        user = crud.update_user(db=db, user_id=user_id, username=username, password=password, role_str=role)
        if not user:
            return jsonify({"detail": "User not found"}), 404
        return jsonify({"id": user.id, "username": user.username, "role": user.role.value})

@bp.route("/users/<int:user_id>", methods=["DELETE"])
@token_required
@role_required("super_admin")
def delete_user(current_user, user_id):
    with get_db() as db:
        success = crud.delete_user(db=db, user_id=user_id)
        if not success:
            return jsonify({"detail": "User not found"}), 404
        return jsonify({"detail": "User deleted successfully"})

@bp.route("/users/import/template", methods=["GET"])
@token_required
@role_required("super_admin")
def download_user_template(current_user):
    df = pd.DataFrame(columns=["Username", "Role"])
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name="user_import_template.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@bp.route("/users/import", methods=["POST"])
@token_required
@role_required("super_admin")
def import_users(current_user):
    file = request.files.get("file")
    if not file:
        return jsonify({"detail": "No file provided"}), 400

    try:
        df = pd.read_excel(file)
    except Exception as e:
        return jsonify({"detail": f"Failed to read Excel file: {str(e)}"}), 400

    success_count = 0
    errors = []

    with get_db() as db:
        for index, row in df.iterrows():
            try:
                username = str(row.get("Username", "")).strip()
                role_str = str(row.get("Role", "")).strip().lower()
                
                if not username or username.lower() == 'nan':
                    errors.append(f"Row {index + 2}: Missing Username")
                    continue
                
                if role_str not in ['admin', 'viewer']:
                    role_str = 'viewer' # Default to viewer if invalid
                    
                db_user = crud.get_user_by_username(db, username=username)
                if db_user:
                    errors.append(f"Row {index + 2}: Username '{username}' already exists")
                    continue
                    
                crud.create_user(db=db, username=username, password="Kolkata@123", role_str=role_str)
                success_count += 1
            except Exception as e:
                errors.append(f"Row {index + 2}: Error processing user - {str(e)}")
                
    return jsonify({"success_count": success_count, "errors": errors})
