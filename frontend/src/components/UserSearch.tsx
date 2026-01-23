import React, { useState, useCallback, useRef, useEffect } from 'react';
import { usersApi } from '../api/users';
import { conversationsApi } from '../api/conversations';
import { useChatStore } from '../store/chatStore';
import type { User } from '../types';

interface UserSearchProps {
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onClose, onConversationCreated }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addConversation = useChatStore((state) => state.addConversation);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const users = await usersApi.search(searchQuery);
      setResults(users);
    } catch (err) {
      setError('Failed to search users');
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  const handleSelectUser = async (user: User) => {
    setCreating(true);
    setError('');

    try {
      const response = await conversationsApi.create(user.id);
      addConversation(response.conversation);
      onConversationCreated(response.conversation.id);
    } catch (err) {
      setError('Failed to create conversation');
      console.error('Failed to create conversation:', err);
    } finally {
      setCreating(false);
    }
  };

  const getAvatarColor = (username: string) => {
    const colors = [
      'from-green-500 to-teal-600',
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-orange-500 to-red-600',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="border-b border-gray-700 bg-gray-800">
      {/* Search Input */}
      <div className="p-3 pb-2 flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
        >
          Cancel
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-3 pb-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="pb-2">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                disabled={creating}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-700 disabled:opacity-50 transition"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(user.username)} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{user.username}</span>
              </button>
            ))}
          </div>
        ) : query.length >= 2 ? (
          <div className="py-6 text-center text-gray-400">
            <p>No users found</p>
          </div>
        ) : query.length > 0 ? (
          <div className="py-6 text-center text-gray-400">
            <p className="text-sm">Type at least 2 characters to search</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UserSearch;