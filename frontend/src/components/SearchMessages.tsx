import React, { useState, useEffect, useRef, useCallback } from 'react';
import { messagesApi } from '../api/messages';
import { useChatStore } from '../store/chatStore';
import type { Message } from '../types';

interface SearchMessagesProps {
  onClose: () => void;
}

const SearchMessages: React.FC<SearchMessagesProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversations = useChatStore((state) => state.conversations);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const msgs = await messagesApi.search(q.trim());
      setResults(msgs);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleResultClick = (msg: Message) => {
    setActiveConversation(msg.conversation_id);
    onClose();
  };

  const getConversationName = (conversationId: string) => {
    const conv = conversations.find((c) => c.id === conversationId);
    return conv?.other_user?.display_name || conv?.other_user?.username || 'Unknown';
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-500/40 text-yellow-200 rounded px-0.5">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search messages..."
              className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">No messages found for "{query}"</p>
          </div>
        )}

        {!loading && !searched && (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">Type to search across all your conversations</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="divide-y divide-gray-700/50">
            {results.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleResultClick(msg)}
                className="w-full text-left px-4 py-3 hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-400 truncate">
                    {getConversationName(msg.conversation_id)}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">
                  {msg.text ? highlightMatch(msg.text, query) : '[Image]'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchMessages;
