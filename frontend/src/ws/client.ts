import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

type MessageHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private isIntentionallyClosed = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
  }

  connect(): void {
    const token = useAuthStore.getState().token;
    if (!token) {
      console.error('No token available for WebSocket connection');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting');
      return;
    }

    this.isIntentionallyClosed = false;
    this.connectionState = 'connecting';
    const wsUrl = `${this.url}?token=${token}`;

    console.log('Connecting to WebSocket...');

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.connectionState = 'disconnected';
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.emit('connected', {});
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      try {
        const raw = event.data as string;
        const parts = raw.split('\n');
        for (const part of parts) {
          if (part.trim()) {
            const data = JSON.parse(part);
            console.log('📨 WebSocket message received:', data.type);
            this.handleMessage(data);
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.connectionState = 'disconnected';
      this.stopPingInterval();
      this.emit('disconnected', {});

      if (!this.isIntentionallyClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', { error });
    };
  }

  private handleMessage(data: any): void {
    const { type } = data;

    switch (type) {
      case 'message_new':
        this.handleNewMessage(data);
        break;
      case 'message_update':
        this.emit('message_update', data.message);
        break;
      case 'read_update':
        this.handleReadUpdate(data);
        break;
      case 'typing_start':
      case 'typing_stop':
        this.handleTypingEvent(data);
        break;
      case 'error':
        console.error('WebSocket error from server:', data.error);
        this.emit('error', data);
        break;
      default:
        console.log('Unknown message type:', type);
    }

    // Emit to registered handlers
    this.emit(type, data);
  }

  private handleNewMessage(data: any): void {
    const { message } = data;
    const chatStore = useChatStore.getState();

    console.log('📩 New message received:', {
      id: message.id,
      type: message.message_type,
      is_one_time: message.is_one_time,
      viewed_at: message.viewed_at
    });

    // Add message to store
    chatStore.addMessage(message);

    // Update conversation last message
    chatStore.updateConversationLastMessage(message);
  }

  private handleReadUpdate(data: any): void {
    const { conversation_id, user_id, last_read_message_id } = data;
    console.log('👁️ Read update:', conversation_id, user_id, last_read_message_id);
  }

  private handleTypingEvent(data: any): void {
    console.log('Typing event received:', data);
    const { type, conversation_id, username } = data;
    const chatStore = useChatStore.getState();

    if (type === 'typing_start') {
      chatStore.addTypingUser(conversation_id, username);
    } else {
      chatStore.removeTypingUser(conversation_id, username);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', {});
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Connection is alive
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    console.log('Disconnecting WebSocket...');
    this.isIntentionallyClosed = true;
    this.connectionState = 'disconnected';
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
  }

  send(data: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected, cannot send');
      return false;
    }

    try {
      console.log('📤 Sending:', data.type);
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  sendMessage(
    conversationId: string,
    messageType: 'text' | 'image' | 'audio',
    content: string,
    options?: {
      is_one_time?: boolean;
      expires_in?: number | null;
      audio_duration?: number;
    }
  ): boolean {
    const data: any = {
      type: 'message_send',
      conversation_id: conversationId,
      message_type: messageType,
    };

    if (messageType === 'text') {
      data.text = content;
    } else {
      data.media_url = content;
    }

    // Add optional flags
    if (options?.is_one_time) {
      data.is_one_time = true;
    }
    if (options?.expires_in) {
      data.expires_in = options.expires_in;
    }
    if (options?.audio_duration && messageType === 'audio') {
      data.audio_duration = options.audio_duration;
    }

    return this.send(data);
  }

  sendReadUpdate(conversationId: string, lastReadMessageId: string): boolean {
    return this.send({
      type: 'read_update',
      conversation_id: conversationId,
      last_read_message_id: lastReadMessageId,
    });
  }

  sendTypingIndicator(conversationId: string): boolean {
    console.log('Emitting typing indicator for conv:', conversationId);
    return this.send({
      type: 'typing',
      conversation_id: conversationId,
    });
  }

  // Event handling
  on(event: string, handler: MessageHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  off(event: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getState(): string {
    return this.connectionState;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;
