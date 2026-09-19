"""
NaviOps Copilot — Conversation Repository

Handles all database reads and writes for copilot_conversations and copilot_messages.
Provides dual-backend persistence:
  1. Primary: PostgreSQL / Supabase connection (when port_repo is connected).
  2. Persistent Fallback: Local SQLite database (src/backend/data/copilot_conversations.db)
     ensures conversations and messages are 100% persistent across page refreshes,
     restarts, and offline / local development.

All writes are guarded: ownership is always verified server-side using the
authenticated user's ID.
"""
import os
import sqlite3
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.core.database import port_repo, clean_row

logger = logging.getLogger("naviops.copilot.conversations")

SQLITE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
SQLITE_PATH = os.path.join(SQLITE_DIR, "copilot_conversations.db")


class ConversationDBError(Exception):
    """Raised when a database operation on conversation tables fails."""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(val: Any) -> datetime:
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val
    if isinstance(val, str):
        try:
            dt = datetime.fromisoformat(val)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            pass
    return _now()


def _is_pg_available() -> bool:
    """Check if PostgreSQL connection via port_repo is active and working."""
    if not getattr(port_repo, "is_connected", False):
        return False
    try:
        conn = port_repo.get_connection()
        return conn is not None and not conn.closed
    except Exception:
        return False


def _pg_conn():
    """Return an active psycopg connection or raise ConversationDBError."""
    try:
        conn = port_repo.get_connection()
        if conn is None:
            raise ConversationDBError("PostgreSQL connection is not available.")
        return conn
    except Exception as exc:
        raise ConversationDBError(f"PostgreSQL connection failed: {exc}") from exc


