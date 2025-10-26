import axios from 'axios';

import { BASE_API_URL, User, defaultNetworkCatch, Result } from './shared.types';

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
    const url = `${BASE_API_URL}/users/${userProfileId}`;
    const response = await axios.patch(url, updateData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
