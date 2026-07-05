ATTACK_PROFILES = {
    "Brute Force": {
        "mitre": "T1110",
        "base_score": 85,
        "weight": 3,
        "recommendation": (
            "Investigate repeated authentication failures. "
            "Consider enabling account lockout policies, MFA and "
            "blocking the attacking source."
        )
    },

    "Port Scan": {
        "mitre": "T1046",
        "base_score": 55,
        "weight": 2,
        "recommendation": (
            "Investigate the scanning source and verify whether "
            "network reconnaissance is authorized."
        )
    },

    "SQL Injection": {
        "mitre": "T1190",
        "base_score": 90,
        "weight": 3,
        "recommendation": (
            "Inspect affected web applications immediately. "
            "Validate inputs and enable WAF protection."
        )
    },

    "Cross Site Scripting": {
        "mitre": "T1059",
        "base_score": 82,
        "weight": 2,
        "recommendation": (
            "Validate user supplied input and encode all HTML output."
        )
    },

    "Malware": {
        "mitre": "T1204",
        "base_score": 95,
        "weight": 4,
        "recommendation": (
            "Immediately isolate the affected endpoint and begin malware analysis."
        )
    }
}


class ThreatScoreService:

    @staticmethod
    def calculate(
        attack_type: str,
        event_count: int
    ):
        profile = ATTACK_PROFILES.get(
            attack_type,
            {
                "mitre": "Unknown",
                "base_score": 50,
                "weight": 1,
                "recommendation": "Further investigation required."
            }
        )

        threat_score = min(
            profile["base_score"] +
            (event_count * profile["weight"]),
            100
        )

        confidence = min(
            70 +
            (event_count * profile["weight"]),
            99
        )

        risk_score = round(
            (threat_score * 0.6) +
            (confidence * 0.4)
        )

        if threat_score >= 95:
            severity = "Critical"

        elif threat_score >= 80:
            severity = "High"

        elif threat_score >= 60:
            severity = "Medium"

        else:
            severity = "Low"

        return {
            "severity": severity,
            "confidence": confidence,
            "risk_score": risk_score,
            "threat_score": threat_score,
            "mitre": profile["mitre"],
            "recommendation": profile["recommendation"]
        }