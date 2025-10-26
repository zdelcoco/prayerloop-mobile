import axios from 'axios';

import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export const changeUserPassword = async (
  token: string,
  userProfileId: number,
  passwordData: ChangePasswordRequest,
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
    const url = `${BASE_API_URL}/users/${userProfileId}/password`;
    const response = await axios.patch(url, passwordData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const changeResponse: ChangePasswordResponse = {
      message: response.data.message,
    };
    console.log('changeUserPassword response: ', changeResponse);

    return { success: true, data: changeResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
