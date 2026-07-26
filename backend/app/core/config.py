from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    APP_NAME: str = "Naatal ERP Cloud"
    DATABASE_URL: str = "postgresql+asyncpg://baay:baay_secret@localhost:5432/baay_reseau"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    WHATSAPP_API_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "baay-reseau-verify"

    WAVE_API_KEY: str = ""
    ORANGE_MONEY_API_KEY: str = ""

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://baay-reseau.vercel.app"]

    IS_VERCEL: bool = False

    CRON_SECRET: str = ""

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FCM_SERVER_KEY: str = ""
    FCM_PROJECT_ID: str = ""

    SUPER_ADMIN_PHONES: str = "776621410,708372127"
    DEFAULT_ADMIN_PASSWORD: str = "admin123"
    CONTACT_PHONE: str = "776621410"
    CONTACT_WHATSAPP: str = "708372127"
    SEED_PHONE: str = "771234567"
    DEFAULT_TENANT_NAME: str = "My Shop"


settings = Settings()

# Convenience: parse comma-separated SUPER_ADMIN_PHONES into a list
_super_admin_phones_list = [p.strip() for p in settings.SUPER_ADMIN_PHONES.split(",") if p.strip()]

if not settings.SECRET_KEY:
    import os
    if os.environ.get("ENVIRONMENT") == "production":
        raise RuntimeError("SECRET_KEY must be set in production environment")
    settings.SECRET_KEY = os.urandom(32).hex()
    import logging
    logging.getLogger("naatal").warning(
        "SECRET_KEY not set — generated ephemeral key. Tokens will not survive restarts."
    )
