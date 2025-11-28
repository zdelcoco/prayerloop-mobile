import apiClient from './apiClient';

import { defaultNetworkCatch, Result } from './shared.types';

export interface CreateGroupInviteResponse {
  inviteCode: string;
  message?: string;
}

export const createGroupInvite = async (
  token: string,
  groupId: number
): Promise<Result> => {
  if (!token) {
    return {
      success: false,
      error: {
        type: 'Unauthorized',
        message: 'Unauthorized access. Please log in.',
      },
    };
  }

  try {
    const response = await apiClient.post(`/groups/${groupId}/invite`, {});

    console.log('createGroupInvite response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
}