import apiClient from './apiClient';

import { GetUserPrayersResponse } from './getUserPrayers.types';
import { defaultNetworkCatch, Result } from './shared.types';

export const getUserPrayers = async (
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
    const response = await apiClient.get(`/users/${userProfileId}/prayers`);

    const prayersResponse: GetUserPrayersResponse = {
      message: response.data.message,
      prayers: response.data.prayers,
    };
    console.log('getUserPrayers response: ', prayersResponse);

    return { success: true, data: prayersResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
