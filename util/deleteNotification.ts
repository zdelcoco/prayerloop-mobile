import apiClient from './apiClient';

import { DeleteNotificationResponse } from './notification.types';
import { defaultNetworkCatch, Result } from './shared.types';

export const deleteNotification = async (
  token: string,
  userProfileId: number,
  notificationId: number
): Promise<Result<DeleteNotificationResponse>> => {
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
    const response = await apiClient.delete(
      `/users/${userProfileId}/notifications/${notificationId}`
    );

    console.log('deleteNotification response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
