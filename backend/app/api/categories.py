from flask import Blueprint, request, jsonify
from app import crud
from app.database import get_db
from app.api.auth import token_required, role_required

bp = Blueprint('categories', __name__, url_prefix='/api/categories')

@bp.route("/", methods=["GET"])
@token_required
def read_categories(current_user):
    with get_db() as db:
        categories = crud.get_categories_with_count(db)
        return jsonify(categories)

@bp.route("/", methods=["POST"])
@token_required
@role_required("super_admin", "admin")
def create_category(current_user):
    data = request.json
    name = data.get("name")
    slug = data.get("slug")
    p1 = data.get("param1_name")
    p2 = data.get("param2_name")
    p3 = data.get("param3_name")
    p4 = data.get("param4_name")
    p5 = data.get("param5_name")
    
    with get_db() as db:
        category = crud.create_category(db=db, name=name, slug=slug, p1=p1, p2=p2, p3=p3, p4=p4, p5=p5)
        return jsonify({
            "id": category.id, 
            "name": category.name, 
            "slug": category.slug,
            "param1_name": category.param1_name,
            "param2_name": category.param2_name,
            "param3_name": category.param3_name,
            "param4_name": category.param4_name,
            "param5_name": category.param5_name
        }), 201

@bp.route("/<int:category_id>", methods=["PUT"])
@token_required
@role_required("super_admin", "admin")
def update_category_endpoint(current_user, category_id):
    data = request.json
    with get_db() as db:
        category = crud.update_category(db=db, category_id=category_id, category_data=data)
        if not category:
            return jsonify({"detail": "Category not found"}), 404
        return jsonify({
            "id": category.id, 
            "name": category.name, 
            "slug": category.slug,
            "param1_name": category.param1_name,
            "param2_name": category.param2_name,
            "param3_name": category.param3_name,
            "param4_name": category.param4_name,
            "param5_name": category.param5_name
        }), 200
