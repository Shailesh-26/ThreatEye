from fastapi import (
    APIRouter,
    Depends
)

from app.core.dependencies import (
    get_current_user
)

from app.services.detection_service import (
    DetectionService
)

router = APIRouter(
    prefix="/detections",
    tags=["Detections"]
)


@router.post("/brute-force")
async def brute_force_detection(
    current_user=Depends(
        get_current_user
    )
):

    alerts = (
        await DetectionService
        .run_brute_force_detection()
    )

    return {
        "alerts_found":
            len(alerts),

        "alerts":
            alerts
    }