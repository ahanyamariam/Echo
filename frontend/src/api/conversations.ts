import apiClient from './client';
import type { Conversation } from '../types';

interface ConversationsListResponse {
  conversations: Conversation[];
}

interface CreateConversationResponse {
  conversation: Conversation;
  created: boolean;
}

export const conversationsApi = {
  list: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<ConversationsListResponse>('/conversations');
    return response.conversations;
  },

  create: async (otherUserId: string): Promise<{ conversation: Conversation; created: boolean }> => {
    return apiClient.post<CreateConversationResponse>('/conversations', {
      other_user_id: otherUserId,
    });
  },
};

export default conversationsApi;