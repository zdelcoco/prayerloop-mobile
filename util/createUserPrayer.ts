import apiClient from './apiClient';

import {
  CreatePrayerRequest,
  CreatePrayerResponse,
  defaultNetworkCatch,
  Result,
} from './shared.types';

export const createUserPrayer = async (
  token: string,
  userProfileId: number,
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
    const response = await apiClient.post(`/users/${userProfileId}/prayers`, prayerData);

    const prayerResponse: CreatePrayerResponse = {
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
