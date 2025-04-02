import axios from 'axios';

import {
  BASE_API_URL,
  CreatePrayerRequest,
  CreatePrayerResponse,
  defaultNetworkCatch,
  Result,
} from './shared.types';

export const createGroupPrayer = async (
  token: string,
  groupProfileId: number,
  prayerData: CreatePrayerRequest
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
    const url = `${BASE_API_URL}/groups/${groupProfileId}/prayers`;
    const response = await axios.post(url, prayerData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });    

    const prayerResponse: CreatePrayerResponse = {
      message: response.data.message,
      prayerId: response.data.prayerId,
      prayerAccessId: response.data.prayerAccessId,
    };
    console.log('createGroupPrayer response: ', prayerResponse);

    return { success: true, data: prayerResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
