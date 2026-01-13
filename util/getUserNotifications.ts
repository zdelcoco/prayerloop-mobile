import apiClient from './apiClient';

import { Notification } from './notification.types';
import { defaultNetworkCatch, Result } from './shared.types';

export const getUserNotifications = async (
  token: string,
  userProfileId: number
): Promise<Result<Notification[]>> => {
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
    const response = await apiClient.get(`/users/${userProfileId}/notifications`);

    const notifications: Notification[] = response.data || [];
    console.log('getUserNotifications response: ', notifications);

    return { success: true, data: notifications };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
