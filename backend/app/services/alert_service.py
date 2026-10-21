from app.database.mongodb import mongodb
from app.detection.detection_engine import DetectionEngine


def number_alerts(alerts: list[dict]) -> list[dict]:
    """
    Sort alerts most-dangerous first and give them display IDs THREAT-001, ...

    The dashboard and the alerts page both use this, so the same alert has
    the same ID everywhere. IDs are positions in this list, not permanent
    records - saving alerts is a later step.
    """
    ordered = sorted(alerts, key=lambda alert: alert["risk_score"], reverse=True)
    return [
        {"id": f"THREAT-{index:03}", "status": "Active", **alert}
        for index, alert in enumerate(ordered, start=1)
    ]


class AlertService:
    """Alerts are computed: every request re-runs the detectors on the logs loaded now."""

    @staticmethod
    async def get_alerts():
        logs = await mongodb.database.logs.find({}, {"_id": 0}).to_list(None)
        return number_alerts(DetectionEngine.run(logs))
