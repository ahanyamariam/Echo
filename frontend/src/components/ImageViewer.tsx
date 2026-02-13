import React, { useEffect, useState } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  isOneTime?: boolean;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, isOneTime = false, onClose }) => {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // One-time image countdown timer (optional UX enhancement)
  useEffect(() => {
    if (isOneTime) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOneTime]);

  return (
    <div 
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 cursor-zoom-out" 
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white z-10 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* One-time indicator */}
        {isOneTime && (
          <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm rounded-lg px-3 py-2 text-white z-10 animate-pulse">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">
                {countdown ? `Closing in ${countdown}s` : 'This photo will disappear when closed'}
              </span>
            </div>
          </div>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          alt="Full size"
          className="max-w-full max-h-[90vh] object-contain rounded-lg cursor-default"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            if (isOneTime) {
              e.preventDefault(); // Disable right-click on one-time images
            }
          }}
        />
      </div>
    </div>
  );
};

export default ImageViewer;