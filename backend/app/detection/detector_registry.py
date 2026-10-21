"""
The single list of detectors ThreatEye knows about.

- ALL_DETECTORS: working detectors. The engine runs all of them, the API's
  /detections/run/<id> can run one, and the Detections page lists them.
- PLANNED_DETECTORS: shown as "Coming Soon" only. They do NOT run.

To add a detector: write its class (see base.py) and add it to ALL_DETECTORS.
"""

from app.detection.brute_force import BruteForceDetector
from app.detection.port_scan import PortScanDetector
from app.detection.sql_injection import SQLInjectionDetector
from app.detection.xss import XSSDetector

ALL_DETECTORS = [
    BruteForceDetector,
    PortScanDetector,
    SQLInjectionDetector,
    XSSDetector,
]

DETECTOR_MAP = {detector.id: detector for detector in ALL_DETECTORS}

PLANNED_DETECTORS = [
    {"id": "command_injection", "name": "Command Injection", "mitre": "T1059", "severity": "Critical"},
    {"id": "credential_stuffing", "name": "Credential Stuffing", "mitre": "T1110.004", "severity": "High"},
    {"id": "impossible_travel", "name": "Impossible Travel", "mitre": "T1078", "severity": "High"},
]


def list_rules() -> list[dict]:
    enabled = [detector.metadata() for detector in ALL_DETECTORS]
    planned = [
        {**rule, "enabled": False, "version": "-", "mitre_name": "", "description": "Planned"}
        for rule in PLANNED_DETECTORS
    ]
    return enabled + planned
