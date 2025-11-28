/*

  TODO -- BACKEND ADJUSTMENT TO HANDLE DELETE PRAYER IF LAST OF PRAYER_ACCESS

  FOR NOW THIS WILL RESULT IN ORPHANED PRAYER RECORDS

*/
import apiClient from './apiClient';
import { DefaultAPIResponse, defaultNetworkCatch, Result } from './shared.types';

export const removePrayerAccess = async (
  token: string,
  prayerId: number,
  prayerAccessId: number
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
    const response = await apiClient.delete(`/prayers/${prayerId}/access/${prayerAccessId}`);

    const removePrayerResponse: DefaultAPIResponse = {
      message: response.data.message,
    };
    console.log('removePrayerAccess response: ', removePrayerResponse);

    return { success: true, data: removePrayerResponse };
  } catch (error: unknown) {
      return defaultNetworkCatch(error);
    }
};
