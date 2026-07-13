import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Enum, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    viewer = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.viewer, nullable=False)
    is_first_login = Column(Boolean, default=True, nullable=False)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    
    param1_name = Column(String, nullable=True)
    param2_name = Column(String, nullable=True)
    param3_name = Column(String, nullable=True)
    param4_name = Column(String, nullable=True)
    param5_name = Column(String, nullable=True)

    materials = relationship("Material", back_populates="category")

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    used_in = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    origin = Column(String, nullable=True)
    company_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    pdf_url = Column(String, nullable=True)
    is_sourced = Column(Boolean, default=False)
    
    lead_time = Column(String, nullable=True)
    param1_value = Column(String, nullable=True)
    param2_value = Column(String, nullable=True)
    param3_value = Column(String, nullable=True)
    param4_value = Column(String, nullable=True)
    param5_value = Column(String, nullable=True)

    category = relationship("Category", back_populates="materials")
    tags = relationship("MaterialTag", back_populates="material", cascade="all, delete-orphan")

class MaterialTag(Base):
    __tablename__ = "material_tags"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    tag_name = Column(String, index=True, nullable=False)

    material = relationship("Material", back_populates="tags")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