def _init_sqlite_tables(conn: sqlite3.Connection) -> None:
    """Initialize conversation and message tables in SQLite if they do not exist."""
    with conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS copilot_conversations (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL,
                title       TEXT NOT NULL DEFAULT 'New conversation',
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user_id
                ON copilot_conversations(user_id);
            CREATE INDEX IF NOT EXISTS idx_copilot_conversations_updated_at
                ON copilot_conversations(updated_at DESC);

            CREATE TABLE IF NOT EXISTS copilot_messages (
                id              TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
                role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content         TEXT NOT NULL,
                created_at      TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation_id
                ON copilot_messages(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_copilot_messages_created_at
                ON copilot_messages(conversation_id, created_at ASC);
        """)


_sqlite_initialized = False


def _sqlite_conn() -> sqlite3.Connection:
    """Return a thread-safe connection to the persistent SQLite database."""
    global _sqlite_initialized
    try:
        os.makedirs(SQLITE_DIR, exist_ok=True)
        conn = sqlite3.connect(SQLITE_PATH, timeout=10.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        if not _sqlite_initialized:
            _init_sqlite_tables(conn)
            _sqlite_initialized = True
        return conn
    except Exception as exc:
        logger.error("Failed to connect to SQLite fallback: %s", exc)
        raise ConversationDBError(f"SQLite connection failed: {exc}") from exc


# Bootstrap SQLite tables immediately on module load
try:
    os.makedirs(SQLITE_DIR, exist_ok=True)
    with sqlite3.connect(SQLITE_PATH, timeout=5.0) as _bootstrap_conn:
        _bootstrap_conn.execute("PRAGMA foreign_keys = ON;")
        _init_sqlite_tables(_bootstrap_conn)
        _sqlite_initialized = True
except Exception as _bootstrap_exc:
    logger.debug("Deferred SQLite table bootstrap: %s", _bootstrap_exc)


def _generate_title(first_message: str) -> str:
    """
    Derive a short, safe title from the user's first message.
    Truncates to 60 chars, strips newlines — no LLM call required.
    """
    cleaned = " ".join(first_message.split())
    if len(cleaned) <= 60:
        return cleaned or "New conversation"
    truncated = cleaned[:57]
    last_space = truncated.rfind(" ")
    if last_space > 30:
        truncated = truncated[:last_space]
    return truncated + "…"


# ---------------------------------------------------------------------------
# Public Repository API
# ---------------------------------------------------------------------------

def create_conversation(user_id: str, title: str = "New conversation") -> Dict[str, Any]:
    """
    Insert a new copilot_conversations row for the given user.
    Returns the created row as a dict.
    """
    conv_id = str(uuid.uuid4())
    now = _now()
    safe_title = (title or "New conversation").strip()[:200] or "New conversation"

    # Try PostgreSQL first if connected
    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO copilot_conversations (id, user_id, title, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, user_id, title, created_at, updated_at
                    """,
                    (conv_id, user_id, safe_title, now, now),
                )
                row = cur.fetchone()
                return clean_row(dict(row))
        except Exception as exc:
            logger.warning("PostgreSQL create_conversation failed (%s); using SQLite", exc)

    # SQLite persistent fallback
    try:
        conn = _sqlite_conn()
        with conn:
            conn.execute(
                """
                INSERT INTO copilot_conversations (id, user_id, title, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (conv_id, str(user_id), safe_title, now.isoformat(), now.isoformat()),
            )
        conn.close()
        return {
            "id": conv_id,
            "user_id": str(user_id),
            "title": safe_title,
            "created_at": now,
            "updated_at": now,
        }
    except Exception as exc:
        logger.error("create_conversation failed | user=%s | error=%s", user_id, exc)
        raise ConversationDBError(f"Failed to create conversation: {exc}") from exc


def get_conversation(conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a single conversation row only if it belongs to user_id.
    Returns None if not found or not owned.
    """
    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, user_id, title, created_at, updated_at
                    FROM copilot_conversations
                    WHERE id = %s AND user_id = %s
                    """,
                    (conversation_id, user_id),
                )
                row = cur.fetchone()
                if row:
                    return clean_row(dict(row))
        except Exception as exc:
            logger.warning("PostgreSQL get_conversation failed (%s); checking SQLite", exc)

    # SQLite persistent fallback
    try:
        conn = _sqlite_conn()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, user_id, title, created_at, updated_at
            FROM copilot_conversations
            WHERE id = ? AND user_id = ?
            """,
            (conversation_id, str(user_id)),
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return None
        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "title": row["title"],
            "created_at": _parse_dt(row["created_at"]),
            "updated_at": _parse_dt(row["updated_at"]),
        }
    except Exception as exc:
        logger.error("get_conversation failed | conv=%s | error=%s", conversation_id, exc)
        raise ConversationDBError(f"Failed to fetch conversation: {exc}") from exc


def list_conversations(user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
    """
    Return conversation summaries for a user, most-recently-updated first.
    Does NOT include message bodies — lightweight list only.
    """
    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, user_id, title, created_at, updated_at
                    FROM copilot_conversations
                    WHERE user_id = %s
                    ORDER BY updated_at DESC
                    LIMIT %s
                    """,
                    (user_id, min(limit, 100)),
                )
                rows = cur.fetchall()
                if rows:
                    return [clean_row(dict(r)) for r in rows]
        except Exception as exc:
            logger.warning("PostgreSQL list_conversations failed (%s); checking SQLite", exc)

    # SQLite persistent fallback
    try:
        conn = _sqlite_conn()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, user_id, title, created_at, updated_at
            FROM copilot_conversations
            WHERE user_id = ?
            ORDER BY updated_at DESC
            LIMIT ?
            """,
            (str(user_id), min(limit, 100)),
        )
        rows = cur.fetchall()
        conn.close()
        return [
            {
                "id": r["id"],
                "user_id": r["user_id"],
                "title": r["title"],
                "created_at": _parse_dt(r["created_at"]),
                "updated_at": _parse_dt(r["updated_at"]),
            }
            for r in rows
        ]
    except Exception as exc:
        logger.error("list_conversations failed | user=%s | error=%s", user_id, exc)
        raise ConversationDBError(f"Failed to list conversations: {exc}") from exc


def update_conversation_title(conversation_id: str, user_id: str, title: str) -> bool:
    """
    Update the title of a conversation owned by user_id.
    Returns True on success, False if not found/owned.
    """
    now = _now()
    safe_title = (title or "New conversation").strip()[:200]
    updated = False

    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE copilot_conversations
                    SET title = %s, updated_at = %s
                    WHERE id = %s AND user_id = %s
                    """,
                    (safe_title, now, conversation_id, user_id),
                )
                if cur.rowcount > 0:
                    updated = True
        except Exception as exc:
            logger.warning("PostgreSQL update_conversation_title failed (%s); using SQLite", exc)

    # Also update SQLite
    try:
        conn = _sqlite_conn()
        with conn:
            res = conn.execute(
                """
                UPDATE copilot_conversations
                SET title = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (safe_title, now.isoformat(), conversation_id, str(user_id)),
            )
            if res.rowcount > 0:
                updated = True
        conn.close()
        return updated
    except Exception as exc:
        logger.error("update_conversation_title failed | conv=%s | error=%s", conversation_id, exc)
        raise ConversationDBError(f"Failed to update conversation title: {exc}") from exc


def touch_conversation(conversation_id: str) -> None:
    """Bump updated_at on the conversation after a new message is saved."""
    now = _now()
    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE copilot_conversations SET updated_at = %s WHERE id = %s",
                    (now, conversation_id),
                )
        except Exception as exc:
            logger.debug("PostgreSQL touch_conversation failed (%s)", exc)

    # SQLite
    try:
        conn = _sqlite_conn()
        with conn:
            conn.execute(
                "UPDATE copilot_conversations SET updated_at = ? WHERE id = ?",
                (now.isoformat(), conversation_id),
            )
        conn.close()
    except Exception as exc:
        logger.debug("SQLite touch_conversation failed (%s)", exc)


