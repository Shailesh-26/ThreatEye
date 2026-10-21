from app.services.ioc_extractor import IOCExtractor
from app.services.threat_score_service import ThreatScoreService, severity_for


def test_more_events_never_lowers_the_score():
    scores = [ThreatScoreService.calculate("brute_force", n)["threat_score"] for n in (5, 10, 50, 500)]
    assert scores == sorted(scores)
    assert scores[0] < scores[-1]  # 5 attempts and 500 attempts are not the same


def test_scores_stay_in_range():
    result = ThreatScoreService.calculate("sql_injection", 10_000, threat_bonus=50, confidence_bonus=50)
    assert result["threat_score"] <= 100
    assert result["confidence"] <= 99


def test_severity_thresholds():
    assert severity_for(95) == "Critical"
    assert severity_for(75) == "High"
    assert severity_for(50) == "Medium"
    assert severity_for(10) == "Low"


def test_unknown_detector_gets_default_profile():
    assert ThreatScoreService.calculate("something_new", 1)["mitre"] == "Unknown"


def test_ioc_ignores_invalid_ips_and_file_names():
    iocs = IOCExtractor.extract("from 999.1.1.1 and 10.0.0.5 GET /index.php http://evil.example.net/x")
    assert iocs["ips"] == ["10.0.0.5"]
    assert "index.php" not in iocs["domains"]
    assert "evil.example.net" in iocs["domains"]
    assert iocs["urls"] == ["http://evil.example.net/x"]
