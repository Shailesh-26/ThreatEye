from app.detection.port_scan import PortScanDetector
from tests.helpers import log


def probes(ports, gap_seconds, ip="203.0.113.50"):
    return [
        log(i * gap_seconds, ip, "connection_attempt", destination_port=port)
        for i, port in enumerate(ports)
    ]


def test_ten_ports_in_a_minute_is_a_scan():
    alerts = PortScanDetector.detect(probes(range(20, 30), 3))
    assert len(alerts) == 1
    assert len(alerts[0]["ports_probed"]) == 10


def test_nine_ports_is_below_threshold():
    assert PortScanDetector.detect(probes(range(20, 29), 3)) == []


def test_many_connections_to_the_same_ports_is_normal():
    assert PortScanDetector.detect(probes([443, 80] * 20, 1)) == []


def test_slow_scan_outside_window_is_not_flagged():
    assert PortScanDetector.detect(probes(range(20, 35), 120)) == []


def test_ids_labelled_events_trigger_alert():
    logs = [log(i, "198.51.100.77", "port_scan", destination_port=22) for i in range(3)]
    assert len(PortScanDetector.detect(logs)) == 1
