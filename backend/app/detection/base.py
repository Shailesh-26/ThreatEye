"""
Shared building blocks for every ThreatEye detector.

A detector is a small class that looks at a list of log rows (dicts) and
returns a list of alerts (dicts). To add a new detector:

1. Create a new file in this folder, e.g. `command_injection.py`.
2. Subclass `BaseDetector` (counting/threshold rules) or `PatternDetector`
   (regex rules), fill in the class attributes and implement `detect`.
3. Add the class to `ALL_DETECTORS` in `detector_registry.py`.

That's it - the engine, the API and the Detections page pick it up from
the registry automatically. See docs/HOW_IT_WORKS.md for a walkthrough.
"""

import re
from collections import defaultdict
from datetime import datetime
from urllib.parse import unquote_plus

from app.core.timestamps import parse_timestamp  # noqa: F401  (re-exported for detectors)
from app.services.evidence_service import EvidenceService
from app.services.ioc_extractor import IOCExtractor
from app.services.threat_score_service import ThreatScoreService

# Different log sources name the same event differently. We accept all of
# these spellings (compared in lowercase).
FAILED_LOGIN_EVENTS = {
    "login_failed",
    "failed_login",
    "login_failure",
    "auth_failed",
    "authentication_failure",
    "logon_failure",
}

SUCCESS_LOGIN_EVENTS = {
    "login_success",
    "successful_login",
    "auth_success",
    "authentication_success",
    "logon_success",
}


def event_type(log: dict) -> str:
    """The log's event_type, trimmed and lowercased ('LOGIN_FAILED' -> 'login_failed')."""
    return str(log.get("event_type") or "").strip().lower()


def find_burst(entries, window_seconds, threshold, distinct_key=None):
    """
    Sliding-window search: find the time window of `window_seconds` that
    contains the most activity.

    - Without `distinct_key`, activity = number of entries in the window.
    - With `distinct_key` (a function), activity = number of *different*
      values in the window (e.g. different destination ports).

    Returns the list of entries in the busiest window if its activity is at
    least `threshold`, otherwise None. Entries without a readable timestamp
    are ignored here.
    """
    timed = []
    for entry in entries:
        ts = parse_timestamp(entry.get("timestamp"))
        if ts is not None:
            timed.append((ts, entry))
    timed.sort(key=lambda pair: pair[0])

    best_start, best_end, best_score = 0, -1, 0
    counts = defaultdict(int)
    start = 0

    for end, (end_ts, end_entry) in enumerate(timed):
        if distinct_key:
            counts[distinct_key(end_entry)] += 1

        # Shrink the window from the left until it fits in window_seconds.
        while (end_ts - timed[start][0]).total_seconds() > window_seconds:
            if distinct_key:
                key = distinct_key(timed[start][1])
                counts[key] -= 1
                if counts[key] == 0:
                    del counts[key]
            start += 1

        score = len(counts) if distinct_key else (end - start + 1)
        if score > best_score:
            best_start, best_end, best_score = start, end, score

    if best_score < threshold:
        return None

    return [entry for _, entry in timed[best_start:best_end + 1]]


class BaseDetector:
    """Common metadata + helpers. Subclasses override the attributes below."""

    id = "base"                 # unique id used in URLs: /detections/run/<id>
    name = "Base Detector"      # shown on the Detections page
    title = "Suspicious Activity"
    event = "Suspicious Activity"
    icon = "shield"             # frontend icon name: shield | radar | database
    version = "1.0.0"
    description = ""

    @classmethod
    def metadata(cls) -> dict:
        """What the Detections page shows for this rule."""
        profile = ThreatScoreService.profile(cls.id)
        return {
            "id": cls.id,
            "name": cls.name,
            "enabled": True,
            "severity": profile["typical_severity"],
            "mitre": profile["mitre"],
            "mitre_name": profile["mitre_name"],
            "version": cls.version,
            "description": cls.description,
        }

    @classmethod
    def detect(cls, logs: list[dict]) -> list[dict]:
        raise NotImplementedError

    @staticmethod
    def group_by_ip(logs):
        grouped = defaultdict(list)
        for log in logs:
            grouped[log.get("source_ip") or "Unknown"].append(log)
        return grouped

    @classmethod
    def build_alert(
        cls,
        source_ip,
        entries,
        score,
        reasons,
        evidence=None,
        extra=None,
    ) -> dict:
        """Assemble the alert dict in the one shape the API and UI expect."""
        times = sorted(
            (e.get("timestamp") for e in entries if e.get("timestamp") is not None),
            key=lambda value: parse_timestamp(value) or datetime.min,
        )
        evidence = evidence or EvidenceService.empty()

        searchable_text = " ".join(
            IOCExtractor.build_searchable_text(entry) for entry in entries
        )

        alert = {
            "detector_id": cls.id,
            "title": cls.title,
            "event": cls.event,
            "icon": cls.icon,
            "source_ip": source_ip,
            "count": len(entries),
            "first_seen": times[0] if times else None,
            "last_seen": times[-1] if times else None,
            "detected_at": times[-1] if times else None,
            "score_reasons": reasons,
            "iocs": IOCExtractor.extract(searchable_text),
            "evidence": evidence["evidence"],
            "matched_patterns": evidence["matched_patterns"],
            "affected_assets": evidence["affected_assets"],
            "timeline": evidence["timeline"],
            **score,
        }

        if extra:
            alert.update(extra)

        return alert


class PatternDetector(BaseDetector):
    """
    Base for regex-based detectors (SQL injection, XSS, ...).

    PATTERNS is a list of (human readable name, compiled regex).
    SEARCH_FIELDS lists the log columns that may contain attacker input.
    """

    PATTERNS: list[tuple[str, re.Pattern]] = []
    SEARCH_FIELDS: list[str] = []

    @classmethod
    def matches_in(cls, log: dict) -> list[tuple[str, str]]:
        """Return (field, pattern name) pairs that match in this log row."""
        found = []
        for field in cls.SEARCH_FIELDS:
            value = log.get(field)
            if value is None:
                continue
            # Attackers often URL-encode payloads (%27 = '), so decode first.
            text = unquote_plus(str(value))
            for name, regex in cls.PATTERNS:
                if regex.search(text):
                    found.append((field, name))
        return found

    @classmethod
    def detect(cls, logs):
        suspicious = [log for log in logs if cls.matches_in(log)]

        alerts = []
        for ip, entries in cls.group_by_ip(suspicious).items():
            evidence = EvidenceService.build(entries, cls.PATTERNS, cls.SEARCH_FIELDS)
            distinct_patterns = len(evidence["matched_patterns"])

            reasons = [
                f"{len(entries)} request(s) contained {cls.event} payloads",
                f"{distinct_patterns} different attack technique(s): "
                + ", ".join(evidence["matched_patterns"]),
            ]
            if evidence["affected_assets"]:
                reasons.append(
                    "Targeted: " + ", ".join(evidence["affected_assets"][:5])
                )

            score = ThreatScoreService.calculate(
                cls.id,
                event_count=len(entries),
                # Using several different techniques looks more deliberate.
                threat_bonus=min(3 * (distinct_patterns - 1), 12),
                confidence_bonus=min(5 * (distinct_patterns - 1), 20),
            )

            alerts.append(cls.build_alert(ip, entries, score, reasons, evidence))

        return alerts
