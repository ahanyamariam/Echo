export interface User {
  id: string;
  username: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: 'text' | 'image' | 'audio';
  text?: string;
  media_url?: string;
  created_at: string;
  expires_at?: string;
  is_one_time?: boolean;
  viewed_at?: string;
  audio_duration?: number;
  play_count?: number;
}

export interface LastMessage {
  id: string;
  message_type: 'text' | 'image' | 'audio';
  text?: string;
  sender_id: string;
  created_at: string;
}

export interface DisappearingMessages {
  enabled: boolean;
  duration_seconds: number;
}

export interface Conversation {
  id: string;
  type: 'dm';
  created_at: string;
  other_user: User;
  last_message?: LastMessage;
  unread_count: number;
  disappearing_messages: DisappearingMessages;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// WebSocket Event Types
export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export interface WSMessageSend {
  type: 'message_send';
  conversation_id: string;
  message_type: 'text' | 'image' | 'audio';
  text?: string;
  media_url?: string;
  audio_duration?: number;
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
