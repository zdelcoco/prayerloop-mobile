import axios from 'axios';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

export interface JoinGroupRequest {
  inviteCode: string;
}

export interface JoinGroupResponse {
  message: string;
  groupId: number;
}

export const joinGroup = async (
  token: string,
  groupId: number,
  inviteCode: string
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
    const url = `${BASE_API_URL}/groups/${groupId}/join`;
    const requestData: JoinGroupRequest = {
      inviteCode: inviteCode.trim(),
    };

    const response = await axios.post(url, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('joinGroup response:', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error('joinGroup error:', error);
    
    // Handle specific 403 invalid invite code error
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      return {
        success: false,
        error: {
          type: 'InvalidInviteCode',
          message: 'Invalid or expired invite code',
        },
      };
    }
    
    return defaultNetworkCatch(error);
  }
};