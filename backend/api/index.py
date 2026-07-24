from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"status": "ok"}

handler = Mangum(app, lifespan="off")
