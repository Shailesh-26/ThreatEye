from collections import defaultdict
from app.services.threat_score_service import (
    ThreatScoreService
)


class PortScanDetector:

    @staticmethod
    def detect(logs):
        grouped = defaultdict(list)

        for log in logs:
            if log.get("event_type") != "port_scan":
                continue

            grouped[
                log["source_ip"]
            ].append(log)

        alerts = []

        for ip, entries in grouped.items():
            if len(entries) < 3:
                continue

            score = ThreatScoreService.calculate(
                attack_type="Port Scan",
                event_count=len(entries)
            )

            alerts.append({
                "title": "Port Scan Detected",
                "source_ip": ip,
                "count": len(entries),
                "event": "Reconnaissance",
                "detected_at": entries[-1]["timestamp"],
                "icon": "radar",
                **score
            })

        return alerts