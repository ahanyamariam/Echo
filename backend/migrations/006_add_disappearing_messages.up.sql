-- Add expires_at column to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add disappearing_messages setting to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS disappearing_messages_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS disappearing_messages_duration INTEGER DEFAULT 86400; -- 24 hours in seconds

-- Index for efficient cleanup of expired messages
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at) WHERE expires_at IS NOT NULL;

-- Comment explaining the columns
COMMENT ON COLUMN messages.expires_at IS 'When set, message will be deleted after this timestamp';
COMMENT ON COLUMN conversations.disappearing_messages_enabled IS 'Whether messages in this conversation auto-delete';
COMMENT ON COLUMN conversations.disappearing_messages_duration IS 'Duration in seconds before messages disappear (default 24 hours)';