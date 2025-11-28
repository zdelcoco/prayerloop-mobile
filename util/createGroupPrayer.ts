import apiClient from './apiClient';

import {
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
    const response = await apiClient.post(`/groups/${groupProfileId}/prayers`, prayerData);

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
