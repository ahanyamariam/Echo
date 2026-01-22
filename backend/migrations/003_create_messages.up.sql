CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(10) NOT NULL,
    text TEXT,
    media_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT messages_type_check CHECK (message_type IN ('text', 'image')),
    CONSTRAINT messages_content_check CHECK (
        (message_type = 'text' AND text IS NOT NULL AND media_url IS NULL) OR
        (message_type = 'image' AND media_url IS NOT NULL AND text IS NULL)
    )
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);