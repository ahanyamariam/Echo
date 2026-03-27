import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface Profile {
  id: string;
  username: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface Settings {
  show_email: boolean;
  show_avatar: boolean;
  show_online_status: boolean;
}

export interface FullProfile {
  profile: Profile;
  settings: Settings;
}

export interface PublicProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token || localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export async function getMyProfile(): Promise<FullProfile> {
  const response = await fetch(`${API_URL}/users/me/profile`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get profile');
  }

  return response.json();
}

export async function updateProfile(data: { display_name?: string; bio?: string }): Promise<Profile> {
  const response = await fetch(`${API_URL}/users/me/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return response.json();
}

export async function uploadAvatar(file: File): Promise<string> {
  // Validate file
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed');
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File size exceeds 2MB limit');
  }

  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${API_URL}/users/me/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${useAuthStore.getState().token || localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload avatar');
  }

  const data = await response.json();
  return data.avatar_url;
}

export async function removeAvatar(): Promise<void> {
  const response = await fetch(`${API_URL}/users/me/avatar`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to remove avatar');
  }
}

export async function getSettings(): Promise<Settings> {
  const response = await fetch(`${API_URL}/users/me/settings`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get settings');
  }

  return response.json();
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  const response = await fetch(`${API_URL}/users/me/settings`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update settings');
  }

  return response.json();
}

export async function getUserProfile(userId: string): Promise<PublicProfile> {
  const response = await fetch(`${API_URL}/users/${userId}/profile`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }

  return response.json();
}