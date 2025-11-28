import apiClient from './apiClient';

import { defaultNetworkCatch, Result } from './shared.types';

export interface LeaveGroupResponse {
  message: string;
}

export const leaveGroup = async (
  token: string,
  groupId: number,
  userId: number
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
    const response = await apiClient.delete(`/groups/${groupId}/users/${userId}`);

    console.log('leaveGroup response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
}
