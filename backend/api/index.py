from mangum import Mangum

try:
    from app.main import app
except Exception as e:
    import traceback
    err = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI()
    @app.get("/health")
    async def health():
        return JSONResponse({"error": str(e), "trace": err}, status_code=500)
    @app.get("/")
    async def root():
        return JSONResponse({"error": str(e), "trace": err}, status_code=500)

handler = Mangum(app, lifespan="off")
