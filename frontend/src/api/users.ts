import apiClient from './client';
import type { User } from '../types';

interface UserResponse {
  id: string;
  username: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
}

interface SearchResponse {
  users: UserResponse[];
}

export const usersApi = {
  getMe: async (): Promise<User> => {
    return apiClient.get<UserResponse>('/users/me');
  },

  search: async (query: string): Promise<User[]> => {
    const response = await apiClient.get<SearchResponse>(
      `/users/search?q=${encodeURIComponent(query)}`
    );
    return response.users;
  },
};

export default usersApi;