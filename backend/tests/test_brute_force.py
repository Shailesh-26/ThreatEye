from app.detection.brute_force import BruteForceDetector
from tests.helpers import log


def failures(count, gap_seconds, ip="203.0.113.1", start=0, user="admin"):
    return [log(start + i * gap_seconds, ip, "login_failed", username=user) for i in range(count)]


def test_five_failures_in_one_minute_is_an_alert():
    alerts = BruteForceDetector.detect(failures(5, 10))
    assert len(alerts) == 1
    assert alerts[0]["source_ip"] == "203.0.113.1"
    assert alerts[0]["count"] == 5


def test_four_failures_is_below_threshold():
    assert BruteForceDetector.detect(failures(4, 10)) == []


def test_failures_spread_over_hours_do_not_alert():
    # 10 failures, one every 30 minutes: never 5 inside a 5-minute window.
    assert BruteForceDetector.detect(failures(10, 30 * 60)) == []


def test_uppercase_event_type_is_understood():
    logs = [dict(row, event_type="LOGIN_FAILED") for row in failures(5, 10)]
    assert len(BruteForceDetector.detect(logs)) == 1


def test_success_after_failures_escalates_to_critical():
    logs = failures(5, 10) + [log(60, "203.0.113.1", "login_success", username="admin")]
    alert = BruteForceDetector.detect(logs)[0]
    assert alert["compromise_suspected"] is True
    assert alert["severity"] == "Critical"


def test_success_from_a_different_ip_does_not_escalate():
    logs = failures(5, 10) + [log(60, "192.168.1.9", "login_success", username="admin")]
    assert BruteForceDetector.detect(logs)[0]["compromise_suspected"] is False


def test_each_attacker_gets_its_own_alert():
    logs = failures(5, 10, ip="203.0.113.1") + failures(6, 10, ip="203.0.113.2")
    assert sorted(a["source_ip"] for a in BruteForceDetector.detect(logs)) == ["203.0.113.1", "203.0.113.2"]


def test_alert_explains_itself():
    alert = BruteForceDetector.detect(failures(5, 10))[0]
    assert "5 failed logins within 5 minutes" in alert["score_reasons"]
    assert len(alert["evidence"]) == 5
    assert alert["mitre"] == "T1110"
