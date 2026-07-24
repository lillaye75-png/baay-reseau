import traceback
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from mangum import Mangum

app = FastAPI()

IMPORT_ERROR = ""

try:
    from app.main import app as real_app
    app = real_app
except Exception as e:
    IMPORT_ERROR = traceback.format_exc()

if IMPORT_ERROR:
    app = FastAPI()

    @app.get("/health")
    async def health():
        return JSONResponse({"status": "error", "detail": IMPORT_ERROR.split("\n")[-3:]})

    @app.get("/")
    async def root():
        return JSONResponse({"error": IMPORT_ERROR.split("\n")[-3:]})

handler = Mangum(app, lifespan="off")
