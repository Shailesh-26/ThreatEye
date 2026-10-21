from fastapi import HTTPException, UploadFile

from app.database.mongodb import mongodb as db
from app.detection.detection_engine import DetectionEngine
from app.services.log_parser import LogParseError, clean_value, parse_logs


class LogService:

    @staticmethod
    async def process_csv(file: UploadFile):
        try:
            logs, skipped = parse_logs(file.filename, file.file)
        except LogParseError as error:
            raise HTTPException(status_code=400, detail=str(error))

        # Run detection BEFORE touching the database, so a detector error
        # can never leave you with half-replaced data.
        alerts = DetectionEngine.run([dict(log) for log in logs])

        # Each upload REPLACES the current dataset (one investigation at a time).
        await db.database.logs.delete_many({})
        await db.database.logs.insert_many([dict(log) for log in logs])

        return {
            "message": "Logs uploaded successfully",
            "count": len(logs),
            "skipped_rows": skipped,
            "alerts": len(alerts),
        }

    @staticmethod
    async def get_logs():
        logs = await db.database.logs.find({}, {"_id": 0}).to_list(length=500)
        # Data saved by older versions may still contain NaN, which JSON can't send.
        return [{key: clean_value(value) for key, value in log.items()} for log in logs]
