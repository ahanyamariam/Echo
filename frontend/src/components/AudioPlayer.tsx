import React, { useState, useRef, useEffect } from 'react';
import { incrementAudioPlayCount } from '../api/uploads';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  isOneTime?: boolean;
  playCount?: number;
  messageId: string;
  isOwn: boolean;
  onPlayCountUpdate?: (newCount: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  duration,
  isOneTime = false,
  playCount = 0,
  messageId,
  isOwn,
  onPlayCountUpdate,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [localPlayCount, setLocalPlayCount] = useState(playCount);
  const [isLocked, setIsLocked] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const maxPlays = 2; // Maximum plays for one-time audio
  const playsRemaining = maxPlays - localPlayCount;

  useEffect(() => {
    setLocalPlayCount(playCount);
  }, [playCount]);

  useEffect(() => {
    // For one-time audio that's not from the sender, check if it's exhausted
    if (isOneTime && !isOwn && localPlayCount >= maxPlays) {
      setIsLocked(true);
    }
  }, [isOneTime, isOwn, localPlayCount]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handlePlay = async () => {
    if (!audioRef.current) return;

    // For one-time audio (not sender), check and increment play count
    if (isOneTime && !isOwn && !hasStartedPlaying) {
      if (localPlayCount >= maxPlays) {
        setIsLocked(true);
        return;
      }

      try {
        const newCount = await incrementAudioPlayCount(messageId);
        setLocalPlayCount(newCount);
        setHasStartedPlaying(true);
        if (onPlayCountUpdate) {
          onPlayCountUpdate(newCount);
        }
      } catch (error) {
        console.error('Failed to increment play count:', error);
        return;
      }
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Locked state for exhausted one-time audio
  if (isLocked) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 min-w-[200px]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700 rounded-full">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm">Audio played</p>
            <p className="text-gray-500 text-xs">No more plays remaining</p>
          </div>
        </div>
      </div>
    );
  }

  // Unopened one-time audio (not sender)
  if (isOneTime && !isOwn && localPlayCount === 0 && !hasStartedPlaying) {
    return (
      <div
        onClick={handlePlay}
        className="bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-750 transition border border-dashed border-gray-600 min-w-[200px]"
      >
        <div className="flex items-center gap-3">
          <div className="bg-purple-600/20 rounded-full p-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Voice Message</p>
            <p className="text-gray-400 text-xs">Tap to play • {playsRemaining} plays left</p>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={src}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-3 min-w-[220px]">
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={handlePlay}
          className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition flex-shrink-0"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress and time */}
        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={audioDuration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #3b82f6 ${(currentTime / (audioDuration || 1)) * 100}%, #4b5563 ${(currentTime / (audioDuration || 1)) * 100}%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>
      </div>

      {/* One-time indicator */}
      {isOneTime && (
        <div className="flex items-center justify-end gap-1 mt-2 text-xs text-purple-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {isOwn ? (
            <span>{localPlayCount > 0 ? `Played ${localPlayCount}x` : 'Listen once'}</span>
          ) : (
            <span>{playsRemaining} play{playsRemaining !== 1 ? 's' : ''} left</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
