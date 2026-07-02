from app.database.mongodb import mongodb

from app.detection.brute_force import (
    BruteForceDetector
)


class DetectionService:

    @staticmethod
    async def run_brute_force_detection():

        logs = []

        cursor = mongodb.database.logs.find()

        async for log in cursor:
            logs.append(log)

        alerts = (
            BruteForceDetector.detect(
                logs
            )
        )

        if alerts:

            result = await mongodb.database.alerts.insert_many(
                alerts
            )

            for alert, inserted_id in zip(
                alerts,
                result.inserted_ids
            ):
                alert["_id"] = str(inserted_id)

        return alerts