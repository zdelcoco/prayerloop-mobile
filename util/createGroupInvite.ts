import axios from 'axios';

import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

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
    const url = `${BASE_API_URL}/groups/${groupId}/invite`;
    const response = await axios.post(url, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    });

    console.log('createGroupInvite response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
}