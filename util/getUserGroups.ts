import axios from 'axios';

import { BASE_API_URL, defaultNetworkCatch, Group, Result } from './shared.types';

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
    const url = `${BASE_API_URL}/users/${userProfileId}/groups`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const groupsResponse: Group[] = response.data;
    console.log('getUserGroups response: ', groupsResponse);

    return { success: true, data: groupsResponse };
  } catch (error: unknown) {
      return defaultNetworkCatch(error);
    }
};
