"""
Turns "how much happened" into scores a human can compare.

threat_score (0-100): how dangerous the activity looks.
    = base + weight * log2(event_count) + bonus
    log2 means each DOUBLING of events adds `weight` points, so 5 attempts
    and 500 attempts get different scores instead of both hitting 100.
confidence (0-99): how sure we are it's really an attack.
risk_score (0-100): 70% threat + 30% confidence - used to sort alerts.

These are simple, explainable rules - not machine learning.
"""

import math

SEVERITY_THRESHOLDS = [
    (90, "Critical"),
    (70, "High"),
    (45, "Medium"),
    (0, "Low"),
]

ATTACK_PROFILES = {
    "brute_force": {
        "mitre": "T1110",
        "mitre_name": "Brute Force",
        "base_score": 50,
        "weight": 8,
        "base_confidence": 60,
        "typical_severity": "High",
        "recommendation": (
            "Check whether any targeted account logged in successfully. "
            "Enable account lockout and MFA, and block the source IP if it is not trusted."
        ),
    },
    "port_scan": {
        "mitre": "T1046",
        "mitre_name": "Network Service Discovery",
        "base_score": 35,
        "weight": 6,
        "base_confidence": 55,
        "typical_severity": "Medium",
        "recommendation": (
            "Confirm whether the scan was authorized (e.g. an internal security tool). "
            "If not, block the source and review which open ports were exposed."
        ),
    },
    "sql_injection": {
        "mitre": "T1190",
        "mitre_name": "Exploit Public-Facing Application",
        "base_score": 60,
        "weight": 8,
        "base_confidence": 65,
        "typical_severity": "High",
        "recommendation": (
            "Inspect the targeted endpoints and database logs for unexpected queries. "
            "Use parameterized queries and enable WAF rules for SQL injection."
        ),
    },
    "xss": {
        "mitre": "T1059.007",
        "mitre_name": "Command and Scripting Interpreter: JavaScript",
        "base_score": 55,
        "weight": 7,
        "base_confidence": 60,
        "typical_severity": "Medium",
        "recommendation": (
            "Check whether the payload was stored or reflected to other users. "
            "Encode all HTML output and add a Content-Security-Policy header."
        ),
    },
}

DEFAULT_PROFILE = {
    "mitre": "Unknown",
    "mitre_name": "Unknown",
    "base_score": 40,
    "weight": 5,
    "base_confidence": 50,
    "typical_severity": "Medium",
    "recommendation": "Further investigation required.",
}


def severity_for(score: int) -> str:
    for minimum, label in SEVERITY_THRESHOLDS:
        if score >= minimum:
            return label
    return "Low"


class ThreatScoreService:

    @staticmethod
    def profile(detector_id: str) -> dict:
        return ATTACK_PROFILES.get(detector_id, DEFAULT_PROFILE)

    @staticmethod
    def calculate(
        detector_id: str,
        event_count: int,
        threat_bonus: int = 0,
        confidence_bonus: int = 0,
    ) -> dict:
        profile = ThreatScoreService.profile(detector_id)
        growth = math.log2(max(event_count, 1))

        threat_score = min(
            100,
            round(profile["base_score"] + profile["weight"] * growth + threat_bonus),
        )
        confidence = min(
            99,
            round(profile["base_confidence"] + 8 * growth + confidence_bonus),
        )
        risk_score = round(threat_score * 0.7 + confidence * 0.3)

        return {
            "severity": severity_for(threat_score),
            "threat_score": threat_score,
            "confidence": confidence,
            "risk_score": risk_score,
            "mitre": profile["mitre"],
            "mitre_name": profile["mitre_name"],
            "recommendation": profile["recommendation"],
        }
