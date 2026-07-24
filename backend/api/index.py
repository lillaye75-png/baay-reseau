import asyncio
import time as _time
from mangum import Mangum
from app.main import app
from app.core.config import settings

if settings.IS_VERCEL:
    from app.main import init_db
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_until_complete(init_db())

handler = Mangum(app, lifespan="off")
