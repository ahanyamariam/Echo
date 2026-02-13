import { create } from 'zustand';
import type { Conversation, Message, DisappearingMessages } from '../types';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  hasMoreMessages: Record<string, boolean>;
  conversationsLoading: boolean;
  messagesLoading: boolean;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  updateConversationLastMessage: (message: Message) => void;
  updateConversationDisappearing: (conversationId: string, settings: DisappearingMessages) => void;

  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setHasMore: (conversationId: string, hasMore: boolean) => void;
  removeExpiredMessages: (conversationId: string) => void;

  setConversationsLoading: (loading: boolean) => void;
  setMessagesLoading: (loading: boolean) => void;

  resetUnreadCount: (conversationId: string) => void;
  incrementUnreadCount: (conversationId: string) => void;

  clearMessages: (conversationId: string) => void;
  reset: () => void;
}

const initialState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  hasMoreMessages: {},
  conversationsLoading: false,
  messagesLoading: false,
};

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setConversations: (conversations) => {
    set({ conversations });
  },

  addConversation: (conversation) => {
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      if (exists) {
        return state;
      }
      return {
        conversations: [conversation, ...state.conversations],
      };
    });
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
  },

  updateConversationLastMessage: (message) => {
    set((state) => {
      const activeId = state.activeConversationId;

      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id === message.conversation_id) {
          return {
            ...conv,
            last_message: {
              id: message.id,
              message_type: message.message_type,
              text: message.text,
              sender_id: message.sender_id,
              created_at: message.created_at,
            },
            unread_count: conv.id !== activeId ? conv.unread_count + 1 : conv.unread_count,
          };
        }
        return conv;
      });

      updatedConversations.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return { conversations: updatedConversations };
    });
  },

  updateConversationDisappearing: (conversationId, settings) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, disappearing_messages: settings }
          : conv
      ),
    }));
  },

  setMessages: (conversationId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    }));
  },

  prependMessages: (conversationId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...messages, ...(state.messages[conversationId] || [])],
      },
    }));
  },

  addMessage: (message) => {
    set((state) => {
      const conversationId = message.conversation_id;
      const existingMessages = state.messages[conversationId] || [];

      if (existingMessages.some((m) => m.id === message.id)) {
        return state;
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
      };
    });
  },

  setHasMore: (conversationId, hasMore) => {
    set((state) => ({
      hasMoreMessages: {
        ...state.hasMoreMessages,
        [conversationId]: hasMore,
      },
    }));
  },

  removeExpiredMessages: (conversationId) => {
    set((state) => {
      const messages = state.messages[conversationId] || [];
      const now = new Date();
      const filtered = messages.filter((msg) => {
        if (!msg.expires_at) return true;
        return new Date(msg.expires_at) > now;
      });

      if (filtered.length === messages.length) {
        return state;
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: filtered,
        },
      };
    });
  },

  setConversationsLoading: (loading) => {
    set({ conversationsLoading: loading });
  },

  setMessagesLoading: (loading) => {
    set({ messagesLoading: loading });
  },

  resetUnreadCount: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      ),
    }));
  },

  incrementUnreadCount: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, unread_count: conv.unread_count + 1 }
          : conv
      ),
    }));
  },

  clearMessages: (conversationId) => {
    set((state) => {
      const { [conversationId]: _, ...restMessages } = state.messages;
      const { [conversationId]: __, ...restHasMore } = state.hasMoreMessages;
      return {
        messages: restMessages,
        hasMoreMessages: restHasMore,
      };
    });
  },

  reset: () => {
    set(initialState);
  },
}));

export default useChatStore;