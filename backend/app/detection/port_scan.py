from collections import defaultdict

class PortScanDetector:

    @staticmethod
    def detect(logs):
        grouped = defaultdict(list)

        for log in logs:
            if log.get("event_type") == "port_scan":
                grouped[log["source_ip"]].append(log)

        alerts = []

        for ip, entries in grouped.items():
            if len(entries) < 3:
                continue

            alerts.append({
                "title": "Port Scan Detected",
                "severity": "High",
                "source_ip": ip,
                "count": len(entries),
                "event": "Reconnaissance",
                "recommendation": "Investigate reconnaissance activity from this host.",
                "mitre": "T1046",
                "confidence": 91,
                "detected_at": entries[-1]["timestamp"],
                "icon": "radar"
            })

        return alerts