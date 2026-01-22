const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getToken(): string | null {
        return localStorage.getItem('token');
    }

    private getHeaders(includeAuth: boolean = true): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {},
        includeAuth: boolean = true
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                ...this.getHeaders(includeAuth),
                ...(options.headers as Record<string, string>),
            },
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
    }

    async post<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'POST',
                body: data ? JSON.stringify(data) : undefined,
            },
            includeAuth
        );
    }

    async uploadFile<T>(endpoint: string, file: File): Promise<T> {
        const formData = new FormData();
        formData.append('file', file);

        const token = this.getToken();
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    }
}

export const apiClient = new ApiClient(API_URL);
export default apiClient;