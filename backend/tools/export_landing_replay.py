"""
Builds the data for the landing page replay from a real sample dataset.

It reads datasets/05_mixed_soc_day.csv with the same parser the upload
uses, runs the real detectors, and writes the events + alerts to
frontend/src/data/sampleDay.json. Nothing on the landing page is invented.

Run from the backend folder (after changing a detector or the dataset):
    python -m tools.export_landing_replay
"""

import json
from pathlib import Path

from app.core.timestamps import parse_timestamp
from app.detection.base import FAILED_LOGIN_EVENTS, SUCCESS_LOGIN_EVENTS, event_type
from app.detection.detection_engine import DetectionEngine
from app.services.log_parser import parse_logs

ROOT = Path(__file__).resolve().parents[2]
DATASET = ROOT / "datasets" / "05_mixed_soc_day.csv"
OUTPUT = ROOT / "frontend" / "src" / "data" / "sampleDay.json"

DAY_START_HOUR = 8
DAY_END_HOUR = 18


def lane_for(log):
    ev = event_type(log)
    if ev in FAILED_LOGIN_EVENTS or ev in SUCCESS_LOGIN_EVENTS:
        return "auth"
    if log.get("destination_port") is not None or "connection" in ev or ev == "port_scan":
        return "network"
    return "web"


def detail_for(log):
    for field in ("payload", "url", "username", "destination_port", "message"):
        if log.get(field) is not None:
            text = str(log[field])
            return {"field": field, "value": text if len(text) <= 90 else text[:90] + "..."}
    return None


def main():
    with DATASET.open("rb") as handle:
        logs, _ = parse_logs(DATASET.name, handle)

    alerts = DetectionEngine.run([dict(log) for log in logs])
    alerts.sort(key=lambda a: parse_timestamp(a["last_seen"]))

    day_start = parse_timestamp(logs[0]["timestamp"]).replace(
        hour=DAY_START_HOUR, minute=0, second=0
    )

    def seconds(value):
        return int((parse_timestamp(value) - day_start).total_seconds())

    owner = {}
    for index, alert in enumerate(alerts):
        for item in alert["evidence"]:
            owner[(str(item["timestamp"]), item["source_ip"])] = index

    events = []
    for log in sorted(logs, key=lambda row: parse_timestamp(row["timestamp"])):
        events.append({
            "t": seconds(log["timestamp"]),
            "time": parse_timestamp(log["timestamp"]).strftime("%H:%M:%S"),
            "ip": log["source_ip"],
            "event": log["event_type"],
            "lane": lane_for(log),
            "detail": detail_for(log),
            "alert": owner.get((str(log["timestamp"]), log["source_ip"]), -1),
        })

    payload = {
        "source": f"datasets/{DATASET.name}",
        "date": day_start.strftime("%Y-%m-%d"),
        "start_hour": DAY_START_HOUR,
        "end_hour": DAY_END_HOUR,
        "duration": (DAY_END_HOUR - DAY_START_HOUR) * 3600,
        "events": events,
        "alerts": [
            {
                "index": index,
                "detector_id": alert["detector_id"],
                "title": alert["title"],
                "ip": alert["source_ip"],
                "severity": alert["severity"],
                "threat_score": alert["threat_score"],
                "mitre": alert["mitre"],
                "mitre_name": alert["mitre_name"],
                "count": alert["count"],
                "first": seconds(alert["first_seen"]),
                "at": seconds(alert["last_seen"]),
                "time": parse_timestamp(alert["last_seen"]).strftime("%H:%M:%S"),
                "reasons": alert["score_reasons"],
            }
            for index, alert in enumerate(alerts)
        ],
    }

    OUTPUT.write_text(json.dumps(payload, indent=1), encoding="utf-8")
    print(f"Wrote {len(events)} events and {len(alerts)} alerts to {OUTPUT}")


if __name__ == "__main__":
    main()
