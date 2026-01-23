import React, { useState } from 'react';
import { conversationsApi } from '../api/conversations';
import { useChatStore } from '../store/chatStore';
import type { DisappearingMessages } from '../types';

interface DisappearingMessagesToggleProps {
  conversationId: string;
  settings: DisappearingMessages;
}

const DURATION_OPTIONS = [
  { label: '5 minutes', value: 300 },
  { label: '1 hour', value: 3600 },
  { label: '6 hours', value: 21600 },
  { label: '24 hours', value: 86400 },
  { label: '7 days', value: 604800 },
];

const DisappearingMessagesToggle: React.FC<DisappearingMessagesToggleProps> = ({
  conversationId,
  settings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const updateConversationDisappearing = useChatStore(
    (state) => state.updateConversationDisappearing
  );

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newEnabled = !settings.enabled;
      const response = await conversationsApi.updateDisappearingMessages(
        conversationId,
        newEnabled,
        settings.duration_seconds || 86400
      );
      updateConversationDisappearing(conversationId, {
        enabled: response.enabled,
        duration_seconds: response.duration_seconds,
      });
    } catch (error) {
      console.error('Failed to update disappearing messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDurationChange = async (durationSeconds: number) => {
    setLoading(true);
    try {
      const response = await conversationsApi.updateDisappearingMessages(
        conversationId,
        true,
        durationSeconds
      );
      updateConversationDisappearing(conversationId, {
        enabled: response.enabled,
        duration_seconds: response.duration_seconds,
      });
    } catch (error) {
      console.error('Failed to update duration:', error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const getCurrentDurationLabel = () => {
    const option = DURATION_OPTIONS.find((o) => o.value === settings.duration_seconds);
    return option?.label || '24 hours';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${settings.enabled
            ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        title="Disappearing messages"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {settings.enabled ? getCurrentDurationLabel() : 'Off'}
        {loading && (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disappearing</span>
                <button
                  onClick={handleToggle}
                  disabled={loading}
                  className={`relative w-10 h-5 rounded-full transition ${settings.enabled ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${settings.enabled ? 'left-5' : 'left-0.5'
                      }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Messages auto-delete after the set time
              </p>
            </div>

            {settings.enabled && (
              <div className="p-2">
                <p className="text-xs text-gray-400 px-2 mb-2">Delete after:</p>
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDurationChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${settings.duration_seconds === option.value
                        ? 'bg-purple-600/20 text-purple-400'
                        : 'hover:bg-gray-700 text-gray-300'
                      }`}
                  >
                    {option.label}
                    {settings.duration_seconds === option.value && (
                      <span className="float-right">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DisappearingMessagesToggle;