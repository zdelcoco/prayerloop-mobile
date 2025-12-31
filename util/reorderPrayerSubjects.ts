import apiClient from './apiClient';

import {
  DefaultAPIResponse,
  defaultNetworkCatch,
  Result,
} from './shared.types';

export interface ReorderPrayerSubjectsRequest {
  subjects: Array<{
    prayerSubjectId: number;
    displaySequence: number;
  }>;
}

export const reorderPrayerSubjects = async (
  token: string,
  userProfileId: number,
  reorderData: ReorderPrayerSubjectsRequest
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
      `/users/${userProfileId}/prayer-subjects/reorder`,
      reorderData
    );

    console.log('reorderPrayerSubjects response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
