import apiClient from './apiClient';

import { defaultNetworkCatch, Result } from './shared.types';

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
    const response = await apiClient.patch(`/users/${userProfileId}/password`, passwordData);

    const changeResponse: ChangePasswordResponse = {
      message: response.data.message,
    };
    console.log('changeUserPassword response: ', changeResponse);

    return { success: true, data: changeResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
