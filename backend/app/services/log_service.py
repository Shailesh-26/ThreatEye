import pandas as pd
from fastapi import UploadFile,HTTPException
from app.database.mongodb import mongodb as db
from app.detection.detection_engine import DetectionEngine
from app.services.alert_service import AlertService

class LogService:

    @staticmethod
    async def process_csv(file:UploadFile):

        try:

            dataframe=pd.read_csv(file.file)

            required=[
                "timestamp",
                "source_ip",
                "event_type",
                "status"
            ]

            for column in required:
                if column not in dataframe.columns:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Missing column: {column}"
                    )

            logs=dataframe.to_dict("records")

            await db.database.logs.delete_many({})

            if logs:
                await db.database.logs.insert_many(logs)

            alerts=DetectionEngine.run(logs)
            return{
                "message":"Logs uploaded successfully",
                "count":len(logs),
                "alerts":len(alerts)
            }

        except Exception as e:

            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    @staticmethod
    async def get_logs():

        logs=await db.database.logs.find({},{"_id":0}).to_list(500)

        return logs