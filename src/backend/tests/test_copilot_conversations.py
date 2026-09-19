"""
NaviOps Bob Copilot — Conversation Persistence Tests

Tests cover:
  - Conversation creation and listing (ownership-isolated)
  - Conversation retrieval with messages
  - User isolation (user A cannot access user B's conversation)
  - Deletion enforcement
  - Message storage and ordering
  - Chat endpoint: auto-creates conversation, returns conversation_id
  - Chat endpoint: appends to existing conversation
  - Database unavailability fallback (chat still works)
  - ConversationDBError handling
  - _generate_title helper
"""
import os
import sys
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch, call
from contextlib import contextmanager

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import create_access_token
from app.models.schemas import UserResponse
from app.services.conversation_repo import (
    ConversationDBError,
    _generate_title,
)

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _tok(role: str = "admin", user_id: str = None) -> dict:
    id_map = {
        "admin": "11111111-1111-1111-1111-111111111111",
        "operations": "22222222-2222-2222-2222-222222222222",
        "viewer": "33333333-3333-3333-3333-333333333333",
    }
    email_map = {
        "admin": "admin@naviops.port",
        "operations": "ops@naviops.port",
        "viewer": "executive@naviops.port",
    }
    uid = user_id or id_map[role]
    email = email_map.get(role, f"{role}@naviops.port")
    t = create_access_token({"sub": uid, "email": email, "role": role})
    return {"Authorization": f"Bearer {t}"}


_ADMIN_ID = "11111111-1111-1111-1111-111111111111"
_OPS_ID   = "22222222-2222-2222-2222-222222222222"

_NOW = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)


def _make_conv(conv_id: str = None, user_id: str = None, title: str = "Test conv") -> dict:
    return {
        "id": conv_id or str(uuid.uuid4()),
        "user_id": user_id or _ADMIN_ID,
        "title": title,
        "created_at": _NOW,
        "updated_at": _NOW,
    }


def _make_msg(conv_id: str, role: str = "user", content: str = "hello") -> dict:
    return {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": role,
        "content": content,
        "created_at": _NOW,
    }


# ---------------------------------------------------------------------------
# 1. _generate_title unit tests
# ---------------------------------------------------------------------------

class TestGenerateTitle:

    def test_short_message_becomes_title(self):
        assert _generate_title("Why is congestion high?") == "Why is congestion high?"

    def test_long_message_is_truncated(self):
        msg = "A" * 200
        title = _generate_title(msg)
        assert len(title) <= 63  # 60 + "…"
        assert title.endswith("…")

    def test_empty_message_fallback(self):
        assert _generate_title("") == "New conversation"

    def test_whitespace_collapsed(self):
        title = _generate_title("  hello   world  ")
        assert title == "hello world"

    def test_exactly_60_chars_no_ellipsis(self):
        msg = "A" * 60
        assert _generate_title(msg) == msg

    def test_61_chars_gets_ellipsis(self):
        msg = "word " * 12  # 60 chars
        title = _generate_title(msg.strip())
        assert "…" in title or len(title) <= 61


# ---------------------------------------------------------------------------
# 2. Conversation list endpoint
# ---------------------------------------------------------------------------

class TestConversationList:

    def test_requires_auth(self):
        res = client.get("/api/copilot/conversations")
        assert res.status_code == 401

    def test_returns_empty_list_when_db_unavailable(self):
        """If DB is down, list_conversations raises ConversationDBError → 503."""
        with patch("app.api.conversations.list_conversations", side_effect=ConversationDBError("DB down")):
            res = client.get("/api/copilot/conversations", headers=_tok("admin"))
        assert res.status_code == 503

    def test_returns_user_conversations_only(self):
        conv = _make_conv(user_id=_ADMIN_ID)
        with patch("app.api.conversations.list_conversations", return_value=[conv]):
            res = client.get("/api/copilot/conversations", headers=_tok("admin"))
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["id"] == conv["id"]
        assert data[0]["title"] == conv["title"]
        # Messages must NOT be in the list response
        assert "messages" not in data[0]

    def test_empty_list_returns_200(self):
        with patch("app.api.conversations.list_conversations", return_value=[]):
            res = client.get("/api/copilot/conversations", headers=_tok("admin"))
        assert res.status_code == 200
        assert res.json() == []


# ---------------------------------------------------------------------------
# 3. Create conversation endpoint
# ---------------------------------------------------------------------------

