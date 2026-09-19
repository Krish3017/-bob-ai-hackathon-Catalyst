-- =============================================================================
-- NaviOps — Migration 001: Copilot Conversation Persistence
-- Run once against the Supabase PostgreSQL database.
-- Safe to re-run: uses IF NOT EXISTS / DO NOTHING guards throughout.
-- Does NOT modify any existing NaviOps tables.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. copilot_conversations
--    One row per conversation thread, owned by a single authenticated user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS copilot_conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL DEFAULT 'New conversation',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user_id
    ON copilot_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_copilot_conversations_updated_at
    ON copilot_conversations(updated_at DESC);

-- ---------------------------------------------------------------------------
-- 2. copilot_messages
--    One row per message (user or assistant) within a conversation.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS copilot_messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id     UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
    role                VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation_id
    ON copilot_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_copilot_messages_created_at
    ON copilot_messages(conversation_id, created_at ASC);
