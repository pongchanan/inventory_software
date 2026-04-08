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


def upload_item_image(data: bytes, item_id: int, content_type: str = "image/jpeg") -> str:
    """Upload an item cover image to S3 and return the S3 object key.

    The key is stored in ``Item.image_path`` and later resolved to a presigned
    URL when serving the item list.

    Args:
        data: Raw image bytes (JPEG or whatever the browser sent).
        item_id: The numeric item ID (used to namespace the S3 key).
        content_type: MIME type of the uploaded file.

    Returns:
        The bare S3 object key (e.g. ``items/42/a1b2c3d4.jpg``).
    """
    client = _get_client()
    bucket = _get_bucket()
    ext = "jpg" if "jpeg" in content_type or "jpg" in content_type else content_type.split("/")[-1]
    key = f"items/{item_id}/{uuid.uuid4().hex[:8]}.{ext}"

    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
    )

    print(f"[s3] Uploaded item image {len(data)} bytes → {key}")
    return key


def _normalize_key(key: str) -> str:
    """Strip s3://bucket/ prefix if present, returning a bare object key."""
    if key.startswith("s3://"):
        # s3://bucket-name/path/to/object → path/to/object
        without_scheme = key[len("s3://") :]
        # drop the bucket name segment
        slash = without_scheme.find("/")
        if slash != -1:
            return without_scheme[slash + 1 :]
    return key


def get_presigned_url(key: str, expires_in: int = 1800) -> str:
    """Generate a presigned URL for an S3 object.

    Args:
        key: The S3 object key (bare key or full s3://bucket/key URI).
        expires_in: URL validity in seconds (default 30 min).

    Returns:
        A temporary signed URL.
    """
    client = _get_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": _get_bucket(), "Key": _normalize_key(key)},
        ExpiresIn=expires_in,
    )


def download_image(key: str) -> bytes:
    """Download an S3 object and return its raw bytes.

    Args:
        key: The S3 object key.

    Returns:
        Raw bytes of the object.
    """
    client = _get_client()
    response = client.get_object(Bucket=_get_bucket(), Key=key)
    return response["Body"].read()
