import apiClient from './apiClient';

import {
  DefaultAPIResponse,
  defaultNetworkCatch,
  Result,
} from './shared.types';

export interface ReorderPrayerSubjectPrayersRequest {
  prayers: Array<{
    prayerId: number;
    displaySequence: number;
  }>;
}

export const reorderPrayerSubjectPrayers = async (
  token: string,
  prayerSubjectId: number,
  reorderData: ReorderPrayerSubjectPrayersRequest
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
    const response = await apiClient.patch(
      `/prayer-subjects/${prayerSubjectId}/prayers/reorder`,
      reorderData
    );

    console.log('reorderPrayerSubjectPrayers response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
