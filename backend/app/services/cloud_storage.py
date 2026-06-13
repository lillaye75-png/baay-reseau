import os
import cloudinary
import cloudinary.uploader
from typing import Optional

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.getenv("CLOUDINARY_API_KEY", ""),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", ""),
    secure=True,
)


async def upload_image(
    file_bytes: bytes,
    folder: str = "baay-reseau/products",
    public_id: Optional[str] = None,
) -> dict:
    """Upload image to Cloudinary and return URL info."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        public_id=public_id,
        resource_type="image",
        transformation=[
            {"width": 800, "height": 800, "crop": "limit"},
            {"quality": "auto"},
        ],
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
    }


async def delete_image(public_id: str) -> bool:
    """Delete image from Cloudinary."""
    try:
        result = cloudinary.uploader.destroy(public_id)
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
