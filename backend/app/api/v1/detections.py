from fastapi import APIRouter, HTTPException

from app.detection.detector_registry import DETECTORS
from app.database.mongodb import mongodb
from app.detection.brute_force import BruteForceDetector
from app.detection.port_scan import PortScanDetector
from app.detection.sql_injection import SQLInjectionDetector
from app.detection.xss import XSSDetector
router = APIRouter(prefix="/detections", tags=["Detections"])


@router.get("/rules")
async def get_detection_rules():
    return DETECTORS


@router.post("/run/{detector_id}")
async def run_detector(detector_id: str):

    logs = await mongodb.database.logs.find().to_list(length=None)

    detector_map = {
        "brute_force": BruteForceDetector,
        "port_scan": PortScanDetector,
        "sql_injection": SQLInjectionDetector,
        "xss": XSSDetector,
    }

    detector = detector_map.get(detector_id)

    if detector is None:
        raise HTTPException(
            status_code=404,
            detail="Detector not found."
        )

    alerts = detector.detect(logs)

    return {
        "rule": detector_id,
        "alerts": len(alerts),
        "results": alerts,
    }