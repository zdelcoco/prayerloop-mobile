import axios from 'axios';

import { User } from './shared.types';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

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
    const url = `${BASE_API_URL}/groups/${groupId}/users`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const groupUsersResponse: User[] = response.data
    
    console.log('getGroupUsers response: ', groupUsersResponse)

    return { success: true, data: groupUsersResponse };
  } catch (error: unknown) {
      return defaultNetworkCatch(error);
    }
}