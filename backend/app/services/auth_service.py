from app.database.mongodb import mongodb
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


class AuthService:

    @staticmethod
    async def register_user(user_data: dict):

        users_collection = mongodb.database.users

        existing_user = await users_collection.find_one(
            {"email": user_data["email"]}
        )

        if existing_user:
            raise ValueError(
                "Email already registered"
            )

        user_document = {
            "username": user_data["username"],
            "email": user_data["email"],
            "password": hash_password(
                user_data["password"]
            )
        }

        await users_collection.insert_one(
            user_document
        )

        return {
            "username": user_document["username"],
            "email": user_document["email"]
        }

    @staticmethod
    async def login_user(
        email: str,
        password: str
    ):

        users_collection = mongodb.database.users

        user = await users_collection.find_one(
            {"email": email}
        )

        if not user:
            raise ValueError(
                "Invalid credentials"
            )

        if not verify_password(
            password,
            user["password"]
        ):
            raise ValueError(
                "Invalid credentials"
            )

        token = create_access_token(
            {
                "sub": str(user["_id"]),
                "email": user["email"]
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer"
        }