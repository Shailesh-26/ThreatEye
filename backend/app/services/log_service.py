import pandas as pd
from bson import ObjectId

from app.database.mongodb import mongodb


class LogService:

    REQUIRED_COLUMNS = [
        "timestamp",
        "source_ip",
        "event_type"
    ]

    @staticmethod
    async def process_csv(file):

        dataframe = pd.read_csv(file.file)

        missing_columns = [
            column
            for column in LogService.REQUIRED_COLUMNS
            if column not in dataframe.columns
        ]

        if missing_columns:
            raise ValueError(
                f"Missing required columns: {missing_columns}"
            )

        records = []

        for _, row in dataframe.iterrows():

            row_dict = row.to_dict()

            document = {
    "timestamp": row_dict.get("timestamp"),
    "source_ip": row_dict.get("source_ip"),
    "event_type": row_dict.get("event_type"),
    "status": row_dict.get("status"),
    "raw_data": row_dict
}

            records.append(document)

        if records:
            result = await mongodb.database.logs.insert_many(
                records
            )

            return len(result.inserted_ids)

        return 0

    @staticmethod
    async def get_logs():

        logs = []

        cursor = mongodb.database.logs.find()

        async for log in cursor:

            log["_id"] = str(log["_id"])

            logs.append(log)

        return logs

    @staticmethod
    async def get_log_by_id(log_id: str):

        log = await mongodb.database.logs.find_one(
            {"_id": ObjectId(log_id)}
        )

        if not log:
            return None

        log["_id"] = str(log["_id"])

        return log