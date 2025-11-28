/*

  TODO: DEPRECATE THIS

  HANDLE ON BACKEND -- IF LAST OF PRAYER_ACCESS, THEN DELETE THE PRAYER ENTIRELY

*/
import apiClient from './apiClient';
import { DefaultAPIResponse, defaultNetworkCatch, Result} from './shared.types';

export const deletePrayer = async (
  token: string,
  prayerId: number
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
    const response = await apiClient.delete(`/prayers/${prayerId}`);

    const deletePrayerResponse: DefaultAPIResponse = {
      message: response.data.message,
      error: response.data.error,
    };
    console.log('deletePrayer response: ', deletePrayerResponse);

    return { success: true, data: deletePrayerResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