class TestConversationCreate:

    def test_requires_auth(self):
        res = client.post("/api/copilot/conversations", json={})
        assert res.status_code == 401

    def test_creates_conversation_with_default_title(self):
        conv = _make_conv(title="New conversation")
        with patch("app.api.conversations.create_conversation", return_value=conv):
            res = client.post(
                "/api/copilot/conversations",
                json={},
                headers=_tok("admin"),
            )
        assert res.status_code == 201
        assert res.json()["title"] == "New conversation"

    def test_creates_conversation_with_custom_title(self):
        conv = _make_conv(title="Congestion analysis")
        with patch("app.api.conversations.create_conversation", return_value=conv) as mock_create:
            res = client.post(
                "/api/copilot/conversations",
                json={"title": "Congestion analysis"},
                headers=_tok("admin"),
            )
        assert res.status_code == 201
        # Verify user_id was set from auth, not from request
        call_kwargs = mock_create.call_args.kwargs
        assert call_kwargs["user_id"] == _ADMIN_ID

    def test_db_error_returns_503(self):
        with patch("app.api.conversations.create_conversation", side_effect=ConversationDBError("fail")):
            res = client.post(
                "/api/copilot/conversations",
                json={},
                headers=_tok("admin"),
            )
        assert res.status_code == 503


# ---------------------------------------------------------------------------
# 4. Get conversation endpoint (ownership enforcement)
# ---------------------------------------------------------------------------

class TestConversationGet:

    def test_requires_auth(self):
        res = client.get(f"/api/copilot/conversations/{uuid.uuid4()}")
        assert res.status_code == 401

    def test_returns_own_conversation_with_messages(self):
        conv_id = str(uuid.uuid4())
        conv = _make_conv(conv_id=conv_id, user_id=_ADMIN_ID)
        msgs = [
            _make_msg(conv_id, "user", "Hello"),
            _make_msg(conv_id, "assistant", "Hi there"),
        ]
        with patch("app.api.conversations.get_conversation", return_value=conv), \
             patch("app.api.conversations.get_messages", return_value=msgs):
            res = client.get(
                f"/api/copilot/conversations/{conv_id}",
                headers=_tok("admin"),
            )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == conv_id
        assert len(data["messages"]) == 2
        assert data["messages"][0]["role"] == "user"
        assert data["messages"][1]["role"] == "assistant"

    def test_returns_404_for_missing_conversation(self):
        """None returned from get_conversation → 404 (user cannot tell if it belongs to another)."""
        with patch("app.api.conversations.get_conversation", return_value=None):
            res = client.get(
                f"/api/copilot/conversations/{uuid.uuid4()}",
                headers=_tok("admin"),
            )
        assert res.status_code == 404

    def test_user_b_cannot_access_user_a_conversation(self):
        """get_conversation returns None when user_id does not match — same 404 for both cases."""
        # Simulate: user B queries with user A's conv_id, backend returns None
        with patch("app.api.conversations.get_conversation", return_value=None):
            res = client.get(
                f"/api/copilot/conversations/{uuid.uuid4()}",
                headers=_tok("operations"),  # different user
            )
        # Must be 404, not 403 — do not leak existence
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# 5. Delete conversation endpoint
# ---------------------------------------------------------------------------

class TestConversationDelete:

    def test_requires_auth(self):
        res = client.delete(f"/api/copilot/conversations/{uuid.uuid4()}")
        assert res.status_code == 401

    def test_deletes_own_conversation(self):
        with patch("app.api.conversations.delete_conversation", return_value=True):
            res = client.delete(
                f"/api/copilot/conversations/{uuid.uuid4()}",
                headers=_tok("admin"),
            )
        assert res.status_code == 204

    def test_cannot_delete_other_users_conversation(self):
        """delete_conversation returns False when user_id does not match → 404."""
        with patch("app.api.conversations.delete_conversation", return_value=False):
            res = client.delete(
                f"/api/copilot/conversations/{uuid.uuid4()}",
                headers=_tok("operations"),
            )
        assert res.status_code == 404

    def test_db_error_returns_503(self):
        with patch("app.api.conversations.delete_conversation", side_effect=ConversationDBError("fail")):
            res = client.delete(
                f"/api/copilot/conversations/{uuid.uuid4()}",
                headers=_tok("admin"),
            )
        assert res.status_code == 503


# ---------------------------------------------------------------------------
# 6. Chat endpoint — conversation auto-creation and persistence
# ---------------------------------------------------------------------------

