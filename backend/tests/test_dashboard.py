from pathlib import Path

from app.detection.detection_engine import DetectionEngine
from app.services.alert_service import number_alerts
from app.services.dashboard_service import build_dashboard
from app.services.log_parser import parse_logs

MIXED = Path(__file__).resolve().parents[2] / "datasets" / "05_mixed_soc_day.csv"


def mixed_day():
    with MIXED.open("rb") as handle:
        logs, _ = parse_logs(MIXED.name, handle)
    return logs, number_alerts(DetectionEngine.run([dict(log) for log in logs]))


def test_alert_ids_are_ordered_by_risk():
    _, alerts = mixed_day()
    assert [a["id"] for a in alerts][:2] == ["THREAT-001", "THREAT-002"]
    risks = [a["risk_score"] for a in alerts]
    assert risks == sorted(risks, reverse=True)


def test_dashboard_counts_match_the_data():
    logs, alerts = mixed_day()
    data = build_dashboard(logs, alerts)
    assert data["total_logs"] == len(logs)
    assert data["total_alerts"] == 5
    assert sum(data["alerts_by_severity"].values()) == 5
    assert sum(b["events"] for b in data["timeline"]["buckets"]) == len(logs)
    assert sum(len(b["alerts"]) for b in data["timeline"]["buckets"]) == 5


def test_sources_put_the_riskiest_attacker_first():
    logs, alerts = mixed_day()
    sources = build_dashboard(logs, alerts)["sources"]
    assert sources[0]["ip"] == "203.0.113.10"
    assert sources[0]["max_severity"] == "Critical"
    scanner = next(s for s in sources if s["ip"] == "203.0.113.50")
    assert scanner["detectors"] == ["brute_force", "port_scan"]


def test_empty_dataset_gives_an_empty_dashboard():
    data = build_dashboard([], [])
    assert data["total_logs"] == 0
    assert data["timeline"] is None
    assert data["sources"] == []
