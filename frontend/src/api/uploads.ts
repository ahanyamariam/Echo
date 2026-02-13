const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as viewed');
    }
}