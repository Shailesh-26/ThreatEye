from app.database.mongodb import mongodb

from app.detection.detection_engine import DetectionEngine
class DashboardService:

    @staticmethod
    async def get_dashboard_stats():

        total_logs = await mongodb.database.logs.count_documents({})
        logs = await mongodb.database.logs.find().to_list(length=None)

        current_alerts = DetectionEngine.run(logs)

        total_alerts = len(current_alerts)

        high_severity_alerts = await mongodb.database.alerts.count_documents(
            {
                "severity": "High"
            }
        )

        logs_cursor = mongodb.database.logs.find()

        unique_ips = set()

        failed_logins = 0

        successful_logins = 0

        port_scan_events = 0

        async for log in logs_cursor:

            ip = log.get("source_ip")

            if ip:
                unique_ips.add(ip)

            event = log.get("event_type")

            if event == "login_failed":
                failed_logins += 1

            elif event == "login_success":
                successful_logins += 1

            elif event == "port_scan":
                port_scan_events += 1

        return {
            "total_logs": total_logs,
            "total_alerts": total_alerts,
            "high_severity_alerts": high_severity_alerts,
            "unique_source_ips": len(unique_ips),
            "failed_logins": failed_logins,
            "successful_logins": successful_logins,
            "port_scan_events": port_scan_events
        }