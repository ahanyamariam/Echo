import React, { useState } from 'react';
import type { Message } from '../types';
import { markImageViewed } from '../api/uploads';
import ImageViewer from './ImageViewer';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, showAvatar = true }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isViewed, setIsViewed] = useState(!!message.viewed_at);
  const [viewError, setViewError] = useState(false);

  // ADD THIS DEBUG LOG AT THE TOP
  console.log('🖼️ MessageItem render:', {
    id: message.id,
    type: message.message_type,
    is_one_time: message.is_one_time,
    viewed_at: message.viewed_at,
    isOwn: isOwn,
    isViewed: !!message.viewed_at || isViewed
  });

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

  const handleImageClick = async () => {
    // One-time image logic for recipient
    if (message.is_one_time && !isOwn && !isViewed && !viewError) {
      try {
        await markImageViewed(message.id);
        setIsViewed(true);
        setViewerOpen(true);
      } catch (error) {
        console.error('Failed to mark image as viewed:', error);
        setViewError(true);
        setViewerOpen(true); // Still show even if marking fails
      }
    } else {
      setViewerOpen(true);
    }
  };

  const expiryTime = getTimeUntilExpiry();
  const isOneTimeHidden = message.is_one_time && isViewed;

  return (
    <>
      <div
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-2' : 'mt-0.5'
          } animate-fade-in`}
      >
        <div
          className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2 ${isOwn
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-700 text-white rounded-bl-sm'
            }`}
        >
          {/* Image Message */}
          {message.message_type === 'image' && message.media_url && (
            <div className="mb-1">
              {isOneTimeHidden ? (
                // One-time image already viewed - show placeholder
                <div className="bg-gray-800 rounded-lg p-8 text-center min-w-[200px]">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                  <p className="text-gray-400 text-sm">Photo viewed</p>
                </div>
              ) : message.is_one_time && !isViewed ? (
                // One-time image not yet viewed - show closed message state
                <div
                  onClick={handleImageClick}
                  className="bg-gray-800 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-750 transition border border-dashed border-gray-600 min-w-[200px]"
                >
                  <div className="bg-blue-600/20 rounded-full p-4 mb-3 mx-auto w-fit">
                    <svg
                      className="w-10 h-10 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <p className="text-white font-medium">View Once Photo</p>
                  <p className="text-gray-400 text-xs mt-1">Tap to open</p>
                </div>
              ) : (
                // Normal image OR sender's view of one-time image
                <div className="relative">
                  <img
                    src={`${import.meta.env.VITE_API_URL}${message.media_url}`}
                    alt="Shared image"
                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                    loading="lazy"
                    onClick={handleImageClick}
                  />
                  {/* One-time badge */}
                  {message.is_one_time && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-white text-xs font-medium">
                        {isOwn
                          ? (message.viewed_at ? 'Opened' : 'View once')
                          : 'View once'
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text Message */}
          {message.message_type === 'text' && message.text && (
            <p className="break-words whitespace-pre-wrap">{message.text}</p>
          )}

          {/* Time, Status, and Expiry */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'
              }`}
          >
            {/* One-time "Opened" indicator for sender */}
            {message.is_one_time && isOwn && message.viewed_at && (
              <span className="text-xs flex items-center gap-0.5 mr-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}

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

      {/* Image Viewer Modal */}
      {viewerOpen && message.media_url && (
        <ImageViewer
          imageUrl={`${import.meta.env.VITE_API_URL}${message.media_url}`}
          isOneTime={message.is_one_time && !isOwn}
          onClose={() => {
            setViewerOpen(false);
            // Mark as viewed locally when closing one-time image
            if (message.is_one_time && !isOwn) {
              setIsViewed(true);
            }
          }}
        />
      )}
    </>
  );
};

export default MessageItem;