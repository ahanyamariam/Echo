import React, { useState, useRef, useEffect } from 'react';
import { wsClient } from '../ws/client';
import { useWSStore } from '../ws/wsStore';
import { uploadImage, uploadAudio } from '../api/uploads';
import ImagePreview from './ImagePreview';
import AudioRecorder from './AudioRecorder';

interface ComposerProps {
  conversationId: string;
  onMessageSent?: () => void;
}

const Composer: React.FC<ComposerProps> = ({ conversationId, onMessageSent }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isOneTime, setIsOneTime] = useState(false);
  const [disappearTime, setDisappearTime] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isAudioOneTime, setIsAudioOneTime] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isConnected = useWSStore((state) => state.isConnected);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId]);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [previewUrl, audioPreviewUrl]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsOneTime(false);
  };

  const handleSendImage = async () => {
    if (!selectedImage || !isConnected || uploading) return;

    setUploading(true);
    setSending(true);

    try {
      const mediaUrl = await uploadImage(selectedImage);

      const success = wsClient.sendMessage(conversationId, 'image', mediaUrl, {
        is_one_time: isOneTime,
        expires_in: disappearTime
      });

      if (success) {
        setSelectedImage(null);
        setPreviewUrl(null);
        setIsOneTime(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onMessageSent?.();
      }
    } catch (error) {
      console.error('Failed to send image:', error);
      alert(error instanceof Error ? error.message : 'Failed to send image');
    } finally {
      setUploading(false);
      setSending(false);
    }
  };

  // Audio recording handlers
  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
    const url = URL.createObjectURL(blob);
    setAudioPreviewUrl(url);
    setIsRecording(false);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setAudioBlob(null);
    setAudioDuration(0);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
  };

  const handleSendAudio = async () => {
    if (!audioBlob || !isConnected || uploading) return;

    setUploading(true);
    setSending(true);

    try {
      // Convert blob to file for upload
      const extension = audioBlob.type.includes('webm') ? 'webm' : 'm4a';
      const file = new File([audioBlob], `recording.${extension}`, { type: audioBlob.type });
      const mediaUrl = await uploadAudio(file);

      const success = wsClient.sendMessage(conversationId, 'audio', mediaUrl, {
        is_one_time: isAudioOneTime,
        expires_in: disappearTime,
        audio_duration: audioDuration
      });

      if (success) {
        setAudioBlob(null);
        setAudioDuration(0);
        setIsAudioOneTime(false);
        if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl);
          setAudioPreviewUrl(null);
        }
        onMessageSent?.();
      }
    } catch (error) {
      console.error('Failed to send audio:', error);
      alert(error instanceof Error ? error.message : 'Failed to send audio');
    } finally {
      setUploading(false);
      setSending(false);
    }
  };

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

    const success = wsClient.sendMessage(conversationId, 'text', trimmedText, {
      expires_in: disappearTime
    });

    if (success) {
      setText('');
      setDisappearTime(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onMessageSent?.();
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Image Preview Modal */}
      {selectedImage && previewUrl && (
        <ImagePreview
          file={selectedImage}
          previewUrl={previewUrl}
          isOneTime={isOneTime}
          onOneTimeChange={setIsOneTime}
          onSend={handleSendImage}
          onCancel={() => {
            setSelectedImage(null);
            setPreviewUrl(null);
            setIsOneTime(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          sending={uploading}
        />
      )}

      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800">
        {/* Audio Recorder */}
        {isRecording && (
          <div className="p-4 border-b border-gray-700">
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              onCancel={handleCancelRecording}
            />
          </div>
        )}

        {/* Audio Preview (after recording) */}
        {audioBlob && audioPreviewUrl && !isRecording && (
          <div className="p-4 border-b border-gray-700">
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Voice Message</p>
                      <p className="text-gray-400 text-sm">{formatDuration(audioDuration)}</p>
                    </div>
                  </div>

                  <audio src={audioPreviewUrl} controls className="w-full h-10" />

                  {/* One-time toggle */}
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAudioOneTime}
                      onChange={(e) => setIsAudioOneTime(e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-300">Listen once (2 plays max)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleCancelRecording}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Discard
                </button>
                <button
                  onClick={handleSendAudio}
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-full transition flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          {/* Connection Warning */}
          {!isConnected && (
            <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-500 text-sm text-center">
              Reconnecting to server...
            </div>
          )}

          {/* Disappearing Message Options */}
          {disappearTime !== null && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-purple-600/10 rounded-lg">
              <span className="text-purple-400 text-sm">Disappears in:</span>
              <select
                value={disappearTime}
                onChange={(e) => setDisappearTime(Number(e.target.value))}
                className="bg-gray-700 text-white text-sm px-2 py-1 rounded"
              >
                <option value={60}>1 min</option>
                <option value={300}>5 min</option>
                <option value={3600}>1 hour</option>
                <option value={86400}>24 hours</option>
              </select>
              <button
                type="button"
                onClick={() => setDisappearTime(null)}
                className="ml-auto text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition flex-shrink-0"
              title="Attach image"
              disabled={!isConnected || isRecording}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Microphone Button */}
            <button
              type="button"
              onClick={() => setIsRecording(true)}
              className={`p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition flex-shrink-0 ${isRecording ? 'text-red-500 bg-red-500/20' : ''}`}
              title="Record audio"
              disabled={!isConnected || isRecording || !!audioBlob}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
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
                disabled={!isConnected || isRecording}
                rows={1}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px', maxHeight: '150px' }}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!text.trim() || sending || !isConnected || isRecording}
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

          <p className="text-xs text-gray-500 mt-2 ml-12">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </>
  );
};

export default Composer;
