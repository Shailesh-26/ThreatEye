from pydantic import BaseModel


class LogUploadResponse(BaseModel):
    message: str
    records_inserted: int