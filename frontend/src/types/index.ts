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

export interface LastMessage {
  id: string;
  message_type: 'text' | 'image';
  text?: string;
  sender_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: 'dm';
  created_at: string;
  other_user: User;
  last_message?: LastMessage;
  unread_count: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// WebSocket Event Types (for Week 3)
export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export interface WSMessageSend {
  type: 'message_send';
  conversation_id: string;
  message_type: 'text' | 'image';
  text?: string;
  media_url?: string;
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