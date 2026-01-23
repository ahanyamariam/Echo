DROP INDEX IF EXISTS idx_messages_expires_at;
ALTER TABLE conversations DROP COLUMN IF EXISTS disappearing_messages_duration;
ALTER TABLE conversations DROP COLUMN IF EXISTS disappearing_messages_enabled;
ALTER TABLE messages DROP COLUMN IF EXISTS expires_at;