from app.detection.brute_force import BruteForceDetector
from app.detection.port_scan import PortScanDetector
from app.detection.sql_injection import SQLInjectionDetector

class DetectionEngine:

    @staticmethod
    def run(logs):

        alerts = []

        alerts.extend(
            BruteForceDetector.detect(logs)
        )

        alerts.extend(
            PortScanDetector.detect(logs)
        )

        alerts.extend(
            SQLInjectionDetector.detect(logs)
        )

        return alerts