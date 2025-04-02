/*

  TODO -- BACKEND ADJUSTMENT TO HANDLE DELETE PRAYER IF LAST OF PRAYER_ACCESS

  FOR NOW THIS WILL RESULT IN ORPHANED PRAYER RECORDS

*/
import axios from 'axios';
import { BASE_API_URL, DefaultAPIResponse, defaultNetworkCatch, Result } from './shared.types';

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
    const url = `${BASE_API_URL}/prayers/${prayerId}/access/${prayerAccessId}`;
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const removePrayerResponse: DefaultAPIResponse = {
      message: response.data.message,
    };
    console.log('removePrayerAccess response: ', removePrayerResponse);

    return { success: true, data: removePrayerResponse };
  } catch (error: unknown) {
      return defaultNetworkCatch(error);
    }
};
