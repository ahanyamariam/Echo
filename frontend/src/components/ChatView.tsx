import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { messagesApi } from '../api/messages';
import { getUserProfile } from '../api/profile';
import { wsClient } from '../ws/client';
import MessageList from './MessageList';
import Composer from './Composer';
import DisappearingMessagesToggle from './DisappearingMessagesToggle';
import UserProfileModal from './UserProfileModal';

const ChatView: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const [loadingMore, setLoadingMore] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  const user = useAuthStore((state) => state.user);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const messages = useChatStore((state) =>
    activeConversationId ? state.messages[activeConversationId] || [] : []
  );
  const hasMore = useChatStore((state) =>
    activeConversationId ? state.hasMoreMessages[activeConversationId] ?? true : false
  );
  const messagesLoading = useChatStore((state) => state.messagesLoading);

  const setMessages = useChatStore((state) => state.setMessages);
  const prependMessages = useChatStore((state) => state.prependMessages);
  const setHasMore = useChatStore((state) => state.setHasMore);
  const setMessagesLoading = useChatStore((state) => state.setMessagesLoading);
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount);
  const removeExpiredMessages = useChatStore((state) => state.removeExpiredMessages);
  const updateConversationUser = useChatStore((state) => state.updateConversationUser);
  const typingUsers = useChatStore((state) => 
    activeConversationId ? (state.typingUsers[activeConversationId] || []) : []
  );

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      initialLoadRef.current = true;
      prevMessagesLengthRef.current = 0;
      loadMessages();
      resetUnreadCount(activeConversationId);
    }
  }, [activeConversationId]);

  // Refresh other user's profile data when conversation is opened
  useEffect(() => {
    if (activeConversation?.other_user?.id) {
      getUserProfile(activeConversation.other_user.id)
        .then((profile) => {
          updateConversationUser(profile.id, {
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          });
        })
        .catch(() => { });
    }
  }, [activeConversationId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const isInitialLoad = initialLoadRef.current;
      const container = messagesContainerRef.current;

      if (isInitialLoad) {
        scrollToBottom('auto');
        initialLoadRef.current = false;
      } else if (container) {
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (isNearBottom) {
          scrollToBottom('smooth');
        }
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Check for expired messages periodically
  useEffect(() => {
    if (!activeConversationId || !activeConversation?.disappearing_messages?.enabled) {
      return;
    }

    const interval = setInterval(() => {
      removeExpiredMessages(activeConversationId);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [activeConversationId, activeConversation?.disappearing_messages?.enabled]);

  const loadMessages = async () => {
    if (!activeConversationId) return;

    setMessagesLoading(true);
    try {
      const response = await messagesApi.list(activeConversationId);
      setMessages(activeConversationId, response.messages);
      setHasMore(activeConversationId, response.hasMore);

      // Mark messages as read on the server
      if (response.messages.length > 0) {
        const lastMessage = response.messages[response.messages.length - 1];
        wsClient.sendReadUpdate(activeConversationId, lastMessage.id);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!activeConversationId || loadingMore || !hasMore || messages.length === 0) {
      return;
    }

    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const response = await messagesApi.list(activeConversationId, 50, oldestMessage.id);
      prependMessages(activeConversationId, response.messages);
      setHasMore(activeConversationId, response.hasMore);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (container.scrollTop < 100 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, messages]);

  const getAvatarColor = (username: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => setShowProfile(true)}>
            {activeConversation.other_user.avatar_url ? (
              <img
                src={activeConversation.other_user.avatar_url.startsWith('http') ? activeConversation.other_user.avatar_url : `${API_URL}${activeConversation.other_user.avatar_url}`}
                alt={activeConversation.other_user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                  activeConversation.other_user.username
                )} flex items-center justify-center text-white font-bold`}
              >
                {(activeConversation.other_user.display_name || activeConversation.other_user.username).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-semibold">{activeConversation.other_user.display_name || activeConversation.other_user.username}</h2>
              {activeConversation.disappearing_messages?.enabled && (
                <p className="text-xs text-purple-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Disappearing messages on
                </p>
              )}
            </div>
          </div>

          {/* Disappearing Messages Toggle */}
          <DisappearingMessagesToggle
            conversationId={activeConversation.id}
            settings={activeConversation.disappearing_messages || { enabled: false, duration_seconds: 86400 }}
          />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}

            {!hasMore && messages.length > 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">Beginning of conversation</p>
              </div>
            )}

            <MessageList messages={messages} currentUserId={user?.id || ''} />
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-400 italic animate-pulse flex items-center gap-1">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.join(', ')} are typing...`}
        </div>
      )}

      {/* Composer */}
      <Composer conversationId={activeConversationId!} onMessageSent={() => scrollToBottom()} />

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfileModal
          userId={activeConversation.other_user.id}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

export default ChatView;