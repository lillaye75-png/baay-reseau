import os
import asyncio
import functools
import cloudinary
import cloudinary.uploader
from typing import Optional
from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def _sync_upload(file_bytes, folder, public_id):
    return cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        public_id=public_id,
        resource_type="image",
        transformation=[
            {"width": 800, "height": 800, "crop": "limit"},
            {"quality": "auto"},
        ],
    )


def _sync_destroy(public_id):
    return cloudinary.uploader.destroy(public_id)


async def upload_image(
    file_bytes: bytes,
    folder: str = "baay-reseau/products",
    public_id: Optional[str] = None,
) -> dict:
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, functools.partial(_sync_upload, file_bytes, folder, public_id)
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
    }


async def delete_image(public_id: str) -> bool:
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, functools.partial(_sync_destroy, public_id)
        )
        return result.get("result") == "ok"
    except Exception:
        return False


def get_public_id_from_url(url: str) -> Optional[str]:
    """Extract public_id from Cloudinary URL."""
    if "cloudinary.com" not in url:
        return None
    parts = url.split("/")
    try:
        upload_index = parts.index("upload")
        public_id_parts = parts[upload_index + 2:]
        return "/".join(public_id_parts).rsplit(".", 1)[0]
    except (ValueError, IndexError):
        return None
