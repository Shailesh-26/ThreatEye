from fastapi import APIRouter, Depends, File, UploadFile

from app.core.dependencies import get_current_user
from app.services.log_service import LogService

# dependencies=[...] makes every route in this file require a valid login token.
router = APIRouter(
    prefix="/logs",
    tags=["Logs"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/upload")
async def upload_logs(file: UploadFile = File(...)):
    return await LogService.process_csv(file)


@router.get("/")
async def get_logs():
    return await LogService.get_logs()


@router.get("/samples")
async def list_samples():
    return LogService.list_samples()


@router.post("/samples/{name}")
async def load_sample(name: str):
    return await LogService.load_sample(name)
