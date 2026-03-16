import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
    getMyProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    updateSettings,
    type FullProfile,
} from '../api/profile';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { logout, updateUser } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getMyProfile();
            setProfile(data);
            setDisplayName(data.profile.display_name || '');
            setBio(data.profile.bio || '');
            updateUser({
                display_name: data.profile.display_name,
                avatar_url: data.profile.avatar_url,
            });
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setError(null);
            await updateProfile({ display_name: displayName, bio });
            setSuccess('Profile updated successfully');
            setIsEditing(false);
            await loadProfile();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingAvatar(true);
            setError(null);
            await uploadAvatar(file);
            setSuccess('Avatar updated successfully');
            await loadProfile();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload avatar');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Are you sure you want to remove your avatar?')) return;

        try {
            setUploadingAvatar(true);
            await removeAvatar();
            setSuccess('Avatar removed');
            await loadProfile();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to remove avatar');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleToggleSetting = async (key: 'show_email' | 'show_avatar' | 'show_online_status') => {
        if (!profile) return;

        // Optimistically update UI
        const previousValue = profile.settings[key];
        const newValue = !previousValue;
        
        setProfile({
            ...profile,
            settings: { ...profile.settings, [key]: newValue },
        });

        try {
            await updateSettings({ [key]: newValue });
        } catch (err) {
            // Revert on failure
            setProfile({
                ...profile,
                settings: { ...profile.settings, [key]: previousValue },
            });
            setError('Failed to update setting');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    let avatarUrl = null;
    if (profile?.profile.avatar_url) {
        if (profile.profile.avatar_url.startsWith('http')) {
            avatarUrl = profile.profile.avatar_url;
        } else {
            avatarUrl = `${import.meta.env.VITE_API_URL}${profile.profile.avatar_url}`;
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-white flex items-center gap-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <h1 className="text-lg font-semibold">Profile</h1>
                <div className="w-16"></div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="mx-4 mt-4 p-3 bg-green-500/10 border border-green-500 rounded-lg text-green-400 text-sm">
                    {success}
                </div>
            )}

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center py-6">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />

                    <div
                        onClick={handleAvatarClick}
                        className="relative cursor-pointer group"
                    >
                        <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-gray-600 group-hover:border-blue-500 transition">
                            {uploadingAvatar ? (
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-gray-400">
                                    {profile?.profile.display_name?.[0] || profile?.profile.username?.[0] || '?'}
                                </span>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-2 border-gray-900">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>

                    {avatarUrl && (
                        <button
                            onClick={handleRemoveAvatar}
                            className="mt-2 text-sm text-red-400 hover:text-red-300"
                        >
                            Remove photo
                        </button>
                    )}

                    <p className="text-gray-400 text-sm mt-2">Tap to change photo</p>
                </div>

                {/* Profile Info */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Profile Info</h2>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                                Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setDisplayName(profile?.profile.display_name || '');
                                        setBio(profile?.profile.bio || '');
                                    }}
                                    className="text-gray-400 hover:text-white text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-gray-400 text-sm">Display Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    maxLength={100}
                                    className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter display name"
                                />
                            ) : (
                                <p className="text-white mt-1">{profile?.profile.display_name || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm">Username</label>
                            <p className="text-white mt-1">@{profile?.profile.username}</p>
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm">Email</label>
                            <p className="text-white mt-1">{profile?.profile.email}</p>
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm">Bio</label>
                            {isEditing ? (
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Write a short bio..."
                                />
                            ) : (
                                <p className="text-white mt-1">{profile?.profile.bio || '-'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Privacy Settings */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Privacy</h2>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-white">Show Email</p>
                                <p className="text-gray-400 text-sm">Let others see your email address</p>
                            </div>
                            <button
                                onClick={() => handleToggleSetting('show_email')}
                                className={`relative w-12 h-6 rounded-full transition ${profile?.settings.show_email ? 'bg-blue-600' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${profile?.settings.show_email ? 'right-1' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-white">Show Avatar</p>
                                <p className="text-gray-400 text-sm">Let others see your profile picture</p>
                            </div>
                            <button
                                onClick={() => handleToggleSetting('show_avatar')}
                                className={`relative w-12 h-6 rounded-full transition ${profile?.settings.show_avatar ? 'bg-blue-600' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${profile?.settings.show_avatar ? 'right-1' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-white">Show Online Status</p>
                                <p className="text-gray-400 text-sm">Let others see when you're online</p>
                            </div>
                            <button
                                onClick={() => handleToggleSetting('show_online_status')}
                                className={`relative w-12 h-6 rounded-full transition ${profile?.settings.show_online_status ? 'bg-blue-600' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${profile?.settings.show_online_status ? 'right-1' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-red-600/10 border border-red-600 text-red-500 rounded-lg hover:bg-red-600/20 transition"
                >
                    Logout
                </button>

                {/* Account Info */}
                <p className="text-center text-gray-500 text-sm">
                    {profile?.profile.created_at && (
                        <>Member since {new Date(profile.profile.created_at).toLocaleDateString()}</>
                    )}
                </p>
            </div>
        </div>
    );
};

export default ProfilePage;