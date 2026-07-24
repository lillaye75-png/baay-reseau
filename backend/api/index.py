import traceback
from mangum import Mangum

err_msg = ""

try:
    from app.main import app
except Exception:
    err_msg = traceback.format_exc()

if err_msg:
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse
    app = FastAPI()

    @app.get("/{path:path}")
    async def show_error(path: str):
        return HTMLResponse(f"<h2>Import Error</h2><pre>{err_msg}</pre>")


@app.on_event("startup")
async def startup():
    pass

handler = Mangum(app, lifespan="off")
