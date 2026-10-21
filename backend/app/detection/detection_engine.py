from app.detection.detector_registry import ALL_DETECTORS


class DetectionEngine:
    """Runs every registered detector over the logs and collects the alerts."""

    @staticmethod
    def run(logs):
        alerts = []
        for detector in ALL_DETECTORS:
            alerts.extend(detector.detect(logs))
        return alerts
