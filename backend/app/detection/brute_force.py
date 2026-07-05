class BruteForceDetector:

    @staticmethod
    def detect(logs):
        failed = {}

        for log in logs:
            if log.get("event_type") != "login_failed":
                continue

            ip = log["source_ip"]
            failed.setdefault(ip, []).append(log)

        alerts = []

        for ip, entries in failed.items():
            if len(entries) < 5:
                continue

            alerts.append({
                "title": "Brute Force Attack",
                "severity": "Critical",
                "source_ip": ip,
                "count": len(entries),
                "event": "Multiple Failed Logins",
                "recommendation": "Immediately block the source IP and investigate authentication attempts.",
                "mitre": "T1110",
                "confidence": 98,
                "detected_at": entries[-1]["timestamp"],
                "icon": "shield"
            })

        return alerts