import React from 'react';
import { useAuthStore } from '../store/authStore';

const Chat: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-blue-500">Echo</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-300">{user?.username}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-gray-800 rounded-xl p-8 text-center">
                    <div className="mb-4">
                        <svg
                            className="w-16 h-16 mx-auto text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Welcome to Echo, {user?.username}!
                    </h2>
                    <p className="text-gray-400 mb-4">
                        Your account has been created successfully.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Chat;