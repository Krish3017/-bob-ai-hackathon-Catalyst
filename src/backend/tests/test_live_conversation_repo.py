import os
import sys
import uuid
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.conversation_repo import (
    create_conversation,
    get_conversation,
    list_conversations,
    update_conversation_title,
    touch_conversation,
    delete_conversation,
    add_message,
    get_messages,
    get_history_for_groq,
    ensure_tables_exist,
)


def test_live_conversation_lifecycle():
    ensure_tables_exist()

    user_a = str(uuid.uuid4())
    user_b = str(uuid.uuid4())

    # 1. Create conversation for user A
    conv = create_conversation(user_id=user_a, title="Port Congestion Analysis")
    conv_id = conv["id"]
    assert conv_id is not None
    assert conv["title"] == "Port Congestion Analysis"
    assert conv["user_id"] == user_a

    # 2. Get conversation
    fetched = get_conversation(conv_id, user_a)
    assert fetched is not None
    assert fetched["id"] == conv_id

    # 3. User isolation: user B cannot fetch user A's conversation
    assert get_conversation(conv_id, user_b) is None

    # 4. Add messages in chronological order
    m1 = add_message(conv_id, "user", "What is the status of Berth 1?")
    assert m1["role"] == "user"
    assert m1["content"] == "What is the status of Berth 1?"

    m2 = add_message(conv_id, "assistant", "Berth 1 is currently occupied by Ever Given.")
    assert m2["role"] == "assistant"

    m3 = add_message(conv_id, "user", "When will it be available?")
    m4 = add_message(conv_id, "assistant", "Estimated availability is in 6 hours.")

    # 5. Fetch messages
    messages = get_messages(conv_id)
    assert len(messages) == 4
    assert [m["content"] for m in messages] == [
        "What is the status of Berth 1?",
        "Berth 1 is currently occupied by Ever Given.",
        "When will it be available?",
        "Estimated availability is in 6 hours.",
    ]
    assert [m["role"] for m in messages] == ["user", "assistant", "user", "assistant"]

    # 6. Groq history formatting
    groq_history = get_history_for_groq(conv_id, max_turns=2)
    assert len(groq_history) == 4
    assert groq_history[0]["role"] == "user"
    assert groq_history[-1]["role"] == "assistant"

    # 7. List conversations
    user_a_list = list_conversations(user_a)
    assert len(user_a_list) >= 1
    assert any(c["id"] == conv_id for c in user_a_list)

    # User B has no conversations
    assert len(list_conversations(user_b)) == 0

    # 8. Update title
    assert update_conversation_title(conv_id, user_a, "Updated Title") is True
    updated = get_conversation(conv_id, user_a)
    assert updated["title"] == "Updated Title"

    # 9. Delete conversation
    assert delete_conversation(conv_id, user_a) is True
    assert get_conversation(conv_id, user_a) is None
    assert len(get_messages(conv_id)) == 0
