from flask import Blueprint, request, jsonify, send_file
import io
import json
import pandas as pd
from app import crud
from app.database import get_db
from app.api.auth import token_required, role_required
from app.core.aws import upload_file_to_s3

# Using a mock class for UploadFile to bridge the AWS utility
class MockUploadFile:
    def __init__(self, filename, file_obj, content_type):
        self.filename = filename
        self.file = file_obj
        self.content_type = content_type

bp = Blueprint('materials', __name__, url_prefix='/api/materials')

def serialize_material(mat):
    return {
        "id": mat.id,
        "name": mat.name,
        "category_id": mat.category_id,
        "used_in": mat.used_in,
        "created_at": mat.created_at.isoformat() if mat.created_at else None,
        "origin": mat.origin,
        "company_url": mat.company_url,
        "description": mat.description,
        "image_url": mat.image_url,
        "pdf_url": mat.pdf_url,
        "lead_time": mat.lead_time,
        "param1_value": mat.param1_value,
        "param2_value": mat.param2_value,
        "param3_value": mat.param3_value,
        "param4_value": mat.param4_value,
        "param5_value": mat.param5_value,
        "tags": [{"id": t.id, "tag_name": t.tag_name} for t in mat.tags]
    }

@bp.route("/", methods=["GET"])
@token_required
def read_materials(current_user):
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 100, type=int)
    category_id = request.args.get("category_id", type=int)
    
    company = request.args.get("company")
    used_in = request.args.get("used_in")
    material_type = request.args.get("material_type")
    
    with get_db() as db:
        materials = crud.get_materials(db, skip=skip, limit=limit, category_id=category_id, company=company, used_in=used_in, material_type=material_type)
        return jsonify([serialize_material(mat) for mat in materials])

@bp.route("/<int:material_id>", methods=["GET"])
@token_required
def read_material(current_user, material_id):
    with get_db() as db:
        mat = crud.get_material(db, material_id=material_id)
        if not mat:
            return jsonify({"detail": "Material not found"}), 404
            
        return jsonify(serialize_material(mat))

@bp.route("/", methods=["POST"])
@token_required
@role_required("super_admin", "admin")
def create_material(current_user):
    # Support both JSON and Form Data (for file uploads)
    if request.is_json:
        data = request.json
        file = None
        pdf_file = None
    else:
        # It's form data
        data = request.form.to_dict()
        files = request.files.getlist("files")
        pdf_file = request.files.get("pdf_file")
        
        # Convert types since form data is always strings
        if "category_id" in data:
            data["category_id"] = int(data["category_id"])
            
        # Parse tags
        tags_raw = data.get("tags")
        if tags_raw:
            try:
                data["tags"] = json.loads(tags_raw)
            except json.JSONDecodeError:
                data["tags"] = [t.strip() for t in tags_raw.split(",") if t.strip()]

    with get_db() as db:
        mat = crud.create_material(db=db, material_data=data)
        
        updated = False
        
        image_urls = []
        for file in files:
            mock_file = MockUploadFile(file.filename, file.stream, file.mimetype)
            image_url = upload_file_to_s3(mock_file)
            if image_url:
                image_urls.append(image_url)
                
        if image_urls:
            mat.image_url = ",".join(image_urls)
            updated = True
                
        if pdf_file:
            mock_pdf = MockUploadFile(pdf_file.filename, pdf_file.stream, pdf_file.mimetype)
            pdf_url = upload_file_to_s3(mock_pdf)
            if pdf_url:
                mat.pdf_url = pdf_url
                updated = True
                
        if updated:
            db.commit()
            db.refresh(mat)
                
        return jsonify({
            "id": mat.id,
            "name": mat.name,
            "category_id": mat.category_id,
            "image_url": mat.image_url,
            "pdf_url": mat.pdf_url
        }), 201

