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
import logging
from datetime import datetime

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, NoCredentialsError, EndpointConnectionError
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


# ---- client singleton -------------------------------------------------------

_s3_client = None


def get_s3_client():
    """Return a reusable boto3 S3 client configured for Railway Storage."""
    global _s3_client
    if _s3_client is None:
        endpoint = os.environ.get("AWS_ENDPOINT_URL", "https://storage.railway.app")
        region = os.environ.get("AWS_REGION", "us-east-1")
        access_key = os.environ.get("AWS_ACCESS_KEY_ID")
        secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")

        if not access_key or not secret_key:
            logger.error(
                "S3 credentials not found. Set AWS_ACCESS_KEY_ID and "
                "AWS_SECRET_ACCESS_KEY environment variables."
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Storage service not configured (missing credentials)",
            )

        logger.info("Initializing S3 client → endpoint=%s  region=%s", endpoint, region)
        _s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
            config=Config(
                s3={"addressing_style": "path"},  # Railway needs path-style
                signature_version="s3v4",
            ),
        )
    return _s3_client


def _bucket() -> str:
    """Return the bucket name from env."""
    bucket = os.environ.get("BUCKET")
    if not bucket:
        logger.error("BUCKET environment variable is not set.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Storage service not configured (missing BUCKET)",
        )
    return bucket


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
        logger.exception("S3 put_object failed for key=%s", key)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image to storage: {e}",
        )
    except (NoCredentialsError, EndpointConnectionError) as e:
        logger.exception("S3 connection/credentials error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage service unavailable: {e}",
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
        logger.exception("Failed to generate presigned URL for key=%s", key)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate image URL: {e}",
        )
    except (NoCredentialsError, EndpointConnectionError) as e:
        logger.exception("S3 connection/credentials error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage service unavailable: {e}",
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
