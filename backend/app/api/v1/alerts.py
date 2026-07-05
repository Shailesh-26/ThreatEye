from fastapi import APIRouter
from app.services.alert_service import AlertService

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


@router.get("/")
async def get_alerts():
    return await AlertService.get_alerts()