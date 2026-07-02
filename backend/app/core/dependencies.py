from jose import JWTError, jwt

from fastapi import Depends, HTTPException, status

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.database.mongodb import mongodb

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )

        email = payload.get("email")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = await mongodb.database.users.find_one(
        {"email": email}
    )

    if user is None:
        raise credentials_exception

    return user