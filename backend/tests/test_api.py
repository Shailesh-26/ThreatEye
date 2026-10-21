"""End-to-end API tests: real routes, in-memory database."""

from tests.conftest import sign_up

API = "/api/v1"


def test_data_routes_need_a_login(client):
    for method, path in [("get", "/logs/"), ("get", "/alerts/"), ("get", "/dashboard"),
                         ("get", "/detections/rules"), ("get", "/logs/samples"), ("get", "/auth/sessions")]:
        assert getattr(client, method)(API + path).status_code == 401, path


def test_sign_up_sign_in_and_profile(client):
    tokens, auth = sign_up(client, email="Mixed@Example.com")
    assert "access_token" in tokens
    me = client.get(f"{API}/auth/me", headers=auth).json()
    assert me["email"] == "mixed@example.com"
    assert me["created_at"] is not None

    updated = client.patch(f"{API}/auth/me", json={"username": "  Shailesh  "}, headers=auth).json()
    assert updated["username"] == "Shailesh"
    assert client.get(f"{API}/auth/me", headers=auth).json()["username"] == "Shailesh"


def test_wrong_password_is_rejected(client):
    sign_up(client)
    response = client.post(f"{API}/auth/login", json={"email": "analyst@example.com", "password": "nope-nope"})
    assert response.status_code == 401


def test_sessions_list_marks_this_device(client):
    tokens, auth = sign_up(client)
    sessions = client.get(f"{API}/auth/sessions", headers={**auth, "X-Refresh-Token": tokens["refresh_token"]}).json()
    assert len(sessions) == 1
    assert sessions[0]["current"] is True
    assert sessions[0]["device"] == "Chrome on Windows"


def test_sign_out_other_sessions_keeps_this_one(client):
    first, auth = sign_up(client)
    second = client.post(f"{API}/auth/login", json={"email": "analyst@example.com", "password": "password123"}).json()

    result = client.post(f"{API}/auth/sessions/revoke-others", json={"refresh_token": first["refresh_token"]}, headers=auth).json()
    assert result["revoked"] == 1
    assert client.post(f"{API}/auth/refresh", json={"refresh_token": second["refresh_token"]}).status_code == 401
    assert client.post(f"{API}/auth/refresh", json={"refresh_token": first["refresh_token"]}).status_code == 200


def test_revoke_one_session(client):
    tokens, auth = sign_up(client)
    other = client.post(f"{API}/auth/login", json={"email": "analyst@example.com", "password": "password123"}).json()
    sessions = client.get(f"{API}/auth/sessions", headers={**auth, "X-Refresh-Token": tokens["refresh_token"]}).json()
    target = next(s for s in sessions if not s["current"])
    assert client.delete(f"{API}/auth/sessions/{target['id']}", headers=auth).status_code == 200
    assert client.post(f"{API}/auth/refresh", json={"refresh_token": other["refresh_token"]}).status_code == 401
    assert client.delete(f"{API}/auth/sessions/not-an-id", headers=auth).status_code == 404


def test_change_password(client):
    tokens, auth = sign_up(client)
    other = client.post(f"{API}/auth/login", json={"email": "analyst@example.com", "password": "password123"}).json()

    wrong = client.post(f"{API}/auth/change-password", json={"current_password": "bad-password", "new_password": "newpassword1"}, headers=auth)
    assert wrong.status_code == 400

    ok = client.post(
        f"{API}/auth/change-password",
        json={"current_password": "password123", "new_password": "newpassword1", "refresh_token": tokens["refresh_token"]},
        headers=auth,
    ).json()
    assert ok["signed_out_sessions"] == 1
    assert client.post(f"{API}/auth/refresh", json={"refresh_token": other["refresh_token"]}).status_code == 401
    assert client.post(f"{API}/auth/login", json={"email": "analyst@example.com", "password": "password123"}).status_code == 401
    assert client.post(f"{API}/auth/login", json={"email": "analyst@example.com", "password": "newpassword1"}).status_code == 200


def test_load_sample_and_see_alerts(client):
    _, auth = sign_up(client)
    loaded = client.post(f"{API}/logs/samples/05_mixed_soc_day.csv", headers=auth).json()
    assert loaded["count"] == 134 and loaded["alerts"] == 5
    alerts = client.get(f"{API}/alerts/", headers=auth).json()
    assert [a["id"] for a in alerts] == [f"THREAT-00{i}" for i in range(1, 6)]
    assert client.get(f"{API}/dashboard", headers=auth).json()["total_alerts"] == 5


def test_sample_names_cannot_escape_the_datasets_folder(client):
    _, auth = sign_up(client)
    for name in ["../README.md", "..%2Fbackend%2F.env", "nope.csv"]:
        assert client.post(f"{API}/logs/samples/{name}", headers=auth).status_code == 404


def test_broken_upload_keeps_existing_logs(client):
    _, auth = sign_up(client)
    client.post(f"{API}/logs/samples/05_mixed_soc_day.csv", headers=auth)
    bad = client.post(f"{API}/logs/samples/99_invalid_missing_column.csv", headers=auth)
    assert bad.status_code == 400
    assert len(client.get(f"{API}/logs/", headers=auth).json()) == 134
