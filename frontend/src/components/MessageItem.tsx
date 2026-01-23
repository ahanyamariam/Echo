import React from 'react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, showAvatar }) => {
  const getAvatarColor = (senderId: string) => {
    // Deterministic color based on sender ID
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500',
      'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
    ];
    // Simple hash
    let hash = 0;
    for (let i = 0; i < senderId.length; i++) {
      hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'} py-0.5 group`}>
      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 w-8 flex items-end">
          {showAvatar && !isOwn && (
            <div className={`w-8 h-8 rounded-full ${getAvatarColor(message.sender_id)} flex items-center justify-center text-xs font-bold text-white`}>
              {/* Try to show first letter if username available, else '?' */}
              ?
            </div>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={`
            px-4 py-2 shadow-sm relative text-sm
            ${isOwn
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
              : 'bg-gray-700 text-gray-100 rounded-2xl rounded-tl-sm'}
          `}
        >
          {/* Text Content */}
          {message.message_type === 'text' && (
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          )}

          {/* Image Content */}
          {message.message_type === 'image' && message.media_url && (
            <div className="rounded-lg overflow-hidden mt-1 mb-1">
              <img
                src={message.media_url}
                alt="Shared content"
                className="max-w-full h-auto max-h-64 object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Time & tick (for own messages) */}
          <div className={`text-[10px] mt-1 flex items-center gap-1 opacity-70 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span>{formatTime(message.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;