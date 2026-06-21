import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
import os

from app.core.config import settings
from app.core.logging import logger
from app.core.rate_limit import RateLimitMiddleware
from app.api.v1.router import api_router
from app.core.database import engine, Base

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

app = FastAPI(
    title="Naatal ERP Cloud API",
    description="SaaS ERP & POS for Boutique and Tech Retailers in Senegal",
    version="1.0.0",
)

try:
    from app.core.sentry import init_sentry
    init_sentry(app)
except Exception:
    pass


class CorsAlwaysMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "*")
        if request.method == "OPTIONS":
            from fastapi.responses import Response
            return Response(status_code=204, headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Max-Age": "600",
            })
        try:
            response = await call_next(request)
        except Exception:
            from fastapi.responses import JSONResponse
            response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response


app.add_middleware(CorsAlwaysMiddleware)

app.add_middleware(RateLimitMiddleware)


app.include_router(api_router, prefix="/api/v1")

from app.api.v1.endpoints.websocket import router as ws_router
app.include_router(ws_router, tags=["websocket"])

if os.path.exists(UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000)
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)"
    )
    return response


@app.on_event("startup")
async def on_startup():
    logger.info("Naatal ERP Cloud API starting up...")

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables ensured")
    except Exception as e:
        logger.error(f"Database error: {e}")

    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            for col in ["whatsapp_api_token", "whatsapp_phone_number_id", "wave_api_key", "orange_money_api_key"]:
                try:
                    await conn.execute(text(f"ALTER TABLE tenants ADD COLUMN IF NOT EXISTS {col} VARCHAR(500)"))
                except Exception:
                    pass
            try:
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS wizard_completed BOOLEAN DEFAULT FALSE"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE sale_items ALTER COLUMN product_id DROP NOT NULL"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS parent_id VARCHAR(36)"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address VARCHAR(500)"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description TEXT"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0"))
            except Exception:
                pass
            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id VARCHAR(36) PRIMARY KEY,
                        tenant_id VARCHAR(36) NOT NULL,
                        user_id VARCHAR(36) NOT NULL,
                        user_name VARCHAR(255) DEFAULT '',
                        action VARCHAR(100) NOT NULL,
                        entity_type VARCHAR(50) NOT NULL,
                        entity_id VARCHAR(36),
                        details TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE tenants ALTER COLUMN phone TYPE VARCHAR(255) USING phone::VARCHAR(255)"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(255) USING phone::VARCHAR(255)"))
            except Exception:
                pass
            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS push_subscriptions (
                        id VARCHAR(36) PRIMARY KEY,
                        tenant_id VARCHAR(36) NOT NULL,
                        user_id VARCHAR(36) NOT NULL,
                        endpoint TEXT NOT NULL,
                        p256dh TEXT NOT NULL,
                        auth TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_push_subscriptions_tenant ON push_subscriptions(tenant_id)"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(50)"))
                await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE"))
                await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE"))
                await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255)"))
                await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(50)"))
            except Exception:
                pass
            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
                        id VARCHAR(36) PRIMARY KEY,
                        tenant_id VARCHAR(36) NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        message TEXT NOT NULL,
                        recipient_count INTEGER DEFAULT 0,
                        sent_count INTEGER DEFAULT 0,
                        failed_count INTEGER DEFAULT 0,
                        status VARCHAR(30) DEFAULT 'draft',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
            except Exception:
                pass
            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_stores (
                        id VARCHAR(36) PRIMARY KEY,
                        user_id VARCHAR(36) NOT NULL,
                        tenant_id VARCHAR(36) NOT NULL,
                        is_default BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, tenant_id)
                    )
                """))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS print_logo_url VARCHAR(500)"))
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS print_header_text VARCHAR(500)"))
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS print_footer_text VARCHAR(500)"))
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS print_show_barcode BOOLEAN DEFAULT TRUE"))
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS print_show_qr BOOLEAN DEFAULT FALSE"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE sales ADD COLUMN IF NOT EXISTS store_id VARCHAR(36)"))
                await conn.execute(text("ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id VARCHAR(36)"))
            except Exception:
                pass
        logger.info("Tenant columns ensured")
    except Exception as e:
        logger.error(f"Column migration error: {e}")

    try:
        from app.services.scheduled_tasks import start_scheduler
        start_scheduler()
        logger.info("Scheduler started")
    except Exception as e:
        logger.error(f"Scheduler error: {e}")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "naatal-erp-cloud"}
