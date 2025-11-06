import axios from 'axios';

import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

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
    const url = `${BASE_API_URL}/groups/${groupId}/users/${userId}`;
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    });

    console.log('leaveGroup response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
}
