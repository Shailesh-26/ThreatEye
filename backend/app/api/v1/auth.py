from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from app.core.dependencies import get_current_user
from app.schemas.auth import (
    PasswordChange,
    ProfileUpdate,
    RefreshTokenBody,
    UserLogin,
    UserRegister,
)
from app.services.auth_service import AuthService
from app.services.session_service import SessionService, _iso

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _bad_request(error: ValueError, code=status.HTTP_400_BAD_REQUEST):
    return HTTPException(status_code=code, detail=str(error))


@router.post("/register")
async def register(user: UserRegister):
    try:
        return await AuthService.register_user(user.model_dump())
    except ValueError as e:
        raise _bad_request(e)


@router.post("/login")
async def login(user: UserLogin, request: Request):
    try:
        return await AuthService.login_user(
            user.email,
            user.password,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
        )
    except ValueError as e:
        raise _bad_request(e, status.HTTP_401_UNAUTHORIZED)


@router.post("/refresh")
async def refresh_session(body: RefreshTokenBody):
    try:
        return await AuthService.refresh_session(body.refresh_token)
    except ValueError as e:
        raise _bad_request(e, status.HTTP_401_UNAUTHORIZED)


@router.post("/logout")
async def logout(body: RefreshTokenBody):
    try:
        return await AuthService.logout_user(body.refresh_token)
    except ValueError as e:
        raise _bad_request(e, status.HTTP_401_UNAUTHORIZED)


# ---- Profile (all routes below need a valid access token) -----------------

@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "username": current_user["username"],
        "email": current_user["email"],
        "created_at": _iso(current_user.get("created_at")),
        "password_changed_at": _iso(current_user.get("password_changed_at")),
    }


@router.patch("/me")
async def update_me(body: ProfileUpdate, current_user=Depends(get_current_user)):
    return await SessionService.update_profile(current_user, body.username)


@router.post("/change-password")
async def change_password(body: PasswordChange, current_user=Depends(get_current_user)):
    try:
        return await SessionService.change_password(
            current_user, body.current_password, body.new_password, body.refresh_token
        )
    except ValueError as e:
        raise _bad_request(e)


@router.get("/sessions")
async def list_sessions(
    current_user=Depends(get_current_user),
    x_refresh_token: str | None = Header(default=None),
):
    """The browser sends its refresh token in X-Refresh-Token so its own session can be marked."""
    return await SessionService.list_sessions(str(current_user["_id"]), x_refresh_token)


@router.delete("/sessions/{session_id}")
async def revoke_session(session_id: str, current_user=Depends(get_current_user)):
    try:
        return await SessionService.revoke(str(current_user["_id"]), session_id)
    except ValueError as e:
        raise _bad_request(e, status.HTTP_404_NOT_FOUND)


@router.post("/sessions/revoke-others")
async def revoke_other_sessions(body: RefreshTokenBody, current_user=Depends(get_current_user)):
    return await SessionService.revoke_others(str(current_user["_id"]), body.refresh_token)
