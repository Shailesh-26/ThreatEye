from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.log_service import LogService

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.post("/upload")
async def upload_logs(file: UploadFile = File(...)):
    return await LogService.process_csv(file)


@router.get("/")
async def get_logs():
    return await LogService.get_logs()