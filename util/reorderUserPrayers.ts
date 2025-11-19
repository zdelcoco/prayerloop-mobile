import axios from 'axios';

import {
  BASE_API_URL,
  DefaultAPIResponse,
  defaultNetworkCatch,
  Result,
} from './shared.types';

export interface ReorderPrayersRequest {
  prayers: Array<{
    prayerId: number;
    displaySequence: number;
  }>;
}

export const reorderUserPrayers = async (
  token: string,
  userProfileId: number,
  reorderData: ReorderPrayersRequest
): Promise<Result<DefaultAPIResponse>> => {
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
    const url = `${BASE_API_URL}/users/${userProfileId}/prayers/reorder`;
    const response = await axios.patch(url, reorderData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('reorderUserPrayers response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
