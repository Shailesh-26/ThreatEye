from app.database.mongodb import mongodb
from app.detection.brute_force import BruteForceDetector


class AlertService:

    @staticmethod
    async def get_alerts():
        detector = BruteForceDetector()

        logs = await mongodb.database.logs.find().to_list(None)

        alerts = detector.detect(logs)

        enriched = []

        for index, alert in enumerate(alerts, start=1):
            severity = alert.get("severity", "Medium")

            enriched.append(
                {
                    "id": f"THREAT-{index:03}",
                    "title": alert["title"],
                    "icon": "shield",
                    "severity": severity,
                    "source_ip": alert["source_ip"],
                    "count": alert["count"],
                    "recommendation": alert["recommendation"],
                    "mitre": "T1110",
                    "confidence": 96 if severity == "Critical" else 88,
                    "detected_at": "24 Jun 2026 10:04 AM",
                    "destination": "ThreatEye Login Portal",
                    "status": "Active",
                    "timeline": [
                        "Login Failed",
                        "Login Failed",
                        "Login Failed",
                        "Login Failed",
                        "Login Failed"
                    ]
                }
            )

        return enriched