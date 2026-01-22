export interface User {
    id: string;
    username: string;
    email?: string;
    created_at?: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    message_type: 'text' | 'image';
    text?: string;
    media_url?: string;
    created_at: string;
}

export interface Conversation {
    id: string;
    type: 'dm';
    created_at: string;
    other_user: User;
    last_message?: Message;
    unread_count: number;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface ConversationRead {
    conversation_id: string;
    user_id: string;
    last_read_message_id: string;
}

// WebSocket Event Types
export interface WSMessage {
    type: string;
    [key: string]: unknown;
}

export interface WSMessageNew {
    type: 'message_new';
    message: Message;
}

export interface WSReadUpdate {
    type: 'read_update';
    conversation_id: string;
    user_id: string;
    last_read_message_id: string;
}

export interface WSError {
    type: 'error';
    error: string;
}

export type WSEvent = WSMessageNew | WSReadUpdate | WSError;