import pytest
from pydantic import ValidationError

from app.schemas.auth import UserLogin, UserRegister


def test_valid_registration_is_cleaned():
    user = UserRegister(username="  Shailesh ", email="Me@Example.COM", password="longenough")
    assert user.username == "Shailesh"
    assert user.email == "me@example.com"


@pytest.mark.parametrize(
    "fields",
    [
        {"username": "a", "email": "a@example.com", "password": "longenough"},
        {"username": "ab", "email": "not-an-email", "password": "longenough"},
        {"username": "ab", "email": "a@example.com", "password": "short"},
    ],
)
def test_invalid_registration_is_rejected(fields):
    with pytest.raises(ValidationError):
        UserRegister(**fields)


def test_login_email_is_case_insensitive():
    assert UserLogin(email="Me@Example.com", password="x").email == "me@example.com"
