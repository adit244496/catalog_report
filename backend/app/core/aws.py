import boto3
from botocore.exceptions import NoCredentialsError
import uuid
from app.core.config import settings

def s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )

def upload_file_to_s3(file) -> str:
    # If AWS credentials are provided, upload to S3
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        s3 = s3_client()
        try:
            file_extension = file.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            
            s3.upload_fileobj(
                file.file,
                settings.S3_BUCKET_NAME,
                unique_filename,
                ExtraArgs={
                    "ContentType": file.content_type
                }
            )
            
            url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"
            return url
        except Exception as e:
            print(f"Error uploading to S3: {e}")
            return ""
            
    # Fallback to local storage
    try:
        import os
        # Define local upload directory (backend/app/static/uploads)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        upload_dir = os.path.join(base_dir, "static", "uploads")
        
        # Ensure directory exists
        os.makedirs(upload_dir, exist_ok=True)
        
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file to local disk
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
            
        # Return the local URL
        return f"/static/uploads/{unique_filename}"
    except Exception as e:
        print(f"Error saving file locally: {e}")
        return ""
