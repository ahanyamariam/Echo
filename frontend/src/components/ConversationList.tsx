import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import ConversationItem from './ConversationItem';
import UserSearch from './UserSearch';

interface ConversationListProps {
  onConversationsChange: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onConversationsChange }) => {
  const [showSearch, setShowSearch] = useState(false);
  
  const conversations = useChatStore((state) => state.conversations);
  const conversationsLoading = useChatStore((state) => state.conversationsLoading);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const resetUnreadCount = useChatStore((state) => state.resetUnreadCount);

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    resetUnreadCount(id);
  };

  const handleConversationCreated = (conversationId: string) => {
    setShowSearch(false);
    setActiveConversation(conversationId);
    onConversationsChange();
  };

  if (conversationsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 transition font-medium"
        >
          {showSearch ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </>
          )}
        </button>
      </div>

      {/* User Search */}
      {showSearch && (
        <UserSearch
          onClose={() => setShowSearch(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <p className="font-medium">No conversations yet</p>
            <p className="text-sm mt-1">Start a new chat to begin messaging</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => handleSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;