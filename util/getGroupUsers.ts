import apiClient from './apiClient';

import { User, defaultNetworkCatch, Result } from './shared.types';

export const getGroupUsers = async (
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
    const response = await apiClient.get(`/groups/${groupId}/users`);

    const groupUsersResponse: User[] = response.data

    console.log('getGroupUsers response: ', groupUsersResponse)

    return { success: true, data: groupUsersResponse };
  } catch (error: unknown) {
      return defaultNetworkCatch(error);
    }
}