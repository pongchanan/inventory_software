"""Copy a Railway S3 bucket to another bucket without storing credentials.

All credentials are provided through environment variables by the caller. Run
without --apply first to inspect the source and destination object counts.
"""

from __future__ import annotations

import argparse
import os

import boto3
from botocore.config import Config


def client(prefix: str):
    return boto3.client(
        "s3",
        endpoint_url=os.environ[f"{prefix}_ENDPOINT_URL"],
        aws_access_key_id=os.environ[f"{prefix}_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ[f"{prefix}_SECRET_ACCESS_KEY"],
        region_name=os.environ.get(f"{prefix}_REGION", "auto"),
        config=Config(signature_version="s3v4"),
    )


def keys(s3, bucket: str) -> list[str]:
    paginator = s3.get_paginator("list_objects_v2")
    return [obj["Key"] for page in paginator.paginate(Bucket=bucket) for obj in page.get("Contents", [])]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="perform the copy")
    args = parser.parse_args()

    source_bucket = os.environ["SOURCE_BUCKET"]
    destination_bucket = os.environ["DESTINATION_BUCKET"]
    source = client("SOURCE")
    destination = client("DESTINATION")
    source_keys = keys(source, source_bucket)
    destination_keys = keys(destination, destination_bucket)
    print(f"Source objects: {len(source_keys)}")
    print(f"Destination objects: {len(destination_keys)}")

    if not args.apply:
        return
    if destination_keys:
        raise SystemExit("Destination bucket is not empty; refuse to overwrite it")

    for index, key in enumerate(source_keys, start=1):
        response = source.get_object(Bucket=source_bucket, Key=key)
        extra = {name: response[name] for name in ("ContentType", "CacheControl", "ContentDisposition") if response.get(name)}
        try:
            destination.put_object(Bucket=destination_bucket, Key=key, Body=response["Body"].read(), **extra)
        finally:
            response["Body"].close()
        print(f"Copied {index}/{len(source_keys)}")

    copied_keys = keys(destination, destination_bucket)
    if len(copied_keys) != len(source_keys):
        raise SystemExit(f"Copy incomplete: source={len(source_keys)} destination={len(copied_keys)}")
    print("Bucket copy verified")


if __name__ == "__main__":
    main()
