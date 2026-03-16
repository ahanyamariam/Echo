import React, { useState } from 'react';
import type { Conversation } from '../types';
import UserProfileModal from './UserProfileModal';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const [showProfile, setShowProfile] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPreviewText = () => {
    if (!conversation.last_message) {
      return 'No messages yet';
    }
    if (conversation.last_message.message_type === 'image') {
      return '📷 Photo';
    }
    return conversation.last_message.text || '';
  };

  const getAvatarColor = (username: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600',
      'from-yellow-500 to-orange-600',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProfile(true);
  };

  return (
    <>
      <div
        onClick={onClick}
        className={`p-3 cursor-pointer transition ${
          isActive
            ? 'bg-gray-700'
            : 'hover:bg-gray-700/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar - clickable for profile */}
          <div
            onClick={handleAvatarClick}
            className="flex-shrink-0 cursor-pointer hover:opacity-80 transition"
            title={`View ${conversation.other_user.display_name || conversation.other_user.username}'s profile`}
          >
            {conversation.other_user.avatar_url ? (
              <img src={conversation.other_user.avatar_url.startsWith('http') ? conversation.other_user.avatar_url : `${API_URL}${conversation.other_user.avatar_url}`} alt={conversation.other_user.username} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(conversation.other_user.username)} flex items-center justify-center text-white font-bold`}>
                {(conversation.other_user.display_name || conversation.other_user.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">
                {conversation.other_user.display_name || conversation.other_user.username}
              </span>
              {conversation.last_message && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatTime(conversation.last_message.created_at)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="text-sm text-gray-400 truncate">
                {getPreviewText()}
              </span>
              {conversation.unread_count > 0 && (
                <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-600 text-xs rounded-full flex items-center justify-center font-medium">
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <UserProfileModal
          userId={conversation.other_user.id}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
};

export default ConversationItem;
