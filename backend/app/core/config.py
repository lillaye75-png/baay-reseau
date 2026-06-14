from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Baay Réseau"
    DATABASE_URL: str = "postgresql+asyncpg://baay:baay_secret@localhost:5432/baay_reseau"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    WHATSAPP_API_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "baay-reseau-verify"

    WAVE_API_KEY: str = ""
    ORANGE_MONEY_API_KEY: str = ""

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    CORS_ORIGINS: str = "*"

    class Config:
        env_file = "../.env"


settings = Settings()


def get_cors_origins() -> list[str]:
    raw = settings.CORS_ORIGINS
    if raw == "*":
        return ["*"]
    import json
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass
    return [origin.strip() for origin in raw.split(",") if origin.strip()]
