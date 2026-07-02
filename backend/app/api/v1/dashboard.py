from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.services.dashboard_service import DashboardService

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("")
async def get_dashboard(
    current_user=Depends(get_current_user)
):

    return await DashboardService.get_dashboard_stats()