def delete_conversation(conversation_id: str, user_id: str) -> bool:
    """
    Delete a conversation and all its messages only if owned by user_id.
    Returns True on success, False if not found/owned.
    """
    deleted = False

    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM copilot_conversations WHERE id = %s AND user_id = %s",
                    (conversation_id, user_id),
                )
                if cur.rowcount > 0:
                    deleted = True
        except Exception as exc:
            logger.warning("PostgreSQL delete_conversation failed (%s); checking SQLite", exc)

    # SQLite
    try:
        conn = _sqlite_conn()
        with conn:
            conn.execute("DELETE FROM copilot_messages WHERE conversation_id = ?", (conversation_id,))
            res = conn.execute(
                "DELETE FROM copilot_conversations WHERE id = ? AND user_id = ?",
                (conversation_id, str(user_id)),
            )
            if res.rowcount > 0:
                deleted = True
        conn.close()
        return deleted
    except Exception as exc:
        logger.error("delete_conversation failed | conv=%s | error=%s", conversation_id, exc)
        raise ConversationDBError(f"Failed to delete conversation: {exc}") from exc


def add_message(
    conversation_id: str,
    role: str,
    content: str,
) -> Dict[str, Any]:
    """
    Insert a single message into copilot_messages.
    role must be 'user' or 'assistant'.
    """
    if role not in ("user", "assistant"):
        raise ValueError(f"Invalid role: {role!r}. Must be 'user' or 'assistant'.")

    msg_id = str(uuid.uuid4())
    now = _now()
    saved = False

    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO copilot_messages (id, conversation_id, role, content, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, conversation_id, role, content, created_at
                    """,
                    (msg_id, conversation_id, role, content, now),
                )
                row = cur.fetchone()
                if row:
                    saved = True
        except Exception as exc:
            logger.warning("PostgreSQL add_message failed (%s); using SQLite", exc)

    # SQLite persistent fallback
    try:
        conn = _sqlite_conn()
        with conn:
            conn.execute(
                """
                INSERT INTO copilot_messages (id, conversation_id, role, content, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (msg_id, conversation_id, role, content, now.isoformat()),
            )
        conn.close()
        return {
            "id": msg_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "created_at": now,
        }
    except Exception as exc:
        logger.error("add_message failed | conv=%s | role=%s | error=%s", conversation_id, role, exc)
        raise ConversationDBError(f"Failed to save message: {exc}") from exc


def get_messages(conversation_id: str, limit: int = 200) -> List[Dict[str, Any]]:
    """
    Return messages for a conversation in chronological order.
    """
    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, conversation_id, role, content, created_at
                    FROM copilot_messages
                    WHERE conversation_id = %s
                    ORDER BY created_at ASC
                    LIMIT %s
                    """,
                    (conversation_id, min(limit, 500)),
                )
                rows = cur.fetchall()
                if rows:
                    return [clean_row(dict(r)) for r in rows]
        except Exception as exc:
            logger.warning("PostgreSQL get_messages failed (%s); checking SQLite", exc)

    # SQLite persistent fallback
    try:
        conn = _sqlite_conn()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, conversation_id, role, content, created_at
            FROM copilot_messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
            LIMIT ?
            """,
            (conversation_id, min(limit, 500)),
        )
        rows = cur.fetchall()
        conn.close()
        return [
            {
                "id": r["id"],
                "conversation_id": r["conversation_id"],
                "role": r["role"],
                "content": r["content"],
                "created_at": _parse_dt(r["created_at"]),
            }
            for r in rows
        ]
    except Exception as exc:
        logger.error("get_messages failed | conv=%s | error=%s", conversation_id, exc)
        raise ConversationDBError(f"Failed to fetch messages: {exc}") from exc


