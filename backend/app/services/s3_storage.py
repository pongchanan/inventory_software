"""S3-compatible storage service for uploading images.

Uses boto3 with endpoint/credentials from environment variables:
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL,
  AWS_DEFAULT_REGION, S3_BUCKET_NAME
"""

import os
import uuid

import boto3
from botocore.config import Config


def _get_client():
    return boto3.client(
        "s3",
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=os.environ.get("AWS_DEFAULT_REGION", "auto"),
        config=Config(signature_version="s3v4"),
    )


def _get_bucket() -> str:
    return os.environ.get("S3_BUCKET_NAME", "image-holster-edwzzkdjhjg")


def upload_image(data: bytes, session_id: int, content_type: str = "image/jpeg") -> str:
    """Upload image bytes to S3 and return the public URL.

    Args:
        data: Raw image bytes (JPEG).
        session_id: The session this image belongs to.
        content_type: MIME type for the upload.

    Returns:
        The public URL of the uploaded image.
    """
    client = _get_client()
    bucket = _get_bucket()
    key = f"cabinet-images/session_{session_id}_{uuid.uuid4().hex[:8]}.jpg"

    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
    )

    print(f"[s3] Uploaded {len(data)} bytes → {key}")
    return key


def get_presigned_url(key: str, expires_in: int = 1800) -> str:
    """Generate a presigned URL for an S3 object.

    Args:
        key: The S3 object key.
        expires_in: URL validity in seconds (default 30 min).

    Returns:
        A temporary signed URL.
    """
    client = _get_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": _get_bucket(), "Key": key},
        ExpiresIn=expires_in,
    )
