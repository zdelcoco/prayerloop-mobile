import axios from 'axios';

import { CreateUserPrayerRequest } from './createUserPrayer.types';
import { BASE_API_URL, DefaultAPIResponse, defaultNetworkCatch, Result } from './shared.types';

export const updateUserPrayer = async (
  token: string,
  prayerId: number,
  prayerData: CreateUserPrayerRequest,
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
    const url = `${BASE_API_URL}/prayers/${prayerId}`;
    const response = await axios.put(url, prayerData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const prayerResponse: DefaultAPIResponse = {
      message: response.data.message,
      error: response.data.error,
    };
    console.log('updateUserPrayer response: ', prayerResponse);

    return { success: true, data: prayerResponse };
  } catch (error: unknown) {
      return defaultNetworkCatch(error);
    }
};