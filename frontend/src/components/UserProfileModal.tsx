import React, { useEffect, useState } from 'react';
import { getUserProfile, type PublicProfile } from '../api/profile';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch {
      setError('Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const resolveAvatar = (url: string) =>
    url.startsWith('http') ? url : `${API_URL}${url}`;

  const getAvatarColor = (username: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
    ];
    return colors[username.charCodeAt(0) % colors.length];
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={loadProfile}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition"
            >
              Try again
            </button>
          </div>
        ) : profile ? (
          <>
            {/* Banner gradient */}
            <div className={`h-24 bg-gradient-to-br ${getAvatarColor(profile.username)}`} />

            {/* Avatar - overlapping banner */}
            <div className="flex justify-center -mt-14">
              {profile.avatar_url ? (
                <img
                  src={resolveAvatar(profile.avatar_url)}
                  alt={profile.username}
                  className="w-28 h-28 rounded-full object-cover border-4 border-gray-800 shadow-lg"
                />
              ) : (
                <div
                  className={`w-28 h-28 rounded-full bg-gradient-to-br ${getAvatarColor(
                    profile.username
                  )} flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-800 shadow-lg`}
                >
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-6 pt-4 pb-6 text-center">
              <h2 className="text-xl font-bold text-white">
                {profile.display_name || profile.username}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>

              {/* Bio */}
              {profile.bio && (
                <div className="mt-4 px-2">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Divider + extra info */}
              <div className="mt-5 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Echo Member</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default UserProfileModal;
