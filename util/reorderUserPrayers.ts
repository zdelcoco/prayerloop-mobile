import apiClient from './apiClient';

import {
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
    const response = await apiClient.patch(`/users/${userProfileId}/prayers/reorder`, reorderData);

    console.log('reorderUserPrayers response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
