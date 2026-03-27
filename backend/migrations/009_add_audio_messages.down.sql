-- Revert audio message support

-- Drop new columns
ALTER TABLE messages DROP COLUMN IF EXISTS play_count;
ALTER TABLE messages DROP COLUMN IF EXISTS audio_duration;

-- Drop new constraints
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_check;

-- Restore original constraints (text and image only)
ALTER TABLE messages ADD CONSTRAINT messages_type_check
    CHECK (message_type IN ('text', 'image'));

ALTER TABLE messages ADD CONSTRAINT messages_content_check CHECK (
    (message_type = 'text' AND text IS NOT NULL AND media_url IS NULL) OR
    (message_type = 'image' AND media_url IS NOT NULL AND text IS NULL)
);
