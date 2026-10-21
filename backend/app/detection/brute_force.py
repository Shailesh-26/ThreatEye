"""
Brute force: many failed logins from one IP in a short time.

Rule: at least FAILURE_THRESHOLD failed logins from the same source IP
inside any WINDOW_SECONDS window. A successful login from that IP after the
failures started means the attacker may have guessed a password, so the
alert is escalated.
"""

from app.detection.base import (
    FAILED_LOGIN_EVENTS,
    SUCCESS_LOGIN_EVENTS,
    BaseDetector,
    event_type,
    find_burst,
    parse_timestamp,
)
from app.services.evidence_service import EvidenceService
from app.services.threat_score_service import ThreatScoreService


class BruteForceDetector(BaseDetector):
    id = "brute_force"
    name = "Brute Force"
    title = "Brute Force Attack"
    event = "Multiple Failed Logins"
    icon = "shield"
    version = "2.0.0"
    description = "5+ failed logins from one IP within 5 minutes; escalates if a login then succeeds."

    FAILURE_THRESHOLD = 5
    WINDOW_SECONDS = 5 * 60

    @classmethod
    def detect(cls, logs):
        failures = [log for log in logs if event_type(log) in FAILED_LOGIN_EVENTS]
        successes = [log for log in logs if event_type(log) in SUCCESS_LOGIN_EVENTS]

        alerts = []
        for ip, ip_failures in cls.group_by_ip(failures).items():
            burst = find_burst(ip_failures, cls.WINDOW_SECONDS, cls.FAILURE_THRESHOLD)
            if burst is None:
                continue

            burst_start = parse_timestamp(burst[0].get("timestamp"))
            minutes = cls.WINDOW_SECONDS // 60
            reasons = [f"{len(burst)} failed logins within {minutes} minutes"]

            usernames = sorted({str(e["username"]) for e in burst if e.get("username")})
            if len(usernames) > 1:
                reasons.append(
                    f"{len(usernames)} different accounts targeted (password spraying pattern)"
                )

            # Did this IP log in successfully after the attack started?
            later_success = [
                s for s in successes
                if s.get("source_ip") == ip
                and (parse_timestamp(s.get("timestamp")) or burst_start) >= burst_start
            ]
            compromise = bool(later_success)
            if compromise:
                user = later_success[0].get("username") or "an account"
                reasons.append(f"Successful login as {user} after the failures - possible compromise")

            score = ThreatScoreService.calculate(
                cls.id,
                event_count=len(burst),
                threat_bonus=25 if compromise else 0,
                confidence_bonus=15 if compromise else 0,
            )

            entries = burst + later_success[:1]
            evidence = EvidenceService.from_events(entries, note_field="username")

            alerts.append(cls.build_alert(
                ip,
                entries,
                score,
                reasons,
                evidence,
                extra={
                    "count": len(burst),
                    "total_failures": len(ip_failures),
                    "targeted_accounts": usernames,
                    "compromise_suspected": compromise,
                    "title": (
                        "Brute Force - Successful Login After Failures"
                        if compromise else cls.title
                    ),
                },
            ))

        return alerts
