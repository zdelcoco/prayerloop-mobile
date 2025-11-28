import apiClient from './apiClient';

import { defaultNetworkCatch, Group, Result } from './shared.types';

export const getUserGroups = async (
  token: string,
  userProfileId: number
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
    const response = await apiClient.get(`/users/${userProfileId}/groups`);

    const groupsResponse: Group[] = response.data;
    console.log('getUserGroups response: ', groupsResponse);

    return { success: true, data: groupsResponse };
  } catch (error: unknown) {
      return defaultNetworkCatch(error);
    }
};