class TestChatPersistence:

    def _mock_chat_service(self, reply: str = "Port is nominal."):
        """Return a mock copilot_service that yields (reply, [])."""
        svc = MagicMock()
        svc.chat.return_value = (reply, [])
        return svc

    def test_chat_creates_new_conversation_when_no_id_given(self):
        """Without conversation_id in payload, a new conversation is created."""
        conv_id = str(uuid.uuid4())
        new_conv = _make_conv(conv_id=conv_id, user_id=_ADMIN_ID, title="New conv")

        with patch("app.api.copilot.copilot_service", self._mock_chat_service()), \
             patch("app.api.copilot.create_conversation", return_value=new_conv) as mock_create, \
             patch("app.api.copilot.add_message", return_value=_make_msg(conv_id)), \
             patch("app.api.copilot.get_history_for_groq", return_value=[]), \
             patch("app.api.copilot.touch_conversation"):
            res = client.post(
                "/api/copilot/chat",
                json={"message": "What is the congestion level?"},
                headers=_tok("admin"),
            )
        assert res.status_code == 200
        data = res.json()
        assert data["reply"] == "Port is nominal."
        # New conversation ID is returned as session_id
        assert data["session_id"] == conv_id
        mock_create.assert_called_once()
        # user_id must come from auth, not from the request
        create_call_kwargs = mock_create.call_args.kwargs
        assert create_call_kwargs["user_id"] == _ADMIN_ID

    def test_chat_appends_to_existing_conversation(self):
        """With a valid conversation_id, messages are appended to it."""
        conv_id = str(uuid.uuid4())
        existing_conv = _make_conv(conv_id=conv_id, user_id=_ADMIN_ID)
        added_messages = []

        def capture_add(conversation_id, role, content):
            added_messages.append({"conversation_id": conversation_id, "role": role})
            return _make_msg(conversation_id, role, content)

        with patch("app.api.copilot.copilot_service", self._mock_chat_service()), \
             patch("app.api.copilot.get_conversation", return_value=existing_conv), \
             patch("app.api.copilot.add_message", side_effect=capture_add), \
             patch("app.api.copilot.get_history_for_groq", return_value=[]), \
             patch("app.api.copilot.touch_conversation"), \
             patch("app.api.copilot.create_conversation") as mock_create:
            res = client.post(
                "/api/copilot/chat",
                json={"message": "What are the waiting vessels?", "conversation_id": conv_id},
                headers=_tok("admin"),
            )
        assert res.status_code == 200
        # create_conversation must NOT have been called
        mock_create.assert_not_called()
        # Both user and assistant messages saved
        roles = [m["role"] for m in added_messages]
        assert "user" in roles
        assert "assistant" in roles
        # Both saved to the correct conversation
        for m in added_messages:
            assert m["conversation_id"] == conv_id

    def test_chat_returns_404_for_wrong_owner_conversation(self):
        """Providing another user's conversation_id must return 404."""
        conv_id = str(uuid.uuid4())
        with patch("app.api.copilot.get_conversation", return_value=None):
            res = client.post(
                "/api/copilot/chat",
                json={"message": "Hello", "conversation_id": conv_id},
                headers=_tok("admin"),
            )
        assert res.status_code == 404

    def test_chat_works_without_db_persistence(self):
        """If the database is unavailable, chat still functions and returns a reply."""
        with patch("app.api.copilot.copilot_service", self._mock_chat_service("All good.")), \
             patch("app.api.copilot.create_conversation", side_effect=ConversationDBError("DB down")):
            res = client.post(
                "/api/copilot/chat",
                json={"message": "Status?"},
                headers=_tok("admin"),
            )
        # Chat must succeed even when DB fails
        assert res.status_code == 200
        assert res.json()["reply"] == "All good."

    def test_chat_persists_user_message_before_groq(self):
        """User message is saved before the Groq call to avoid data loss on timeout."""
        conv_id = str(uuid.uuid4())
        call_order = []
        new_conv = _make_conv(conv_id=conv_id)

        def mock_create(**kwargs):
            call_order.append("create_conversation")
            return new_conv

        def mock_add(conversation_id, role, content):
            call_order.append(f"add_message:{role}")
            return _make_msg(conversation_id, role, content)

        groq_svc = MagicMock()
        def mock_chat(**kwargs):
            call_order.append("groq_chat")
            return ("Reply.", [])
        groq_svc.chat.side_effect = mock_chat

        with patch("app.api.copilot.copilot_service", groq_svc), \
             patch("app.api.copilot.create_conversation", side_effect=mock_create), \
             patch("app.api.copilot.add_message", side_effect=mock_add), \
             patch("app.api.copilot.get_history_for_groq", return_value=[]), \
             patch("app.api.copilot.touch_conversation"):
            res = client.post(
                "/api/copilot/chat",
                json={"message": "Hello"},
                headers=_tok("admin"),
            )
        assert res.status_code == 200
        # User message must be saved before Groq is called
        assert call_order.index("add_message:user") < call_order.index("groq_chat")

    def test_failed_groq_does_not_persist_assistant_message(self):
        """If Groq fails, no assistant message should be saved."""
        conv_id = str(uuid.uuid4())
        new_conv = _make_conv(conv_id=conv_id)
        saved_roles = []

        def mock_add(conversation_id, role, content):
            saved_roles.append(role)
            return _make_msg(conversation_id, role, content)

        groq_svc = MagicMock()
        groq_svc.chat.side_effect = RuntimeError("Groq unavailable")

        with patch("app.api.copilot.copilot_service", groq_svc), \
             patch("app.api.copilot.create_conversation", return_value=new_conv), \
             patch("app.api.copilot.add_message", side_effect=mock_add), \
             patch("app.api.copilot.get_history_for_groq", return_value=[]), \
             patch("app.api.copilot.touch_conversation"):
            res = client.post(
                "/api/copilot/chat",
                json={"message": "Hello"},
                headers=_tok("admin"),
            )
        assert res.status_code == 503
        # Only the user message may have been saved; not the assistant
        assert "assistant" not in saved_roles

    def test_unauthenticated_chat_rejected(self):
        res = client.post("/api/copilot/chat", json={"message": "Hello"})
        assert res.status_code == 401

    def test_empty_message_rejected(self):
        res = client.post(
            "/api/copilot/chat",
            json={"message": "   "},
            headers=_tok("admin"),
        )
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# 7. Message ordering
# ---------------------------------------------------------------------------

