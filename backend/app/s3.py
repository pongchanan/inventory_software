"""
S3-compatible storage client for Railway Native Storage Buckets.

Environment variables (injected by Railway when you add a Storage Bucket):
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  AWS_ENDPOINT_URL       – e.g. https://storage.railway.app
  BUCKET                 – your bucket name
  AWS_REGION             – default us-east-1
"""

import os
from datetime import datetime

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import HTTPException, status


# ---- client singleton -------------------------------------------------------

_s3_client = None


def get_s3_client():
    """Return a reusable boto3 S3 client configured for Railway Storage."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=os.environ.get(
                "AWS_ENDPOINT_URL", "https://storage.railway.app"
            ),
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
            region_name=os.environ.get("AWS_REGION", "us-east-1"),
            config=Config(
                s3={"addressing_style": "virtual"},  # virtual-hosted style
                signature_version="s3v4",
            ),
        )
    return _s3_client


def _bucket() -> str:
    """Return the bucket name from env."""
    return os.environ["BUCKET"]


# ---- utility functions -------------------------------------------------------

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}


def upload_file_to_s3(file_bytes: bytes, uid: str, file_ext: str) -> str:
    """
    Upload image bytes to S3 and return the object key.

    Args:
        file_bytes: Raw file content.
        uid:        Item UID (used to build a unique key).
        file_ext:   File extension including the dot, e.g. ".jpg".

    Returns:
        The S3 object key, e.g. "items/ABC123_20260225_143000.jpg".

    Raises:
        HTTPException on validation or upload failure.
    """
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    key = f"items/{uid}_{timestamp}{file_ext}"

    try:
        get_s3_client().put_object(
            Bucket=_bucket(),
            Key=key,
            Body=file_bytes,
            ContentType=CONTENT_TYPES.get(file_ext, "application/octet-stream"),
        )
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image to storage: {e}",
        )

    return key


def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    """
    Generate a presigned GET URL for an object in S3.

    Args:
        key:        The S3 object key.
        expires_in: URL validity in seconds (default 1 hour).

    Returns:
        A presigned URL string.

    Raises:
        HTTPException if the URL cannot be generated.
    """
    try:
        url = get_s3_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": _bucket(), "Key": key},
            ExpiresIn=expires_in,
        )
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate image URL: {e}",
        )
    return url


def delete_file_from_s3(key: str) -> None:
    """
    Delete an object from S3.  Silently ignores missing keys.

    Args:
        key: The S3 object key to delete.
    """
    try:
        get_s3_client().delete_object(Bucket=_bucket(), Key=key)
    except ClientError:
        pass  # best-effort cleanup
