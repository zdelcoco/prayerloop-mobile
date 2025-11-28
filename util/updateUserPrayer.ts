import apiClient from './apiClient';

import { CreateUserPrayerRequest } from './createUserPrayer.types';
import { DefaultAPIResponse, defaultNetworkCatch, Result } from './shared.types';

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
    const response = await apiClient.put(`/prayers/${prayerId}`, prayerData);

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