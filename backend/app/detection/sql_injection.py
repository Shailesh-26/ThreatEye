import re
from collections import defaultdict

from app.services.ioc_extractor import IOCExtractor
from app.services.threat_score_service import ThreatScoreService


class SQLInjectionDetector:

    SQL_PATTERNS = [
        re.compile(r"union\s+select", re.IGNORECASE),
        re.compile(r"or\s+1=1", re.IGNORECASE),
        re.compile(r"'\s*or\s*'1'\s*=\s*'1", re.IGNORECASE),
        re.compile(r'information_schema', re.IGNORECASE),
        re.compile(r'xp_cmdshell', re.IGNORECASE),
        re.compile(r'benchmark\s*\(', re.IGNORECASE),
        re.compile(r'sleep\s*\(', re.IGNORECASE),
        re.compile(r'waitfor\s+delay', re.IGNORECASE),
        re.compile(r';\s*(drop|delete|insert|update)', re.IGNORECASE),
        re.compile(r'/\*.*?\*/', re.IGNORECASE),
        re.compile(r'--'),
        re.compile(r'#')
    ]

    SEARCH_FIELDS = [
        "message",
        "payload",
        "request",
        "query",
        "url",
        "command"
    ]

    @classmethod
    def detect(cls, logs):

        grouped = defaultdict(list)

        for log in logs:

            searchable = " ".join(
                str(log.get(field, ""))
                for field in cls.SEARCH_FIELDS
            )

            matches = sum(
                1
                for pattern in cls.SQL_PATTERNS
                if pattern.search(searchable)
            )

            if matches == 0:
                continue

            source_ip = log.get("source_ip", "Unknown")

            log["_sql_match_count"] = matches

            grouped[source_ip].append(log)

        alerts = []

        for ip, entries in grouped.items():

            total_matches = sum(
                entry["_sql_match_count"]
                for entry in entries
            )

            score = ThreatScoreService.calculate(
                attack_type="SQL Injection",
                event_count=total_matches
            )

            searchable_text = " ".join(
    IOCExtractor.build_searchable_text(entry)
    for entry in entries
)

            alerts.append({
                "title": "SQL Injection Attempt",
                "source_ip": ip,
                "count": len(entries),
                "event": "SQL Injection",
                "pattern_matches": total_matches,
                "detected_at": entries[-1]["timestamp"],
                "icon": "database",
                "iocs": IOCExtractor.extract(searchable_text),
                **score
            })

        return alerts