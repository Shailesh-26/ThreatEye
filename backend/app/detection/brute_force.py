from collections import defaultdict


class BruteForceDetector:

    THRESHOLD = 3

    @staticmethod
    def detect(logs):

        failed_counts = defaultdict(int)

        for log in logs:

            if (
                log.get("event_type")
                == "login_failed"
            ):

                source_ip = log.get(
                    "source_ip"
                )

                failed_counts[source_ip] += 1

        alerts = []

        for ip, count in failed_counts.items():

            if count >= BruteForceDetector.THRESHOLD:

                alerts.append(
                    {
                        "alert_type":
                            "Brute Force",

                        "severity":
                            "High",

                        "source_ip":
                            ip,

                        "failed_attempts":
                            count,

                        "description":
                            "Possible brute force attack detected"
                    }
                )

        return alerts