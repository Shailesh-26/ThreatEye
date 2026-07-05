from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from pydantic import BaseModel

from app.core.dependencies import (
    get_current_user
)

from app.schemas.auth import (
    UserLogin,
    UserRegister
)

from app.services.auth_service import (
    AuthService
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


@router.post("/register")
async def register(
    user: UserRegister
):
    try:
        return await AuthService.register_user(
            user.model_dump()
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login")
async def login(
    user: UserLogin
):
    try:
        return await AuthService.login_user(
            user.email,
            user.password
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/refresh")
async def refresh_session(
    request: RefreshTokenRequest
):
    try:
        return await AuthService.refresh_session(
            request.refresh_token
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/logout")
async def logout(
    request: LogoutRequest
):
    try:
        return await AuthService.logout_user(
            request.refresh_token
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me")
async def get_me(
    current_user=Depends(
        get_current_user
    )
):
    return {
        "username": current_user["username"],
        "email": current_user["email"]
    }