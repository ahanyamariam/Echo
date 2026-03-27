-- Add audio message support and play count tracking

-- Drop existing constraints
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_check;

-- Add new constraints that include 'audio' type
ALTER TABLE messages ADD CONSTRAINT messages_type_check
    CHECK (message_type IN ('text', 'image', 'audio'));

ALTER TABLE messages ADD CONSTRAINT messages_content_check CHECK (
    (message_type = 'text' AND text IS NOT NULL AND media_url IS NULL) OR
    (message_type = 'image' AND media_url IS NOT NULL) OR
    (message_type = 'audio' AND media_url IS NOT NULL)
);

-- Add play_count column for tracking disappearing audio plays (max 2)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0;

-- Add audio_duration column for storing audio length in seconds
ALTER TABLE messages ADD COLUMN IF NOT EXISTS audio_duration INTEGER;
