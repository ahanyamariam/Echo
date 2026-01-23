import apiClient from './client';
import type { Conversation } from '../types';

interface ConversationsListResponse {
  conversations: Conversation[];
}

interface CreateConversationResponse {
  conversation: Conversation;
  created: boolean;
}

interface UpdateDisappearingResponse {
  success: boolean;
  enabled: boolean;
  duration_seconds: number;
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

  updateDisappearingMessages: async (
    conversationId: string,
    enabled: boolean,
    durationSeconds: number = 86400
  ): Promise<UpdateDisappearingResponse> => {
    return apiClient.request<UpdateDisappearingResponse>(
      `/conversations/${conversationId}/disappearing`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          enabled,
          duration_seconds: durationSeconds,
        }),
      }
    );
  },
};

export default conversationsApi;