from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from app.core.dependencies import (
    get_current_user
)

from app.services.log_service import (
    LogService
)

router = APIRouter(
    prefix="/logs",
    tags=["Logs"]
)


@router.post("/upload")
async def upload_logs(
    file: UploadFile = File(...),
    current_user=Depends(
        get_current_user
    )
):

    try:

        inserted_count = (
            await LogService.process_csv(file)
        )

        return {
            "message": "Logs uploaded successfully",
            "records_inserted": inserted_count
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("")
async def get_logs(
    current_user=Depends(
        get_current_user
    )
):
    return await LogService.get_logs()


@router.get("/{log_id}")
async def get_log(
    log_id: str,
    current_user=Depends(
        get_current_user
    )
):

    log = await LogService.get_log_by_id(
        log_id
    )

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Log not found"
        )

    return log