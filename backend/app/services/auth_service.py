from datetime import datetime, timedelta, timezone

from bson import ObjectId
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password
)
from app.database.mongodb import mongodb


class AuthService:

    @staticmethod
    async def register_user(
        user_data: dict
    ):

        users_collection = mongodb.database.users

        existing_user = await users_collection.find_one(
            {
                "email": user_data["email"]
            }
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

        refresh_tokens_collection = (
            mongodb.database.refresh_tokens
        )

        user = await users_collection.find_one(
            {
                "email": email
            }
        )

        if user is None:
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

        access_token = create_access_token(
            {
                "sub": str(user["_id"]),
                "email": user["email"]
            }
        )

        refresh_token = create_refresh_token()

        refresh_document = {
            "user_id": str(user["_id"]),
            "token_hash": hash_refresh_token(
                refresh_token
            ),
            "created_at": datetime.now(
                timezone.utc
            ),
            "expires_at": datetime.now(
                timezone.utc
            ) + timedelta(
                days=settings.refresh_token_expire_days
            ),
            "revoked": False,
            "revoked_at": None,
            "last_used_at": datetime.now(
                timezone.utc
            ),
            "device_name": None,
            "ip_address": None,
            "user_agent": None
        }

        await refresh_tokens_collection.insert_one(
            refresh_document
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": (
                settings.access_token_expire_minutes
                * 60
            )
        }

    @staticmethod
    async def refresh_session(
        refresh_token: str
    ):

        refresh_tokens_collection = (
            mongodb.database.refresh_tokens
        )

        token_hash = hash_refresh_token(
            refresh_token
        )

        stored_token = await refresh_tokens_collection.find_one(
            {
                "token_hash": token_hash
            }
        )

        if stored_token is None:
            raise ValueError(
                "Invalid refresh token"
            )

        if stored_token["revoked"]:
            raise ValueError(
                "Refresh token has been revoked"
            )

        expires_at = stored_token["expires_at"]

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if expires_at < datetime.now(
            timezone.utc
        ):
            raise ValueError(
                "Refresh token expired"
            )

        users_collection = (
            mongodb.database.users
        )

        user = await users_collection.find_one(
            {
                "_id": ObjectId(
                    stored_token["user_id"]
                )
            }
        )

        if user is None:
            raise ValueError(
                "User not found"
            )

        new_access_token = create_access_token(
            {
                "sub": str(user["_id"]),
                "email": user["email"]
            }
        )

        new_refresh_token = create_refresh_token()

        await refresh_tokens_collection.update_one(
            {
                "_id": stored_token["_id"]
            },
            {
                "$set": {
                    "token_hash": hash_refresh_token(
                        new_refresh_token
                    ),
                    "last_used_at": datetime.now(
                        timezone.utc
                    ),
                    "expires_at": datetime.now(
                        timezone.utc
                    ) + timedelta(
                        days=settings.refresh_token_expire_days
                    )
                }
            }
        )

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": (
                settings.access_token_expire_minutes
                * 60
            )
        }

    @staticmethod
    async def logout_user(
        refresh_token: str
    ):

        refresh_tokens_collection = (
            mongodb.database.refresh_tokens
        )

        token_hash = hash_refresh_token(
            refresh_token
        )

        result = await refresh_tokens_collection.update_one(
            {
                "token_hash": token_hash,
                "revoked": False
            },
            {
                "$set": {
                    "revoked": True,
                    "revoked_at": datetime.now(
                        timezone.utc
                    )
                }
            }
        )

        if result.modified_count == 0:
            raise ValueError(
                "Invalid refresh token"
            )

        return {
            "message": "Logged out successfully"
        }