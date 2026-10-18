from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.logs import router as logs_router
from app.api.v1.detections import router as detections_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.detections import router as detection_router
from fastapi.middleware.cors import CORSMiddleware

from app.database.mongodb import (
    connect_to_mongo,
    close_mongo_connection
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="ThreatEye",
    description="Cyber Threat Hunting Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180", "http://localhost:5181", "http://localhost:5182", "http://localhost:5183", "http://localhost:5184", "http://localhost:5185", "http://localhost:5186", "http://localhost:5187", "http://localhost:5188", "http://localhost:5189", "http://localhost:5190"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    health_router,
    prefix="/api/v1"
)

app.include_router(
    auth_router,
    prefix="/api/v1"
)


@app.get("/")
async def root():
    return {
        "message": "Welcome to ThreatEye"
    }

app.include_router(
    logs_router,
    prefix="/api/v1"
)

app.include_router(
    detections_router,
    prefix="/api/v1"
)

app.include_router(
    alerts_router,
    prefix="/api/v1"
)

app.include_router(
    dashboard_router,
    prefix="/api/v1"
)

app.include_router(
    detection_router,
    prefix="/api/v1"
)