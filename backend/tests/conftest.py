"""
Shared test setup.

API tests use an in-memory MongoDB (mongomock-motor), so they never read or
change your real database. The settings below are set before the app is
imported; real environment variables win over backend/.env, so these
fake values are used even if you have a .env file.
"""

import os
import sys

import pytest

os.environ.update(
    MONGODB_URL="mongodb://in-memory-for-tests",
    DATABASE_NAME="threateye_tests",
    JWT_SECRET_KEY="test-only-secret-key-not-used-anywhere-else",
    JWT_ALGORITHM="HS256",
    ACCESS_TOKEN_EXPIRE_MINUTES="30",
    REFRESH_TOKEN_EXPIRE_DAYS="30",
)


@pytest.fixture
def client():
    mongomock_motor = pytest.importorskip("mongomock_motor", reason="pip install -r requirements-dev.txt")
    from fastapi.testclient import TestClient

    import app.database.mongodb  # noqa: F401
    import app.main as main

    db_module = sys.modules["app.database.mongodb"]

    async def connect_in_memory():
        db_module.mongodb.client = mongomock_motor.AsyncMongoMockClient()
        db_module.mongodb.database = db_module.mongodb.client["threateye_tests"]

    original = main.connect_to_mongo
    main.connect_to_mongo = connect_in_memory
    try:
        with TestClient(main.app) as test_client:
            yield test_client
    finally:
        main.connect_to_mongo = original


def sign_up(client, email="analyst@example.com", password="password123", name="Analyst"):
    client.post("/api/v1/auth/register", json={"username": name, "email": email, "password": password})
    tokens = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/129.0"},
    ).json()
    return tokens, {"Authorization": f"Bearer {tokens['access_token']}"}
