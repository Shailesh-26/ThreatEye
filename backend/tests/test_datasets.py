"""
Runs every file in datasets/ through the same parser and detectors the
upload uses, and checks the results promised in datasets/README.md.
"""

from pathlib import Path

import pytest

from app.detection.detection_engine import DetectionEngine
from app.services.log_parser import LogParseError, parse_logs

DATASETS = Path(__file__).resolve().parents[2] / "datasets"

# file -> expected sorted list of (detector_id, source_ip, severity)
EXPECTED = {
    "01_brute_force.csv": [
        ("brute_force", "198.51.100.23", "High"),
        ("brute_force", "203.0.113.10", "Critical"),
    ],
    "02_port_scan.csv": [
        ("port_scan", "198.51.100.77", "Medium"),
        ("port_scan", "203.0.113.50", "Medium"),
    ],
    "03_sql_injection.csv": [
        ("sql_injection", "198.51.100.91", "Medium"),
        ("sql_injection", "203.0.113.66", "Critical"),
    ],
    "04_xss.csv": [
        ("xss", "198.51.100.120", "Medium"),
        ("xss", "203.0.113.88", "High"),
    ],
    "05_mixed_soc_day.csv": [
        ("brute_force", "203.0.113.10", "Critical"),
        ("brute_force", "203.0.113.50", "High"),
        ("port_scan", "203.0.113.50", "Medium"),
        ("sql_injection", "198.51.100.91", "High"),
        ("xss", "198.51.100.120", "High"),
    ],
    "06_clean_baseline.csv": [],
    "07_json_format.json": [
        ("brute_force", "203.0.113.200", "High"),
    ],
}
# The Excel file is the mixed day saved as .xlsx - same expected result.
EXPECTED["08_mixed_soc_day.xlsx"] = EXPECTED["05_mixed_soc_day.csv"]


def run(name):
    path = DATASETS / name
    with path.open("rb") as handle:
        logs, _ = parse_logs(path.name, handle)
    return sorted((a["detector_id"], a["source_ip"], a["severity"]) for a in DetectionEngine.run(logs))


@pytest.mark.parametrize("name", sorted(EXPECTED))
def test_dataset_gives_expected_alerts(name):
    assert run(name) == EXPECTED[name]


def test_every_dataset_file_is_covered_by_a_test():
    files = {p.name for p in DATASETS.iterdir() if p.suffix in {".csv", ".json", ".xlsx"}}
    assert files - set(EXPECTED) == {"99_invalid_missing_column.csv"}


def test_invalid_file_is_rejected_with_clear_message():
    path = DATASETS / "99_invalid_missing_column.csv"
    with path.open("rb") as handle, pytest.raises(LogParseError, match="event_type"):
        parse_logs(path.name, handle)


def test_unsupported_extension_is_rejected():
    with pytest.raises(LogParseError, match="Unsupported"):
        parse_logs("notes.pdf", b"")