@bp.route("/<int:material_id>", methods=["PUT"])
@token_required
@role_required("super_admin", "admin")
def update_material_endpoint(current_user, material_id):
    if request.is_json:
        data = request.json
        files = []
    else:
        data = request.form.to_dict()
        files = request.files.getlist("files")
        
        if "category_id" in data:
            data["category_id"] = int(data["category_id"])
            
        tags_raw = data.get("tags")
        if tags_raw is not None:
            try:
                data["tags"] = json.loads(tags_raw)
            except json.JSONDecodeError:
                data["tags"] = [t.strip() for t in tags_raw.split(",") if t.strip()]

    with get_db() as db:
        mat = crud.update_material(db=db, material_id=material_id, material_data=data)
        if not mat:
            return jsonify({"detail": "Material not found"}), 404
            
        updated = False
        image_urls = []
        for file in files:
            mock_file = MockUploadFile(file.filename, file.stream, file.mimetype)
            image_url = upload_file_to_s3(mock_file)
            if image_url:
                image_urls.append(image_url)
                
        if image_urls:
            mat.image_url = ",".join(image_urls)
            updated = True
            
        if updated:
            db.commit()
            db.refresh(mat)
            
        return jsonify(serialize_material(mat))

@bp.route("/<int:material_id>", methods=["DELETE"])
@token_required
@role_required("super_admin")
def delete_material_endpoint(current_user, material_id):
    with get_db() as db:
        mat = crud.get_material(db, material_id=material_id)
        if not mat:
            return jsonify({"detail": "Material not found"}), 404
            
        success = crud.delete_material(db, material_id=material_id)
        if not success:
            return jsonify({"detail": "Failed to delete material"}), 400
            
        return '', 204

@bp.route("/<int:material_id>/pdf", methods=["PUT"])
@token_required
@role_required("super_admin", "admin")
def upload_material_pdf(current_user, material_id):
    pdf_file = request.files.get("pdf_file")
    if not pdf_file:
        return jsonify({"detail": "No pdf_file provided"}), 400

    with get_db() as db:
        mat = crud.get_material(db, material_id=material_id)
        if not mat:
            return jsonify({"detail": "Material not found"}), 404
            
        mock_pdf = MockUploadFile(pdf_file.filename, pdf_file.stream, pdf_file.mimetype)
        pdf_url = upload_file_to_s3(mock_pdf)
        
        if not pdf_url:
            return jsonify({"detail": "Failed to upload PDF"}), 500
            
        mat.pdf_url = pdf_url
        db.commit()
        db.refresh(mat)
        
        return jsonify(serialize_material(mat)), 200

@bp.route("/import/template", methods=["GET"])
@token_required
@role_required("super_admin", "admin")
def download_material_template(current_user):
    headers = ["Name", "Category", "Used In", "Origin", "Company URL", "Description", "Tags", "Parameter 1", "Parameter 2", "Parameter 3", "Parameter 4", "Parameter 5"]
    df = pd.DataFrame(columns=headers)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name="brand_import_template.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@bp.route("/import", methods=["POST"])
@token_required
@role_required("super_admin", "admin")
def import_materials(current_user):
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
        categories = {c.name.lower(): c.id for c in crud.get_categories(db)}
        
        for index, row in df.iterrows():
            try:
                name = str(row.get("Name", "")).strip()
                cat_name = str(row.get("Category", "")).strip()
                
                if not name or name.lower() == 'nan':
                    errors.append(f"Row {index + 2}: Missing Name")
                    continue
                if not cat_name or cat_name.lower() == 'nan':
                    errors.append(f"Row {index + 2}: Missing Category")
                    continue
                    
                cat_id = categories.get(cat_name.lower())
                if not cat_id:
                    errors.append(f"Row {index + 2}: Category '{cat_name}' not found")
                    continue
                
                tags_str = str(row.get("Tags", ""))
                tags = [t.strip() for t in tags_str.split(",")] if tags_str and tags_str.lower() != 'nan' else []
                
                def get_val(col):
                    v = str(row.get(col, ""))
                    return v.strip() if v and v.lower() != 'nan' else None

                material_data = {
                    "name": name,
                    "category_id": cat_id,
                    "used_in": get_val("Used In"),
                    "origin": get_val("Origin"),
                    "company_url": get_val("Company URL"),
                    "description": get_val("Description"),
                    "tags": tags,
                    "param1_value": get_val("Parameter 1"),
                    "param2_value": get_val("Parameter 2"),
                    "param3_value": get_val("Parameter 3"),
                    "param4_value": get_val("Parameter 4"),
                    "param5_value": get_val("Parameter 5"),
                }
                
                crud.create_material(db=db, material_data=material_data)
                success_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                
    return jsonify({
        "success_count": success_count,
        "errors": errors
    }), 200
