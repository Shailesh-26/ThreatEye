from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    username: str = Field(min_length=2, max_length=40)
    email: EmailStr
    # bcrypt only uses the first 72 bytes of a password, so cap it there.
    password: str = Field(min_length=8, max_length=72)

    @field_validator("username")
    @classmethod
    def strip_username(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must be at least 2 characters")
        return value

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    username: str
    email: EmailStr


class ProfileUpdate(BaseModel):
    username: str = Field(min_length=2, max_length=40)

    @field_validator("username")
    @classmethod
    def strip_username(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must be at least 2 characters")
        return value


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)
    # The session making the change stays signed in; all others are signed out.
    refresh_token: str | None = None


class RefreshTokenBody(BaseModel):
    refresh_token: str
