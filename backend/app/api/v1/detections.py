from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user
from app.database.mongodb import mongodb
from app.detection.detector_registry import DETECTOR_MAP, list_rules

# dependencies=[...] makes every route in this file require a valid login token.
router = APIRouter(
    prefix="/detections",
    tags=["Detections"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/rules")
async def get_detection_rules():
    return list_rules()


@router.post("/run/{detector_id}")
async def run_detector(detector_id: str):
    detector = DETECTOR_MAP.get(detector_id)

    if detector is None:
        raise HTTPException(status_code=404, detail="Detector not found.")

    # _id is MongoDB's internal ObjectId; it can't be turned into JSON, so skip it.
    logs = await mongodb.database.logs.find({}, {"_id": 0}).to_list(length=None)

    alerts = detector.detect(logs)

    return {
        "rule": detector_id,
        "alerts": len(alerts),
        "results": alerts,
    }
