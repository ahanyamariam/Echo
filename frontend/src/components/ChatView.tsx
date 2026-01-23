import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import MessageList from './MessageList';
import Composer from './Composer';
import { useAuthStore } from '../store/authStore';

const ChatView: React.FC = () => {
  const selectedConversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === state.activeConversationId)
  );
  const messages = useChatStore((state) =>
    state.activeConversationId ? (state.messages[state.activeConversationId] || []) : []
  );
  const currentUser = useAuthStore((state) => state.user);

  // We need currentUserId. If not in chatStore, get from authStore.
  // Checking store structure from previous snippets not possible easily, defaulting to assumption.
  // Actually, let's use a hook or context if needed. 
  // But wait, ChatShell uses useAuthStore. Let's use that.

  // Correction: I need to import useAuthStore for currentUser access if chatStore doesn't have it.

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400 flex-col gap-4">
        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-300">Your Messages</h3>
          <p className="mt-1 text-sm">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-700 flex items-center justify-between bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg`}>
            {selectedConversation.other_user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-white">{selectedConversation.other_user.username}</h2>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          {/* Header actions */}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        {currentUser && (
          <MessageList
            messages={messages}
            currentUserId={currentUser.id}
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {selectedConversation && (
        <Composer conversationId={selectedConversation.id} />
      )}
    </div>
  );
};

export default ChatView;