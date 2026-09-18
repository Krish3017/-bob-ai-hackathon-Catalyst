import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import port_repo, _load_users_sqlite
from app.core.auth import create_access_token

client = TestClient(app)


def admin_headers():
    token = create_access_token({
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "admin@naviops.port",
        "role": "admin",
        "name": "Capt. Michael Vance",
        "department": "Port Authority Executive"
    })
    return {"Authorization": f"Bearer {token}"}


def ops_headers():
    token = create_access_token({
        "sub": "22222222-2222-2222-2222-222222222222",
        "email": "ops@naviops.port",
        "role": "operations",
        "name": "Elena Rostova",
        "department": "Quayside Operations Control"
    })
    return {"Authorization": f"Bearer {token}"}


def test_public_signup_is_disabled():
    """Requirement 1: Public signup must return 403 Forbidden."""
    res = client.post("/api/auth/signup", json={
        "full_name": "Test User",
        "email": "testsignup@naviops.port",
        "password": "password123",
        "department": "Quayside Operations"
    })
    assert res.status_code == 403
    assert "Public registration is disabled" in res.json()["detail"]


def test_login_requires_credentials_and_returns_database_role():
    """Requirement 3, 4, 6: Login strictly requires email & password, returns DB role without client role selection."""
    res = client.post("/api/auth/login", json={
        "email": "ops@naviops.port",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["role"] == "operations"
    assert data["user"]["email"] == "ops@naviops.port"


def test_login_fails_with_wrong_password():
    res = client.post("/api/auth/login", json={
        "email": "admin@naviops.port",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_non_admin_cannot_create_users():
    """Requirement 5: Only authorized administrator can create users."""
    res = client.post("/api/auth/users", headers=ops_headers(), json={
        "full_name": "Unauthorized User",
        "email": "unauth@naviops.port",
        "password": "password123",
        "role": "operations",
        "department": "Quayside Operations"
    })
    assert res.status_code == 403


def test_admin_creates_user_and_persists_to_database():
    """Requirements 5, 7, 8: Admin creates user with assigned role, persisted in DB, appears in list and can log in."""
    unique_id = uuid.uuid4().hex[:8]
    new_email = f"planner.{unique_id}@naviops.port"
    res = client.post("/api/auth/users", headers=admin_headers(), json={
        "full_name": "Marcus Kane",
        "email": new_email,
        "password": "plannerpassword123",
        "role": "operations",
        "department": "Berth Planning"
    })
    assert res.status_code == 201
    user_created = res.json()
    assert user_created["email"] == new_email
    assert user_created["role"] == "operations"
    user_id = user_created["id"]

    # Verify user is in users list from API
    list_res = client.get("/api/auth/users", headers=admin_headers())
    assert list_res.status_code == 200
    all_users = list_res.json()
    matched = [u for u in all_users if u["email"] == new_email]
    assert len(matched) == 1
    assert matched[0]["role"] == "operations"

    # Verify user is persisted in SQLite database
    sqlite_users = _load_users_sqlite()
    sqlite_matched = [u for u in sqlite_users if u["email"] == new_email]
    assert len(sqlite_matched) == 1
    assert sqlite_matched[0]["role"] == "operations"

    # Verify the newly created user can log in with their email and password
    login_res = client.post("/api/auth/login", json={
        "email": new_email,
        "password": "plannerpassword123"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["user"]["role"] == "operations"
    assert login_data["user"]["id"] == user_id


def test_duplicate_email_rejected():
    """Validation: Creating a user with existing email returns 400 Bad Request."""
    res = client.post("/api/auth/users", headers=admin_headers(), json={
        "full_name": "Duplicate Admin",
        "email": "admin@naviops.port",
        "password": "password123",
        "role": "admin"
    })
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"]


def test_admin_updates_user_role():
    """Admin updates role and it persists to database."""
    unique_id = uuid.uuid4().hex[:8]
    target_email = f"rolechange.{unique_id}@naviops.port"
    create_res = client.post("/api/auth/users", headers=admin_headers(), json={
        "full_name": "Alex Mercer",
        "email": target_email,
        "password": "password123",
        "role": "viewer"
    })
    assert create_res.status_code == 201
    user_id = create_res.json()["id"]

    # Promote to operations
    update_res = client.put(f"/api/auth/users/{user_id}/role", headers=admin_headers(), json={
        "role": "operations"
    })
    assert update_res.status_code == 200
    assert update_res.json()["role"] == "operations"

    # Verify SQLite database reflects updated role
    sqlite_users = _load_users_sqlite()
    sqlite_matched = [u for u in sqlite_users if u["id"] == user_id]
    assert len(sqlite_matched) == 1
    assert sqlite_matched[0]["role"] == "operations"
