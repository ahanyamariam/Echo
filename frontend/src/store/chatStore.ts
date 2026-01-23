import { create } from 'zustand';
import type { Conversation, Message } from '../types';

interface ChatState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // Messages (keyed by conversation ID)
  messages: Record<string, Message[]>;
  hasMoreMessages: Record<string, boolean>;

  // Loading states
  conversationsLoading: boolean;
  messagesLoading: boolean;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  updateConversationLastMessage: (message: Message) => void;

  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setHasMore: (conversationId: string, hasMore: boolean) => void;

  setConversationsLoading: (loading: boolean) => void;
  setMessagesLoading: (loading: boolean) => void;

  resetUnreadCount: (conversationId: string) => void;
  incrementUnreadCount: (conversationId: string) => void;

  // Cleanup
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
      // Check if conversation already exists
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
            last_message: message,
            // Only increment unread if not in active conversation and not sender
            unread_count: conv.id !== activeId ? conv.unread_count + 1 : conv.unread_count,
          };
        }
        return conv;
      });

      // Sort by last message time
      updatedConversations.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return { conversations: updatedConversations };
    });
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

      // Check for duplicates
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