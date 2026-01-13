import apiClient from './apiClient';

import { ToggleNotificationStatusResponse } from './notification.types';
import { defaultNetworkCatch, Result } from './shared.types';

export const toggleNotificationStatus = async (
  token: string,
  userProfileId: number,
  notificationId: number
): Promise<Result<ToggleNotificationStatusResponse>> => {
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
      `/users/${userProfileId}/notifications/${notificationId}`
    );

    console.log('toggleNotificationStatus response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
