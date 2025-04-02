import axios from 'axios';


import {
  CreateUserPrayerRequest,
  CreateUserPrayerResponse,
} from './createUserPrayer.types';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

export const createUserPrayer = async (
  token: string,
  userProfileId: number,
  prayerData: CreateUserPrayerRequest
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
    const response = await axios.post(url, prayerData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const prayerResponse: CreateUserPrayerResponse = {
      message: response.data.message,
      prayerId: response.data.prayerId,
      prayerAccessId: response.data.prayerAccessId,
    };
    console.log('createUserPrayer response: ', prayerResponse);

    return { success: true, data: prayerResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
