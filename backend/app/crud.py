from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app import models
from app.core.security import get_password_hash

# Users
def get_user_by_username(db: Session, username: str):
    if not username:
        return None
    username = username.strip()
    return db.query(models.User).filter(func.lower(models.User.username) == func.lower(username)).first()

def get_users(db: Session):
    return db.query(models.User).all()

def create_user(db: Session, username: str, password: str, role_str: str):
    hashed_password = get_password_hash(password)
    role = models.RoleEnum.viewer
    if role_str == 'admin':
        role = models.RoleEnum.admin
    elif role_str == 'super_admin':
        role = models.RoleEnum.super_admin
        
    db_user = models.User(username=username, hashed_password=hashed_password, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, username: str, password: str, role_str: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    if username:
        db_user.username = username
        
    if role_str:
        role = models.RoleEnum.viewer
        if role_str == 'admin':
            role = models.RoleEnum.admin
        elif role_str == 'super_admin':
            role = models.RoleEnum.super_admin
        db_user.role = role
        
    if password:
        db_user.hashed_password = get_password_hash(password)
        
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

# Categories
def reset_user_password(db: Session, user_id: int, new_password: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.hashed_password = get_password_hash(new_password)
        db_user.is_first_login = False
        db.commit()
        db.refresh(db_user)
        return db_user
    return None

def get_categories(db: Session):
    return db.query(models.Category).all()

def get_categories_with_count(db: Session):
    results = db.query(
        models.Category,
        func.count(models.Material.id).label("item_count")
    ).outerjoin(models.Material, models.Category.id == models.Material.category_id)\
    .group_by(models.Category.id).all()
    
    return [
        {
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "param1_name": cat.param1_name,
            "param2_name": cat.param2_name,
            "param3_name": cat.param3_name,
            "param4_name": cat.param4_name,
            "param5_name": cat.param5_name,
            "item_count": count
        } for cat, count in results
    ]

def create_category(db: Session, name: str, slug: str, p1: str=None, p2: str=None, p3: str=None, p4: str=None, p5: str=None):
    db_category = models.Category(
        name=name, 
        slug=slug,
        param1_name=p1,
        param2_name=p2,
        param3_name=p3,
        param4_name=p4,
        param5_name=p5
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category_data: dict):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        return None
    for key, value in category_data.items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category

# Materials
def get_materials(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    category_id: int = None,
    company: str = None,
    used_in: str = None,
    material_type: str = None
):
    query = db.query(models.Material)
    
    if category_id is not None:
        query = query.filter(models.Material.category_id == category_id)
    
    if company:
        query = query.filter(models.Material.name.ilike(f"%{company}%"))
        
    if used_in:
        query = query.filter(models.Material.used_in.ilike(f"%{used_in}%"))
        
    if material_type:
        query = query.join(models.Category).filter(
            models.Category.slug.ilike(f"%{material_type}%")
        )

    return query.order_by(models.Material.created_at.desc()).offset(skip).limit(limit).all()

def get_material(db: Session, material_id: int):
    return db.query(models.Material).filter(models.Material.id == material_id).first()

def create_material(db: Session, material_data: dict):
    # Extract tags before creating the model
    tags = material_data.pop("tags", [])
    
    # Remove details_url if it's there
    if "details_url" in material_data:
        del material_data["details_url"]
        
    db_material = models.Material(**material_data)
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    
    # Add tags
    for tag_name in tags:
        db_tag = models.MaterialTag(material_id=db_material.id, tag_name=tag_name)
        db.add(db_tag)
    
    db.commit()
    db.refresh(db_material)
    return db_material

def update_material(db: Session, material_id: int, material_data: dict):
    db_material = get_material(db, material_id)
    if not db_material:
        return None
        
    tags = material_data.pop("tags", None)
    
    for key, value in material_data.items():
        setattr(db_material, key, value)
        
    if tags is not None:
        db.query(models.MaterialTag).filter(models.MaterialTag.material_id == material_id).delete()
        for tag_name in tags:
            db_tag = models.MaterialTag(material_id=material_id, tag_name=tag_name)
            db.add(db_tag)
            
    db.commit()
    db.refresh(db_material)
    return db_material

def update_material_image(db: Session, material_id: int, image_url: str):
    db_material = get_material(db, material_id)
    if db_material:
        db_material.image_url = image_url
        db.commit()
        db.refresh(db_material)
    return db_material

def delete_material(db: Session, material_id: int):
    db_material = get_material(db, material_id)
    if db_material:
        db.delete(db_material)
        db.commit()
        return True
    return False

# Projects
def get_projects(db: Session):
    return db.query(models.Project).order_by(models.Project.name.asc()).all()

def create_project(db: Session, name: str):
    db_project = models.Project(name=name)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: int, name: str):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        return None
    db_project.name = name
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        db.delete(db_project)
        db.commit()
        return True
    return False
