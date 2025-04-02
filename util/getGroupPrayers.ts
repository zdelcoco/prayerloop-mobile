import axios from 'axios';

import { GetUserPrayersResponse } from './getUserPrayers.types';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

export const getGroupPrayers = async (
  token: string,
  groupId: number
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
    const url = `${BASE_API_URL}/groups/${groupId}/prayers`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const prayersResponse: GetUserPrayersResponse = {
      message: response.data.message,
      prayers: response.data.prayers,
    };
    
    console.log('getGroupPrayers response: ', prayersResponse)

    return { success: true, data: prayersResponse };
  } catch (error: unknown) {
      return defaultNetworkCatch(error);
    }
}