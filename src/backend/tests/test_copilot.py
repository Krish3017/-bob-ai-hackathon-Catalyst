"""
Tests for the NaviOps Bob Copilot endpoint (Phase 2).

These tests verify:
- Auth is enforced on Copilot endpoints
- Empty message is rejected with 422
- Copilot status endpoint returns expected shape
- A valid request with no GROQ_API_KEY configured returns 503 (not 500)
- Existing routes remain unaffected
"""
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import create_access_token

client = TestClient(app)


def _admin_headers():
    token = create_access_token({
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "admin@naviops.port",
        "role": "admin",
    })
    return {"Authorization": f"Bearer {token}"}


def _viewer_headers():
    token = create_access_token({
        "sub": "33333333-3333-3333-3333-333333333333",
        "email": "executive@naviops.port",
        "role": "viewer",
    })
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Auth enforcement
# ---------------------------------------------------------------------------

def test_copilot_chat_requires_auth():
    res = client.post("/api/copilot/chat", json={"message": "hello"})
    assert res.status_code == 401


def test_copilot_status_requires_auth():
    res = client.get("/api/copilot/status")
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

def test_copilot_chat_rejects_empty_message():
    """Empty string should be caught by Pydantic min_length=1 → 422."""
    res = client.post(
        "/api/copilot/chat",
        json={"message": ""},
        headers=_admin_headers(),
    )
    assert res.status_code == 422


def test_copilot_chat_rejects_missing_message():
    """Missing required field should return 422."""
    res = client.post(
        "/api/copilot/chat",
        json={},
        headers=_admin_headers(),
    )
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# Status endpoint
# ---------------------------------------------------------------------------

def test_copilot_status_shape():
    res = client.get("/api/copilot/status", headers=_admin_headers())
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data
    assert "status" in data
    assert data["status"] in ("ready", "unconfigured")
    assert "model" in data
    assert "phase" in data
    assert data["phase"] in ("2", "3")


# ---------------------------------------------------------------------------
# Unconfigured key → 503 (not crash)
# ---------------------------------------------------------------------------

def test_copilot_chat_without_api_key_returns_503(monkeypatch):
    """
    When GROQ_API_KEY is empty, the endpoint must return 503 with a safe
    user-facing message — not a 500 crash or Python traceback.
    """
    from app.core import config as cfg
    monkeypatch.setattr(cfg.settings, "GROQ_API_KEY", "")

    # Reset cached client so the missing-key path is exercised
    from app.services.groq_service import copilot_service
    copilot_service._client = None

    res = client.post(
        "/api/copilot/chat",
        json={"message": "What is the current congestion level?"},
        headers=_admin_headers(),
    )
    assert res.status_code == 503
    body = res.json()
    # Must not expose key material or Python internals
    assert "GROQ_API_KEY" not in body.get("detail", "")
    assert "administrator" in body.get("detail", "").lower() or "unavailable" in body.get("detail", "").lower()


# ---------------------------------------------------------------------------
# All roles can access Copilot (read-only feature)
# ---------------------------------------------------------------------------

def test_copilot_status_accessible_to_viewer():
    """Viewer role must be able to call copilot/status."""
    res = client.get("/api/copilot/status", headers=_viewer_headers())
    assert res.status_code == 200


# ---------------------------------------------------------------------------
# Existing routes remain unaffected
# ---------------------------------------------------------------------------

def test_existing_dashboard_still_works():
    res = client.get("/api/dashboard/summary", headers=_admin_headers())
    assert res.status_code == 200
    assert "congestion" in res.json()


def test_existing_vessels_still_works():
    res = client.get("/api/vessels", headers=_admin_headers())
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_existing_auth_still_works():
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@naviops.port", "password": "admin123"},
    )
    assert res.status_code == 200
    assert "token" in res.json()
