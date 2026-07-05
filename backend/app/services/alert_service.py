from app.database.mongodb import mongodb
from app.detection.detection_engine import DetectionEngine


class AlertService:

    @staticmethod
    async def get_alerts():
        logs = await mongodb.database.logs.find().to_list(None)

        detected_alerts = DetectionEngine.run(logs)

        enriched_alerts = []

        for index, alert in enumerate(
            detected_alerts,
            start=1
        ):
            enriched_alerts.append({
                "id": f"THREAT-{index:03}",
                "title": alert["title"],
                "icon": alert.get(
                    "icon",
                    "shield"
                ),
                "severity": alert["severity"],
                "source_ip": alert["source_ip"],
                "count": alert["count"],
                "event": alert["event"],
                "recommendation": alert["recommendation"],
                "mitre": alert["mitre"],
                "confidence": alert["confidence"],
                "risk_score": alert["risk_score"],
                "threat_score": alert["threat_score"],
                "detected_at": alert["detected_at"],
                "status": "Active",
                "iocs": alert["iocs"]
            })

        return enriched_alerts