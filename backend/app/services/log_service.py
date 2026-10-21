from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.database.mongodb import mongodb as db
from app.detection.detection_engine import DetectionEngine
from app.services.log_parser import LogParseError, clean_value, parse_logs

# The repository's datasets/ folder (backend/app/services -> repo root).
DATASETS_DIR = Path(__file__).resolve().parents[3] / "datasets"
SAMPLE_SUFFIXES = {".csv", ".json", ".xlsx", ".txt"}
MAX_LOGS_RETURNED = 2000


async def _replace_dataset(logs, skipped, source):
    # Run detection BEFORE touching the database, so a detector error
    # can never leave you with half-replaced data.
    alerts = DetectionEngine.run([dict(log) for log in logs])

    # Each upload REPLACES the current dataset (one investigation at a time).
    await db.database.logs.delete_many({})
    await db.database.logs.insert_many([dict(log) for log in logs])

    return {
        "message": "Logs uploaded successfully",
        "source": source,
        "count": len(logs),
        "skipped_rows": skipped,
        "alerts": len(alerts),
    }


class LogService:

    @staticmethod
    async def process_csv(file: UploadFile):
        try:
            logs, skipped = parse_logs(file.filename, file.file)
        except LogParseError as error:
            raise HTTPException(status_code=400, detail=str(error))
        return await _replace_dataset(logs, skipped, file.filename)

    @staticmethod
    def list_samples():
        """Sample files in datasets/ that can be loaded with one click."""
        if not DATASETS_DIR.is_dir():
            return []
        return [
            {"name": path.name, "size": path.stat().st_size}
            for path in sorted(DATASETS_DIR.iterdir())
            if path.suffix.lower() in SAMPLE_SUFFIXES
        ]

    @staticmethod
    async def load_sample(name: str):
        # Only names that appear in the listing are allowed, so a request
        # like "../backend/.env" can never read another file.
        allowed = {sample["name"] for sample in LogService.list_samples()}
        if name not in allowed:
            raise HTTPException(status_code=404, detail=f"No sample dataset called {name}.")

        path = DATASETS_DIR / name
        try:
            with path.open("rb") as handle:
                logs, skipped = parse_logs(path.name, handle)
        except LogParseError as error:
            raise HTTPException(status_code=400, detail=str(error))
        return await _replace_dataset(logs, skipped, name)

    @staticmethod
    async def get_logs():
        logs = await db.database.logs.find({}, {"_id": 0}).to_list(length=MAX_LOGS_RETURNED)
        # Data saved by older versions may still contain NaN, which JSON can't send.
        return [{key: clean_value(value) for key, value in log.items()} for log in logs]
