import React from 'react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, showAvatar = true }) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntilExpiry = () => {
    if (!message.expires_at) return null;

    const now = new Date();
    const expiresAt = new Date(message.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMins > 0) return `${diffMins}m`;
    return '<1m';
  };

  const expiryTime = getTimeUntilExpiry();

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
        showAvatar ? 'mt-2' : 'mt-0.5'
      } animate-fade-in`}
    >
      <div
        className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-700 text-white rounded-bl-sm'
        }`}
      >
        {/* Image Message */}
        {message.message_type === 'image' && message.media_url && (
          <div className="mb-1">
            <img
              src={`${import.meta.env.VITE_API_URL}${message.media_url}`}
              alt="Shared image"
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
              loading="lazy"
              onClick={() =>
                window.open(`${import.meta.env.VITE_API_URL}${message.media_url}`, '_blank')
              }
            />
          </div>
        )}

        {/* Text Message */}
        {message.message_type === 'text' && message.text && (
          <p className="break-words whitespace-pre-wrap">{message.text}</p>
        )}

        {/* Time, Status, and Expiry */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 ${
            isOwn ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          {/* Expiry Timer */}
          {expiryTime && (
            <span className="text-xs flex items-center gap-0.5 mr-1 opacity-75">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {expiryTime}
            </span>
          )}

          <span className="text-xs">{formatTime(message.created_at)}</span>

          {/* Delivered Tick */}
          {isOwn && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;