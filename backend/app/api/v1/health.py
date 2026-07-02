from fastapi import APIRouter

from app.database.mongodb import mongodb

router = APIRouter()


@router.get("/health")
async def health_check():
    try:
        await mongodb.database.command("ping")

        db_status = "connected"

    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy",
        "service": "ThreatEye Backend",
        "database": db_status
    }