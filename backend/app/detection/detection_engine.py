from app.detection.brute_force import BruteForceDetector
from app.detection.port_scan import PortScanDetector

class DetectionEngine:
    @staticmethod
    def run(logs):
        alerts=[]
        alerts.extend(BruteForceDetector.detect(logs))
        alerts.extend(PortScanDetector.detect(logs))
        return alerts