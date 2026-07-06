from app.services.ioc_extractor import IOCExtractor
from app.services.threat_score_service import ThreatScoreService


class BruteForceDetector:

    @staticmethod
    def detect(logs):
        failed = {}

        for log in logs:
            if log.get("event_type") != "login_failed":
                continue

            ip = log["source_ip"]

            failed.setdefault(
                ip,
                []
            ).append(log)

        alerts = []

        for ip, entries in failed.items():
            if len(entries) < 5:
                continue

            score = ThreatScoreService.calculate(
                attack_type="Brute Force",
                event_count=len(entries)
            )

            searchable_text = " ".join(
    IOCExtractor.build_searchable_text(entry)
    for entry in entries
)

            alerts.append({
                "title": "Brute Force Attack",
                "source_ip": ip,
                "count": len(entries),
                "event": "Multiple Failed Logins",
                "detected_at": entries[-1]["timestamp"],
                "icon": "shield",
                "iocs": IOCExtractor.extract(searchable_text),
                **score
            })

        return alerts