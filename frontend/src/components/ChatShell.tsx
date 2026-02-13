import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useWSStore } from '../ws/wsStore';
import { conversationsApi } from '../api/conversations';
import { wsClient } from '../ws/client';
import ConversationList from './ConversationList';
import ChatView from './ChatView';

const ChatShell: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setConversations = useChatStore((state) => state.setConversations);
  const setConversationsLoading = useChatStore((state) => state.setConversationsLoading);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const resetChat = useChatStore((state) => state.reset);

  const isConnected = useWSStore((state) => state.isConnected);
  const setConnected = useWSStore((state) => state.setConnected);
  const resetWS = useWSStore((state) => state.reset);

  useEffect(() => {
    // Load conversations
    loadConversations();

    // Set up WebSocket event handlers FIRST
    const handleConnected = () => {
      console.log('WebSocket connected - updating state');
      setConnected(true);
    };
    const handleDisconnected = () => {
      console.log('WebSocket disconnected - updating state');
      setConnected(false);
    };
    const handleMessageUpdate = (updatedMessage: any) => {
      console.log('WebSocket message_update received:', updatedMessage);
      updateMessage(updatedMessage.conversation_id, updatedMessage.id, {
        viewed_at: updatedMessage.viewed_at,
        is_one_time: updatedMessage.is_one_time
      });
    };

    wsClient.on('connected', handleConnected);
    wsClient.on('disconnected', handleDisconnected);
    wsClient.on('message_update', handleMessageUpdate);

    // THEN connect
    wsClient.connect();

    // Check if already connected (in case connection happened before handlers registered)
    if (wsClient.isConnected()) {
      setConnected(true);
    }

    return () => {
      wsClient.off('connected', handleConnected);
      wsClient.off('disconnected', handleDisconnected);
      wsClient.off('message_update', handleMessageUpdate);
      wsClient.disconnect();
      resetChat();
      resetWS();
    };
  }, []);

  const loadConversations = async () => {
    setConversationsLoading(true);
    try {
      const conversations = await conversationsApi.list();
      setConversations(conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  };

  const handleLogout = () => {
    wsClient.disconnect();
    resetChat();
    resetWS();
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-700 bg-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-blue-400">Echo</h1>
                  {/* Connection Status Indicator */}
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                      }`}
                    title={isConnected ? 'Connected' : 'Disconnected'}
                  />
                </div>
                <p className="text-sm text-gray-400">{user?.username}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <ConversationList onConversationsChange={loadConversations} />
      </div>

      {/* Right Panel - Chat View */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConversationId ? (
          <ChatView key={activeConversationId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">Welcome to Echo</h2>
              <p>Select a conversation or start a new chat</p>
              {!isConnected && (
                <p className="text-yellow-500 text-sm mt-4">
                  ⚠️ Connecting to server...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatShell;