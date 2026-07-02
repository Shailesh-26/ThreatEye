from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user
from app.services.alert_service import AlertService

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


@router.get("")
async def get_alerts(
    current_user=Depends(get_current_user)
):

    return await AlertService.get_alerts()


@router.get("/{alert_id}")
async def get_alert(
    alert_id: str,
    current_user=Depends(get_current_user)
):

    alert = await AlertService.get_alert_by_id(
        alert_id
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return alert


@router.delete("/reset")
async def reset_alerts(
    current_user=Depends(get_current_user)
):

    deleted = await AlertService.reset_alerts()

    return {
        "message": "Alerts deleted successfully",
        "deleted_count": deleted
    }