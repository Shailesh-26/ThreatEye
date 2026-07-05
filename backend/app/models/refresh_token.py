from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


class RefreshToken(BaseModel):
    user_id: str

    token_hash: str

    expires_at: datetime

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    revoked: bool = False

    revoked_at: Optional[datetime] = None

    device_name: Optional[str] = None

    ip_address: Optional[str] = None

    user_agent: Optional[str] = None

    last_used_at: Optional[datetime] = None