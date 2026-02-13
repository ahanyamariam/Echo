-- Rollback one-time image feature
DROP INDEX IF EXISTS idx_messages_one_time;

ALTER TABLE messages 
DROP COLUMN IF EXISTS viewed_at,
DROP COLUMN IF EXISTS is_one_time;