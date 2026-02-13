-- Add one-time image support to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_one_time BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;

-- Index for finding unviewed one-time images
CREATE INDEX IF NOT EXISTS idx_messages_one_time 
ON messages(is_one_time, viewed_at) 
WHERE is_one_time = true;

-- Add comment for documentation
COMMENT ON COLUMN messages.is_one_time IS 'Flag for one-time view images (disappear after recipient views once)';
COMMENT ON COLUMN messages.viewed_at IS 'Timestamp when one-time image was viewed by recipient';