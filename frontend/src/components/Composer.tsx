import React, { useState, useRef, useEffect } from 'react';
import { wsClient } from '../ws/client';
import { useWSStore } from '../ws/wsStore';

interface ComposerProps {
  conversationId: string;
  onMessageSent?: () => void;
}

const Composer: React.FC<ComposerProps> = ({ conversationId, onMessageSent }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isConnected = useWSStore((state) => state.isConnected);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustTextareaHeight();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText || sending || !isConnected) return;

    setSending(true);

    // Send via WebSocket
    const success = wsClient.sendMessage(conversationId, 'text', trimmedText);

    if (success) {
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onMessageSent?.();
    } else {
      console.error('Failed to send message');
      // Could show an error toast here
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800">
      {/* Connection Warning */}
      {!isConnected && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-500 text-sm text-center">
          ⚠️ Reconnecting to server... Messages will be sent when connected.
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Attachment Button (for Week 4) */}
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition flex-shrink-0"
          title="Attach image (coming soon)"
          disabled
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            rows={1}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '150px' }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || sending || !isConnected}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition flex-shrink-0"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-2 ml-12">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
};

export default Composer;