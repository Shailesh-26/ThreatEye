"""
Port scan: one IP probing many different ports.

Two ways to trigger it:
1. Behaviour: connection events from one IP to DISTINCT_PORT_THRESHOLD or more
   different destination ports within WINDOW_SECONDS.
2. Sensor label: an IDS/firewall already marked IDS_EVENT_THRESHOLD or more
   events from that IP as 'port_scan'.
"""

from app.detection.base import BaseDetector, event_type, find_burst
from app.services.evidence_service import EvidenceService
from app.services.threat_score_service import ThreatScoreService

CONNECTION_EVENTS = {
    "connection",
    "connection_attempt",
    "connection_denied",
    "firewall_deny",
    "firewall_allow",
    "network_connection",
}


def _port(log):
    return str(log.get("destination_port") or "").strip()


class PortScanDetector(BaseDetector):
    id = "port_scan"
    name = "Port Scan"
    title = "Port Scan Detected"
    event = "Reconnaissance"
    icon = "radar"
    version = "2.0.0"
    description = "10+ different ports probed by one IP within 60 seconds, or 3+ IDS 'port_scan' events."

    DISTINCT_PORT_THRESHOLD = 10
    WINDOW_SECONDS = 60
    IDS_EVENT_THRESHOLD = 3

    @classmethod
    def detect(cls, logs):
        connections = [
            log for log in logs
            if event_type(log) in CONNECTION_EVENTS and _port(log)
        ]
        ids_events = [log for log in logs if event_type(log) == "port_scan"]

        conn_by_ip = cls.group_by_ip(connections)
        ids_by_ip = cls.group_by_ip(ids_events)

        alerts = []
        for ip in sorted(set(conn_by_ip) | set(ids_by_ip)):
            reasons = []
            entries = []

            burst = find_burst(
                conn_by_ip.get(ip, []),
                cls.WINDOW_SECONDS,
                cls.DISTINCT_PORT_THRESHOLD,
                distinct_key=_port,
            )
            if burst:
                ports = sorted({_port(e) for e in burst}, key=lambda p: (len(p), p))
                reasons.append(
                    f"{len(ports)} different ports probed within {cls.WINDOW_SECONDS} seconds"
                )
                entries.extend(burst)

            labelled = ids_by_ip.get(ip, [])
            if len(labelled) >= cls.IDS_EVENT_THRESHOLD:
                reasons.append(f"{len(labelled)} events flagged as port_scan by a sensor")
                entries.extend(labelled)

            if not reasons:
                continue

            ports = sorted({_port(e) for e in entries if _port(e)}, key=lambda p: (len(p), p))
            if ports:
                reasons.append("Ports: " + ", ".join(ports[:15]) + (" ..." if len(ports) > 15 else ""))

            score = ThreatScoreService.calculate(
                cls.id,
                event_count=max(len(ports), len(labelled)),
                # Both signals together = more confident.
                confidence_bonus=10 if burst and len(labelled) >= cls.IDS_EVENT_THRESHOLD else 0,
            )

            evidence = EvidenceService.from_events(entries, note_field="destination_port")

            alerts.append(cls.build_alert(
                ip, entries, score, reasons, evidence,
                extra={"ports_probed": ports},
            ))

        return alerts