def get_history_for_groq(conversation_id: str, max_turns: int = 10) -> List[Dict[str, str]]:
    """
    Return the last `max_turns * 2` messages as a simple list of
    {"role": "user"|"assistant", "content": "..."} dicts for injection
    into the Groq message thread. Oldest first.
    """
    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT role, content
                    FROM copilot_messages
                    WHERE conversation_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (conversation_id, max_turns * 2),
                )
                rows = cur.fetchall()
                if rows:
                    return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]
        except Exception as exc:
            logger.debug("PostgreSQL get_history_for_groq failed (%s); checking SQLite", exc)

    # SQLite persistent fallback
    try:
        conn = _sqlite_conn()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT role, content
            FROM copilot_messages
            WHERE conversation_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (conversation_id, max_turns * 2),
        )
        rows = cur.fetchall()
        conn.close()
        return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]
    except Exception as exc:
        logger.warning(
            "get_history_for_groq failed | conv=%s | error=%s — using empty history",
            conversation_id, exc,
        )
        return []


def ensure_tables_exist() -> bool:
    """
    Idempotently create copilot_conversations and copilot_messages tables.
    Initializes both SQLite and PostgreSQL (if connected). Always ensures
    storage readiness.
    """
    # 1. Initialize SQLite storage
    try:
        conn = _sqlite_conn()
        _init_sqlite_tables(conn)
        conn.close()
    except Exception as exc:
        logger.warning("SQLite table init warning: %s", exc)

    # 2. Try PostgreSQL if reachable
    if _is_pg_available():
        try:
            conn = _pg_conn()
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS copilot_conversations (
                        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        title       VARCHAR(200) NOT NULL DEFAULT 'New conversation',
                        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    );
                """)
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user_id
                        ON copilot_conversations(user_id);
                """)
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_copilot_conversations_updated_at
                        ON copilot_conversations(updated_at DESC);
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS copilot_messages (
                        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        conversation_id     UUID NOT NULL
                                            REFERENCES copilot_conversations(id) ON DELETE CASCADE,
                        role                VARCHAR(20) NOT NULL
                                            CHECK (role IN ('user', 'assistant')),
                        content             TEXT NOT NULL,
                        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    );
                """)
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation_id
                        ON copilot_messages(conversation_id);
                """)
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_copilot_messages_created_at
                        ON copilot_messages(conversation_id, created_at ASC);
                """)
            logger.info("Copilot PostgreSQL tables verified.")
        except Exception as exc:
            logger.warning("PostgreSQL table init note: %s", exc)

    return True
