import apiClient from './apiClient';

import { User, defaultNetworkCatch, Result } from './shared.types';

export interface UpdateUserProfileRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface UpdateUserProfileResponse {
  message: string;
  user: User;
}

export const updateUserProfile = async (
  token: string,
  userProfileId: number,
  updateData: UpdateUserProfileRequest,
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
    const response = await apiClient.patch(`/users/${userProfileId}`, updateData);

    const updateResponse: UpdateUserProfileResponse = {
      message: response.data.message,
      user: response.data.user,
    };
    console.log('updateUserProfile response: ', updateResponse);

    return { success: true, data: updateResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
