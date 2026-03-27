import React, { useState } from 'react';
import type { Message } from '../types';
import { markImageViewed } from '../api/uploads';
import ImageViewer from './ImageViewer';
import AudioPlayer from './AudioPlayer';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onPlayCountUpdate?: (messageId: string, newCount: number) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, showAvatar = true, onPlayCountUpdate }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isViewed, setIsViewed] = useState(!!message.viewed_at);
  const [viewError, setViewError] = useState(false);

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
    if (message.is_one_time && !isOwn && !isViewed && !viewError) {
      try {
        await markImageViewed(message.id);
        setIsViewed(true);
        setViewerOpen(true);
      } catch (error) {
        console.error('Failed to mark image as viewed:', error);
        setViewError(true);
        setViewerOpen(true);
      }
    } else {
      setViewerOpen(true);
    }
  };

  const handleAudioPlayCountUpdate = (newCount: number) => {
    if (onPlayCountUpdate) {
      onPlayCountUpdate(message.id, newCount);
    }
  };

  const expiryTime = getTimeUntilExpiry();
  const isOneTimeHidden = message.message_type === 'image' && message.is_one_time && isViewed;

  return (
    <>
      <div
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-2' : 'mt-0.5'} animate-fade-in`}
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
              {isOneTimeHidden ? (
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
                <div className="relative">
                  <img
                    src={`${import.meta.env.VITE_API_URL}${message.media_url}`}
                    alt="Shared image"
                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                    loading="lazy"
                    onClick={handleImageClick}
                  />
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

          {/* Audio Message */}
          {message.message_type === 'audio' && message.media_url && (
            <div className="mb-1">
              <AudioPlayer
                src={`${import.meta.env.VITE_API_URL}${message.media_url}`}
                duration={message.audio_duration}
                isOneTime={message.is_one_time}
                playCount={message.play_count || 0}
                messageId={message.id}
                isOwn={isOwn}
                onPlayCountUpdate={handleAudioPlayCountUpdate}
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
            {/* One-time "Opened" indicator for sender (images) */}
            {message.message_type === 'image' && message.is_one_time && isOwn && message.viewed_at && (
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

            {/* Play count indicator for sender (audio) */}
            {message.message_type === 'audio' && message.is_one_time && isOwn && (message.play_count || 0) > 0 && (
              <span className="text-xs flex items-center gap-0.5 mr-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span>{message.play_count}x</span>
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
      {viewerOpen && message.media_url && message.message_type === 'image' && (
        <ImageViewer
          imageUrl={`${import.meta.env.VITE_API_URL}${message.media_url}`}
          isOneTime={message.is_one_time && !isOwn}
          onClose={() => {
            setViewerOpen(false);
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
