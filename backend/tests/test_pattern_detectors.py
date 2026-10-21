import pytest

from app.detection.sql_injection import SQLInjectionDetector
from app.detection.xss import XSSDetector
from tests.helpers import log

SQL_ATTACKS = [
    {"payload": "username=admin' OR '1'='1"},
    {"url": "/items?id=1 UNION SELECT password FROM users"},
    {"url": "/items?id=1%20UNION%20SELECT%20password%20FROM%20users"},  # URL-encoded
    {"payload": "id=5; DROP TABLE orders"},
    {"payload": "q=x' AND SLEEP(5)"},
    {"payload": "username=admin'--"},
    {"query": "1 or 1=1"},
]

SQL_NORMAL = [
    {"url": "/docs#install"},
    {"message": "Nightly build -- all tests passed"},
    {"url": "/search?q=c%23+tutorial"},
    {"url": "/products?sort=price&order=asc"},
    {"payload": "username=priya&password=hunter2"},
]

XSS_ATTACKS = [
    {"payload": "<script>alert(1)</script>"},
    {"payload": "<img src=x onerror=alert(1)>"},
    {"url": "/p?next=javascript:alert(1)"},
    {"payload": "<svg onload=fetch('//x')>"},
    {"payload": "<iframe src=//evil.example>"},
    {"url": "/s?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E"},  # URL-encoded
]

XSS_NORMAL = [
    {"payload": "<img src='/images/logo.png' alt='logo'>"},
    {"url": "/blog?title=evaluate(your)+options"},
    {"message": "User uploaded a profile picture"},
]


@pytest.mark.parametrize("fields", SQL_ATTACKS)
def test_sql_injection_attacks_are_detected(fields):
    assert len(SQLInjectionDetector.detect([log(**fields)])) == 1


@pytest.mark.parametrize("fields", SQL_NORMAL)
def test_normal_requests_are_not_sql_injection(fields):
    assert SQLInjectionDetector.detect([log(**fields)]) == []


@pytest.mark.parametrize("fields", XSS_ATTACKS)
def test_xss_attacks_are_detected(fields):
    assert len(XSSDetector.detect([log(**fields)])) == 1


@pytest.mark.parametrize("fields", XSS_NORMAL)
def test_normal_requests_are_not_xss(fields):
    assert XSSDetector.detect([log(**fields)]) == []


def test_evidence_says_which_field_and_pattern_matched():
    alert = SQLInjectionDetector.detect([
        log(0, payload="admin' OR '1'='1", url="/login?next=home"),
    ])[0]
    item = alert["evidence"][0]
    assert item["field"] == "payload"
    assert item["patterns"] == ["Quoted tautology (' OR 'a'='a)"]
    assert alert["affected_assets"] == ["/login"]


def test_more_techniques_means_higher_score():
    one = SQLInjectionDetector.detect([log(0, payload="admin'--")])[0]
    many = SQLInjectionDetector.detect([
        log(0, payload="admin'--"),
        log(1, url="/a?id=1 UNION SELECT 1"),
        log(2, payload="x' AND SLEEP(5)"),
    ])[0]
    assert many["threat_score"] > one["threat_score"]
