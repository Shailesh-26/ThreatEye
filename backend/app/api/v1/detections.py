from fastapi import APIRouter

router = APIRouter(prefix="/detections", tags=["Detections"])


@router.get("/rules")
async def get_detection_rules():
    return [
        {
            "name": "Brute Force",
            "status": "Enabled",
            "severity": "Critical",
            "mitre": "T1110",
            "last_run": "Just Now"
        },
        {
            "name": "Port Scan",
            "status": "Enabled",
            "severity": "Medium",
            "mitre": "T1046",
            "last_run": "Just Now"
        },
        {
            "name": "SQL Injection",
            "status": "Enabled",
            "severity": "Critical",
            "mitre": "T1190",
            "last_run": "Just Now"
        },
        {
            "name": "Cross Site Scripting",
            "status": "Coming Soon",
            "severity": "High",
            "mitre": "T1059",
            "last_run": "--"
        },
        {
            "name": "Command Injection",
            "status": "Coming Soon",
            "severity": "Critical",
            "mitre": "T1059",
            "last_run": "--"
        },
        {
            "name": "Malware",
            "status": "Coming Soon",
            "severity": "Critical",
            "mitre": "T1204",
            "last_run": "--"
        }
    ]