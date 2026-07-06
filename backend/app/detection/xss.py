import re
from collections import defaultdict

from app.services.ioc_extractor import IOCExtractor
from app.services.threat_score_service import ThreatScoreService


class XSSDetector:

    PATTERNS = [
        re.compile(r"<script.*?>", re.IGNORECASE),
        re.compile(r"</script>", re.IGNORECASE),
        re.compile(r"javascript:", re.IGNORECASE),
        re.compile(r"onerror\s*=", re.IGNORECASE),
        re.compile(r"onload\s*=", re.IGNORECASE),
        re.compile(r"onclick\s*=", re.IGNORECASE),
        re.compile(r"alert\s*\(", re.IGNORECASE),
        re.compile(r"document\.cookie", re.IGNORECASE),
        re.compile(r"document\.location", re.IGNORECASE),
        re.compile(r"eval\s*\(", re.IGNORECASE),
        re.compile(r"<iframe", re.IGNORECASE),
        re.compile(r"<img", re.IGNORECASE),
        re.compile(r"<svg", re.IGNORECASE),
        re.compile(r"String\.fromCharCode", re.IGNORECASE)
    ]

    SEARCH_FIELDS = [
        "payload",
        "message",
        "url",
        "query",
        "request"
    ]

    @classmethod
    def detect(cls, logs):

        grouped = defaultdict(list)

        for log in logs:

            text = " ".join(
                str(log.get(field, ""))
                for field in cls.SEARCH_FIELDS
            )

            matches = sum(
                1
                for pattern in cls.PATTERNS
                if pattern.search(text)
            )

            if matches == 0:
                continue

            log["_match_count"] = matches

            grouped[
                log.get("source_ip", "Unknown")
            ].append(log)

        alerts = []

        for ip, entries in grouped.items():

            total_matches = sum(
                entry["_match_count"]
                for entry in entries
            )

            searchable_text = " ".join(
                IOCExtractor.build_searchable_text(entry)
                for entry in entries
            )

            score = ThreatScoreService.calculate(
                attack_type="Cross Site Scripting",
                event_count=total_matches
            )

            alerts.append({
                "title": "Cross Site Scripting",
                "source_ip": ip,
                "count": len(entries),
                "event": "XSS Attack",
                "detected_at": entries[-1]["timestamp"],
                "icon": "shield",
                "iocs": IOCExtractor.extract(searchable_text),
                **score
            })

        return alerts