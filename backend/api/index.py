from mangum import Mangum
import traceback

err_msg = ""

try:
    from app.main import app
except Exception:
    err_msg = traceback.format_exc()

if err_msg:
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse
    app = FastAPI()
    @app.get("/")
    @app.get("/health")
    async def show_error():
        return HTMLResponse(f"<pre>{err_msg}</pre>")

handler = Mangum(app, lifespan="off")
