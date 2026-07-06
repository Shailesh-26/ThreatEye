import pandas as pd
from fastapi import UploadFile, HTTPException

from app.database.mongodb import mongodb as db
from app.detection.detection_engine import DetectionEngine


class LogService:

    @staticmethod
    async def process_csv(file: UploadFile):
        try:
                        # Read uploaded file
            filename = file.filename.lower()

            if filename.endswith(".csv"):
                dataframe = pd.read_csv(file.file)

            elif filename.endswith(".xlsx"):
                dataframe = pd.read_excel(file.file)

            elif filename.endswith(".json"):
                dataframe = pd.read_json(file.file)

            elif filename.endswith(".txt"):
                dataframe = pd.read_csv(file.file)

            else:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported file format. Supported formats: CSV, XLSX, JSON, TXT."
                )
            # Normalize column names
            dataframe.columns = (
                dataframe.columns
                .str.strip()
                .str.lower()
            )

            # Replace NaN with None (JSON & MongoDB compatible)
            dataframe = dataframe.where(pd.notnull(dataframe), None)

            # Required columns
            required = [
                "timestamp",
                "source_ip",
                "event_type"
            ]

            for column in required:
                if column not in dataframe.columns:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Missing column: {column}"
                    )

            # Convert to list of dictionaries
            logs = dataframe.to_dict(orient="records")

            # Clear previous logs
            await db.database.logs.delete_many({})

            # Insert new logs
            if logs:
                await db.database.logs.insert_many(logs)

            # Run detection engine
            alerts = DetectionEngine.run(logs)

            return {
                "message": "Logs uploaded successfully",
                "count": len(logs),
                "alerts": len(alerts)
            }

        except HTTPException:
            raise

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    @staticmethod
    async def get_logs():
        logs = await db.database.logs.find({}, {"_id": 0}).to_list(length=500)

        # Replace any NaN values that may already exist in MongoDB
        for log in logs:
            for key, value in log.items():
                if pd.isna(value):
                    log[key] = None

        return logs