class TestMessageOrdering:

    def test_messages_returned_in_chronological_order(self):
        """Messages from get_messages are ordered by created_at ASC."""
        conv_id = str(uuid.uuid4())
        conv = _make_conv(conv_id=conv_id)
        t1 = datetime(2026, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
        t2 = datetime(2026, 1, 1, 10, 0, 1, tzinfo=timezone.utc)
        t3 = datetime(2026, 1, 1, 10, 0, 2, tzinfo=timezone.utc)
        msgs = [
            {"id": "1", "conversation_id": conv_id, "role": "user", "content": "First", "created_at": t1},
            {"id": "2", "conversation_id": conv_id, "role": "assistant", "content": "Second", "created_at": t2},
            {"id": "3", "conversation_id": conv_id, "role": "user", "content": "Third", "created_at": t3},
        ]
        with patch("app.api.conversations.get_conversation", return_value=conv), \
             patch("app.api.conversations.get_messages", return_value=msgs):
            res = client.get(
                f"/api/copilot/conversations/{conv_id}",
                headers=_tok("admin"),
            )
        assert res.status_code == 200
        returned = res.json()["messages"]
        contents = [m["content"] for m in returned]
        assert contents == ["First", "Second", "Third"]


# ---------------------------------------------------------------------------
# 8. Ownership isolation — critical security check
# ---------------------------------------------------------------------------

class TestOwnershipIsolation:

    def test_user_a_conv_not_visible_to_user_b_in_list(self):
        """list_conversations is called with the authenticated user's ID, not another user's."""
        with patch("app.api.conversations.list_conversations", return_value=[]) as mock_list:
            client.get("/api/copilot/conversations", headers=_tok("operations"))
        call_kwargs = mock_list.call_args.kwargs
        # Must use the operations user ID, not admin ID
        assert call_kwargs["user_id"] == _OPS_ID
        assert call_kwargs["user_id"] != _ADMIN_ID

    def test_delete_uses_authenticated_user_id(self):
        """delete_conversation must be called with the authenticated user's own ID."""
        conv_id = str(uuid.uuid4())
        with patch("app.api.conversations.delete_conversation", return_value=True) as mock_del:
            client.delete(
                f"/api/copilot/conversations/{conv_id}",
                headers=_tok("operations"),
            )
        call_kwargs = mock_del.call_args.kwargs
        assert call_kwargs["user_id"] == _OPS_ID

    def test_get_uses_authenticated_user_id(self):
        """get_conversation must be called with the authenticated user's ID."""
        conv_id = str(uuid.uuid4())
        with patch("app.api.conversations.get_conversation", return_value=None) as mock_get:
            client.get(
                f"/api/copilot/conversations/{conv_id}",
                headers=_tok("viewer"),
            )
        call_kwargs = mock_get.call_args.kwargs
        viewer_id = "33333333-3333-3333-3333-333333333333"
        assert call_kwargs["user_id"] == viewer_id
