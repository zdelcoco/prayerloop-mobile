import axios from 'axios';

import { GetUserPrayersResponse } from './getUserPrayers.types';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

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
    const url = `${BASE_API_URL}/users/${userProfileId}/prayers`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
