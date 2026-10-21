"""
Numbers and series for the dashboard, all computed from the logs that are
loaded now and the alerts the detectors raise on them.

build_dashboard() is a plain function (no database), so it can be tested
directly; DashboardService only loads the data and calls it.
"""

from collections import Counter, defaultdict
from datetime import timedelta

from app.core.timestamps import parse_timestamp
from app.database.mongodb import mongodb
from app.detection.base import FAILED_LOGIN_EVENTS, SUCCESS_LOGIN_EVENTS, event_type
from app.detection.detection_engine import DetectionEngine
from app.detection.detector_registry import ALL_DETECTORS
from app.services.alert_service import number_alerts

SEVERITY_RANK = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
BUCKET_CHOICES = [60, 300, 900, 1800, 3600, 7200, 21600, 86400]  # seconds
MAX_BUCKETS = 96


def _bucket_size(span_seconds: float) -> int:
    for size in BUCKET_CHOICES:
        if span_seconds / size <= MAX_BUCKETS:
            return size
    return BUCKET_CHOICES[-1]


def _timeline(logs, alerts):
    times = [parse_timestamp(log.get("timestamp")) for log in logs]
    times = [t for t in times if t is not None]
    if not times:
        return None

    first, last = min(times), max(times)
    size = _bucket_size((last - first).total_seconds())
    midnight = first.replace(hour=0, minute=0, second=0, microsecond=0)
    start = midnight + timedelta(
        seconds=int((first - midnight).total_seconds() // size * size)
    )
    count = int((last - start).total_seconds() // size) + 1

    events = [0] * count
    for t in times:
        events[int((t - start).total_seconds() // size)] += 1

    alert_marks = defaultdict(list)
    for alert in alerts:
        t = parse_timestamp(alert.get("last_seen"))
        if t is not None:
            index = min(count - 1, max(0, int((t - start).total_seconds() // size)))
            alert_marks[index].append({"id": alert["id"], "severity": alert["severity"]})

    return {
        "bucket_seconds": size,
        "start": start.isoformat(),
        "first": first.isoformat(),
        "last": last.isoformat(),
        "buckets": [
            {
                "start": (start + timedelta(seconds=i * size)).isoformat(),
                "events": events[i],
                "alerts": alert_marks.get(i, []),
            }
            for i in range(count)
        ],
    }


def _sources(logs, alerts, limit=40):
    events_by_ip = Counter(log.get("source_ip") for log in logs if log.get("source_ip"))
    alerts_by_ip = defaultdict(list)
    for alert in alerts:
        alerts_by_ip[alert["source_ip"]].append(alert)

    sources = []
    for ip, count in events_by_ip.items():
        ip_alerts = alerts_by_ip.get(ip, [])
        worst = max(ip_alerts, key=lambda a: SEVERITY_RANK.get(a["severity"], 0), default=None)
        sources.append({
            "ip": ip,
            "events": count,
            "alerts": len(ip_alerts),
            "alert_ids": [a["id"] for a in ip_alerts],
            "detectors": sorted({a["detector_id"] for a in ip_alerts}),
            "max_severity": worst["severity"] if worst else None,
            "risk": max((a["risk_score"] for a in ip_alerts), default=0),
        })

    sources.sort(key=lambda s: (s["risk"], s["events"]), reverse=True)
    return sources[:limit]


def build_dashboard(logs: list[dict], alerts: list[dict]) -> dict:
    """`alerts` must already be numbered (see number_alerts)."""
    severity_counts = Counter(alert["severity"] for alert in alerts)
    events = Counter(event_type(log) for log in logs)
    by_detector = Counter(alert["detector_id"] for alert in alerts)

    return {
        "total_logs": len(logs),
        "total_alerts": len(alerts),
        "high_severity_alerts": severity_counts["High"] + severity_counts["Critical"],
        "alerts_by_severity": {
            level: severity_counts[level] for level in ("Critical", "High", "Medium", "Low")
        },
        "alerts_by_type": dict(by_detector),
        "unique_source_ips": len({log.get("source_ip") for log in logs if log.get("source_ip")}),
        "failed_logins": sum(events[name] for name in FAILED_LOGIN_EVENTS),
        "successful_logins": sum(events[name] for name in SUCCESS_LOGIN_EVENTS),
        "port_scan_events": events["port_scan"],
        "event_types": [{"type": name, "count": n} for name, n in events.most_common(8)],
        "timeline": _timeline(logs, alerts),
        "sources": _sources(logs, alerts),
        "top_alerts": [
            {
                key: alert.get(key)
                for key in ("id", "title", "source_ip", "severity", "risk_score",
                            "detector_id", "last_seen", "count", "mitre")
            }
            for alert in alerts[:6]
        ],
        "detectors": [
            {"id": d.id, "name": d.name, "alerts": by_detector.get(d.id, 0)}
            for d in ALL_DETECTORS
        ],
    }


class DashboardService:

    @staticmethod
    async def get_dashboard_stats():
        logs = await mongodb.database.logs.find({}, {"_id": 0}).to_list(length=None)
        alerts = number_alerts(DetectionEngine.run([dict(log) for log in logs]))
        return build_dashboard(logs, alerts)
