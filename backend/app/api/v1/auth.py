from fastapi import (
    APIRouter,
    HTTPException,
    Depends
)

from app.schemas.auth import (
    UserRegister,
    UserLogin
)

from app.services.auth_service import (
    AuthService
)

from app.core.dependencies import (
    get_current_user
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


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
            status_code=400,
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
            status_code=401,
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