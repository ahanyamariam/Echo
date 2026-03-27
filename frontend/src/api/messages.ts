import apiClient from './client';
import type { Message } from '../types';

interface MessagesListResponse {
  messages: Message[];
  has_more: boolean;
}

export const messagesApi = {
  list: async (
    conversationId: string,
    limit: number = 50,
    before?: string
  ): Promise<{ messages: Message[]; hasMore: boolean }> => {
    let url = `/messages?conversation_id=${conversationId}&limit=${limit}`;
    if (before) {
      url += `&before=${before}`;
    }
    const response = await apiClient.get<MessagesListResponse>(url);
    return {
      messages: response.messages,
      hasMore: response.has_more,
    };
  },

  search: async (
    query: string,
    limit: number = 20
  ): Promise<Message[]> => {
    const response = await apiClient.get<{ messages: Message[] }>(
      `/messages/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.messages;
  },
};

export default messagesApi;