"""S3-compatible storage service for uploading images.

Uses boto3 with endpoint/credentials from environment variables:
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL,
  AWS_DEFAULT_REGION, S3_BUCKET_NAME
"""

import os
import uuid

import cv2
import numpy as np

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

    return key


def upload_item_thumbnail(data: bytes, item_id: int) -> str:
    """Store a small, web-only derivative; AI sample objects are never reused."""
    image = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("The cover image could not be decoded")
    height, width = image.shape[:2]
    scale = min(1.0, 640 / max(height, width))
    if scale < 1:
        image = cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA)
    ok, encoded = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 78])
    if not ok:
        raise ValueError("The cover image could not be compressed")
    key = f"item-thumbnails/{item_id}/{uuid.uuid4().hex[:8]}.jpg"
    _get_client().put_object(Bucket=_get_bucket(), Key=key, Body=encoded.tobytes(), ContentType="image/jpeg")
    return key


def upload_vote_proposal_image(data: bytes, proposal_id: int, content_type: str = "image/jpeg") -> str:
    """Upload an optional cover image for a vote proposal."""
    client = _get_client()
    bucket = _get_bucket()
    ext = "jpg" if "jpeg" in content_type or "jpg" in content_type else content_type.split("/")[-1]
    key = f"vote-proposals/{proposal_id}/{uuid.uuid4().hex[:8]}.{ext}"

    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
    )

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


def delete_s3_object(key: str) -> None:
    """Delete an object from S3 by its key."""
    client = _get_client()
    client.delete_object(Bucket=_get_bucket(), Key=_normalize_key(key))
