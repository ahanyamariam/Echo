import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getToken = () => useAuthStore.getState().token || localStorage.getItem('token');

export interface UploadResponse {
    media_url: string;
}

export async function uploadImage(file: File): Promise<string> {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed');
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
    }

    const data: UploadResponse = await response.json();
    return data.media_url;
}

export async function uploadAudio(file: File): Promise<string> {
    // Validate file type - use startsWith to handle codec info (e.g., "audio/webm;codecs=opus")
    const validTypePrefixes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
        'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/x-aac'
    ];
    const fileType = file.type.split(';')[0]; // Remove codec info
    if (!validTypePrefixes.some(type => fileType === type || fileType.startsWith(type))) {
        throw new Error('Invalid file type. Only MP3, WAV, OGG, WEBM, M4A, and AAC are allowed');
    }

    // Validate file size (10MB for audio)
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
    }

    const data: UploadResponse = await response.json();
    return data.media_url;
}

export async function markImageViewed(messageId: string): Promise<void> {
    const response = await fetch(`${API_URL}/messages/${messageId}/view`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as viewed');
    }
}

export async function incrementAudioPlayCount(messageId: string): Promise<number> {
    const response = await fetch(`${API_URL}/messages/${messageId}/play`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to increment play count');
    }

    const data = await response.json();
    return data.play_count;
}
