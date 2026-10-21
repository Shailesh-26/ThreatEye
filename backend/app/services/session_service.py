"""
Sessions = refresh tokens stored in MongoDB (one per sign-in on a device).
Used by the profile page: list them, sign one out, or sign out all others.
"""

from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from app.core.security import hash_password, hash_refresh_token, verify_password
from app.database.mongodb import mongodb


def _now():
    return datetime.now(timezone.utc)


def _aware(value):
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _iso(value):
    value = _aware(value)
    return value.isoformat() if value else None


def describe_device(user_agent: str | None) -> str:
    """'Chrome on Windows' from a browser's User-Agent header (best effort)."""
    if not user_agent:
        return "Unknown device"
    ua = user_agent.lower()
    browser = next(
        (name for key, name in [
            ("edg/", "Edge"), ("opr/", "Opera"), ("brave", "Brave"), ("chrome/", "Chrome"),
            ("firefox/", "Firefox"), ("safari/", "Safari"), ("python", "Python script"),
            ("curl", "curl"), ("postman", "Postman"),
        ] if key in ua),
        "Browser",
    )
    system = next(
        (name for key, name in [
            ("windows", "Windows"), ("android", "Android"), ("iphone", "iPhone"),
            ("ipad", "iPad"), ("mac os", "macOS"), ("linux", "Linux"),
        ] if key in ua),
        None,
    )
    return f"{browser} on {system}" if system else browser


class SessionService:

    @staticmethod
    async def list_sessions(user_id: str, current_refresh_token: str | None):
        current_hash = hash_refresh_token(current_refresh_token) if current_refresh_token else None
        cursor = mongodb.database.refresh_tokens.find({"user_id": user_id, "revoked": False})
        sessions = []
        async for token in cursor:
            if _aware(token["expires_at"]) < _now():
                continue
            sessions.append({
                "id": str(token["_id"]),
                "device": describe_device(token.get("user_agent")),
                "ip_address": token.get("ip_address"),
                "created_at": _iso(token.get("created_at")),
                "last_used_at": _iso(token.get("last_used_at")),
                "expires_at": _iso(token.get("expires_at")),
                "current": token["token_hash"] == current_hash,
            })
        sessions.sort(key=lambda s: (not s["current"], s["last_used_at"] or ""), reverse=False)
        return sessions

    @staticmethod
    async def revoke(user_id: str, session_id: str):
        try:
            oid = ObjectId(session_id)
        except InvalidId:
            raise ValueError("Session not found")
        result = await mongodb.database.refresh_tokens.update_one(
            {"_id": oid, "user_id": user_id, "revoked": False},
            {"$set": {"revoked": True, "revoked_at": _now()}},
        )
        if result.modified_count == 0:
            raise ValueError("Session not found")
        return {"revoked": 1}

    @staticmethod
    async def revoke_others(user_id: str, keep_refresh_token: str | None):
        query = {"user_id": user_id, "revoked": False}
        if keep_refresh_token:
            query["token_hash"] = {"$ne": hash_refresh_token(keep_refresh_token)}
        result = await mongodb.database.refresh_tokens.update_many(
            query, {"$set": {"revoked": True, "revoked_at": _now()}}
        )
        return {"revoked": result.modified_count}

    @staticmethod
    async def update_profile(user, username: str):
        await mongodb.database.users.update_one({"_id": user["_id"]}, {"$set": {"username": username}})
        return {"username": username, "email": user["email"], "created_at": _iso(user.get("created_at"))}

    @staticmethod
    async def change_password(user, current_password, new_password, keep_refresh_token):
        if not verify_password(current_password, user["password"]):
            raise ValueError("Your current password is not correct")
        if verify_password(new_password, user["password"]):
            raise ValueError("The new password must be different from the current one")
        await mongodb.database.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": hash_password(new_password), "password_changed_at": _now()}},
        )
        revoked = await SessionService.revoke_others(str(user["_id"]), keep_refresh_token)
        return {"message": "Password changed", "signed_out_sessions": revoked["revoked"]}
