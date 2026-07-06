from app.detection.brute_force import BruteForceDetector
from app.detection.port_scan import PortScanDetector
from app.detection.sql_injection import SQLInjectionDetector
from app.detection.xss import XSSDetector
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

        alerts.extend(
            XSSDetector.detect(logs)
        )
        return alerts