#!/usr/bin/env python3
"""Automated DB backup to local or S3."""
import os
import subprocess
import datetime
import boto3
from pathlib import Path

BACKUP_DIR = Path(__file__).parent.parent / "backups"
S3_BUCKET = os.getenv("BACKUP_S3_BUCKET", "")
S3_PREFIX = os.getenv("BACKUP_S3_PREFIX", "baay-reseau/backups")
DATABASE_URL = os.getenv("DATABASE_URL", "")


def backup_postgres():
    """Backup PostgreSQL database."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"baay_reseau_{timestamp}.sql.gz"
    filepath = BACKUP_DIR / filename

    BACKUP_DIR.mkdir(exist_ok=True)

    result = subprocess.run(
        ["pg_dump", DATABASE_URL, "--no-owner", "--no-acl"],
        capture_output=True,
    )

    if result.returncode != 0:
        print(f"pg_dump failed: {result.stderr.decode()}")
        return None

    import gzip
    with gzip.open(filepath, "wb") as f:
        f.write(result.stdout)

    print(f"Backup created: {filepath} ({filepath.stat().st_size / 1024:.1f} KB)")
    return filepath


def upload_to_s3(filepath: Path):
    """Upload backup to S3."""
    if not S3_BUCKET:
        print("No S3 bucket configured, skipping upload")
        return

    s3 = boto3.client("s3")
    key = f"{S3_PREFIX}/{filepath.name}"
    s3.upload_file(str(filepath), S3_BUCKET, key)
    print(f"Uploaded to s3://{S3_BUCKET}/{key}")


def cleanup_old_backups(keep_days: int = 30):
    """Remove local backups older than keep_days."""
    cutoff = datetime.datetime.now() - datetime.timedelta(days=keep_days)
    for f in BACKUP_DIR.glob("baay_reseau_*.sql.gz"):
        if f.stat().st_mtime < cutoff.timestamp():
            f.unlink()
            print(f"Removed old backup: {f.name}")


if __name__ == "__main__":
    filepath = backup_postgres()
    if filepath:
        upload_to_s3(filepath)
        cleanup_old_backups()
