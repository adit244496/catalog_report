import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    def __init__(self):
        self.PROJECT_NAME: str = "MatCat API"
        self.SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_change_in_production")
        self.ALGORITHM: str = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES: int = 525600 # 1 year
        
        # Database
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/matcat")
        
        # Default seed accounts (created on first startup if passwords are provided)
        self.DEFAULT_SUPERADMIN_USERNAME: str = os.getenv("DEFAULT_SUPERADMIN_USERNAME", "superadmin")
        self.DEFAULT_SUPERADMIN_PASSWORD: str = os.getenv("DEFAULT_SUPERADMIN_PASSWORD", "")
        self.DEFAULT_ADMIN_USERNAME: str = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
        self.DEFAULT_ADMIN_PASSWORD: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "")

        # AWS S3 Settings
        self.AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
        self.AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
        self.AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
        self.S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "matcat-assets")

settings = Settings()
