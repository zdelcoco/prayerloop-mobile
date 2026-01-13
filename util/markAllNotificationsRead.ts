import apiClient from './apiClient';

import { MarkAllReadResponse } from './notification.types';
import { defaultNetworkCatch, Result } from './shared.types';

export const markAllNotificationsRead = async (
  token: string,
  userProfileId: number
): Promise<Result<MarkAllReadResponse>> => {
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
      `/users/${userProfileId}/notifications/mark-all-read`
    );

    console.log('markAllNotificationsRead response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
