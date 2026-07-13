from flask import Blueprint, request, jsonify, send_file
import io
import pandas as pd
from app import crud
from app.database import get_db
from app.api.auth import token_required, role_required
from sqlalchemy.exc import IntegrityError

bp = Blueprint('projects', __name__, url_prefix='/api/projects')

@bp.route("/", methods=["GET"])
@token_required
def read_projects(current_user):
    with get_db() as db:
        projects = crud.get_projects(db)
        return jsonify([{"id": p.id, "name": p.name} for p in projects])

@bp.route("/", methods=["POST"])
@token_required
@role_required("super_admin")
def create_project(current_user):
    data = request.json
    name = data.get("name")
    if not name:
        return jsonify({"detail": "Name is required"}), 400
        
    with get_db() as db:
        try:
            project = crud.create_project(db, name=name)
            return jsonify({"id": project.id, "name": project.name}), 201
        except IntegrityError:
            db.rollback()
            return jsonify({"detail": "Project with this name already exists"}), 400

@bp.route("/<int:project_id>", methods=["PUT"])
@token_required
@role_required("super_admin")
def update_project_endpoint(current_user, project_id):
    data = request.json
    name = data.get("name")
    if not name:
        return jsonify({"detail": "Name is required"}), 400
        
    with get_db() as db:
        try:
            project = crud.update_project(db, project_id, name=name)
            if not project:
                return jsonify({"detail": "Project not found"}), 404
            return jsonify({"id": project.id, "name": project.name})
        except IntegrityError:
            db.rollback()
            return jsonify({"detail": "Project with this name already exists"}), 400

@bp.route("/<int:project_id>", methods=["DELETE"])
@token_required
@role_required("super_admin")
def delete_project_endpoint(current_user, project_id):
    with get_db() as db:
        success = crud.delete_project(db, project_id)
        if not success:
            return jsonify({"detail": "Project not found"}), 404
        return '', 204

@bp.route("/import/template", methods=["GET"])
@token_required
@role_required("super_admin")
def download_project_template(current_user):
    df = pd.DataFrame(columns=["Name"])
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name="project_import_template.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@bp.route("/import", methods=["POST"])
@token_required
@role_required("super_admin")
def import_projects(current_user):
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
                name = str(row.get("Name", "")).strip()
                
                if not name or name.lower() == 'nan':
                    errors.append(f"Row {index + 2}: Missing Name")
                    continue
                
                try:
                    crud.create_project(db=db, name=name)
                    success_count += 1
                except IntegrityError:
                    db.rollback()
                    errors.append(f"Row {index + 2}: Project '{name}' already exists")
            except Exception as e:
                errors.append(f"Row {index + 2}: Error processing project - {str(e)}")
                
    return jsonify({"success_count": success_count, "errors": errors})
