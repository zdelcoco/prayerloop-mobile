import apiClient from './apiClient';

import { defaultNetworkCatch, Result } from './shared.types';

export interface DeleteGroupResponse {
  message: string;
}

export const deleteGroup = async (
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
    const response = await apiClient.delete(`/groups/${groupId}`);

    console.log('deleteGroup response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
}
