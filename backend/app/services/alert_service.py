from app.database.mongodb import mongodb
from app.detection.detection_engine import DetectionEngine


class AlertService:
    """
    Alerts are currently *computed*: every request re-runs the detectors on
    the logs that are loaded right now. IDs like THREAT-001 are positions in
    this list, not permanent records (saving alerts is a later step).
    """

    @staticmethod
    async def get_alerts():
        logs = await mongodb.database.logs.find({}, {"_id": 0}).to_list(None)

        alerts = DetectionEngine.run(logs)

        # Most dangerous first.
        alerts.sort(key=lambda alert: alert["risk_score"], reverse=True)

        return [
            {"id": f"THREAT-{index:03}", "status": "Active", **alert}
            for index, alert in enumerate(alerts, start=1)
        ]
