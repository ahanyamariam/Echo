import apiClient from './client';
import type { AuthResponse } from '../types';

export interface SignupRequest {
    username: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export const authApi = {
    signup: (data: SignupRequest): Promise<AuthResponse> => {
        return apiClient.post<AuthResponse>('/auth/signup', data, false);
    },

    login: (data: LoginRequest): Promise<AuthResponse> => {
        return apiClient.post<AuthResponse>('/auth/login', data, false);
    },
};

export default authApi;