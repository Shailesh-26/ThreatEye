from bson import ObjectId

from app.database.mongodb import mongodb


class AlertService:

    @staticmethod
    async def get_alerts():

        alerts = []

        cursor = mongodb.database.alerts.find()

        async for alert in cursor:

            alert["_id"] = str(alert["_id"])

            alerts.append(alert)

        return alerts

    @staticmethod
    async def get_alert_by_id(alert_id: str):

        alert = await mongodb.database.alerts.find_one(
            {"_id": ObjectId(alert_id)}
        )

        if not alert:
            return None

        alert["_id"] = str(alert["_id"])

        return alert

    @staticmethod
    async def reset_alerts():

        result = await mongodb.database.alerts.delete_many({})

        return result.deleted_count