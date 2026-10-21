from collections import Counter

from app.database.mongodb import mongodb
from app.detection.base import FAILED_LOGIN_EVENTS, SUCCESS_LOGIN_EVENTS, event_type
from app.detection.detection_engine import DetectionEngine


class DashboardService:

    @staticmethod
    async def get_dashboard_stats():
        logs = await mongodb.database.logs.find({}, {"_id": 0}).to_list(length=None)

        alerts = DetectionEngine.run(logs)
        severity_counts = Counter(alert["severity"] for alert in alerts)
        events = Counter(event_type(log) for log in logs)

        return {
            "total_logs": len(logs),
            "total_alerts": len(alerts),
            "high_severity_alerts": severity_counts["High"] + severity_counts["Critical"],
            "alerts_by_severity": {
                level: severity_counts[level]
                for level in ("Critical", "High", "Medium", "Low")
            },
            "alerts_by_type": dict(Counter(alert["detector_id"] for alert in alerts)),
            "unique_source_ips": len({log.get("source_ip") for log in logs if log.get("source_ip")}),
            "failed_logins": sum(events[name] for name in FAILED_LOGIN_EVENTS),
            "successful_logins": sum(events[name] for name in SUCCESS_LOGIN_EVENTS),
            "port_scan_events": events["port_scan"],
        }
