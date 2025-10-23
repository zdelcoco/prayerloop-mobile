const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface SendNotificationRequest {
  userIds: number[];
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: string;
  badge?: string;
  priority?: 'high' | 'normal';
}

export interface SendNotificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  userIds?: number[];
}

/**
 * Send push notification to specific users (admin only)
 */
export const sendPushNotification = async (
  request: SendNotificationRequest,
  authToken: string
): Promise<SendNotificationResponse> => {
  try {
    const response = await fetch(`${API_URL}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        userIds: data.userIds,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to send notification',
      };
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: 'Network error occurred',
    };
  }
};

/**
 * Send notification to all group members
 */
export const sendNotificationToGroup = async (
  groupId: number,
  title: string,
  body: string,
  authToken: string,
  data?: Record<string, string>
): Promise<SendNotificationResponse> => {
  try {
    // First, get all users in the group
    const groupResponse = await fetch(`${API_URL}/groups/${groupId}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!groupResponse.ok) {
      return {
        success: false,
        error: 'Failed to get group members',
      };
    }

    const groupUsers = await groupResponse.json();
    const userIds = groupUsers.map((user: any) => user.userProfileId);

    if (userIds.length === 0) {
      return {
        success: false,
        error: 'No users found in group',
      };
    }

    // Send notification to all group members
    return await sendPushNotification(
      {
        userIds,
        title,
        body,
        data: {
          ...data,
          type: 'group',
          groupId: groupId.toString(),
        },
        priority: 'high',
      },
      authToken
    );
  } catch (error) {
    console.error('Error sending group notification:', error);
    return {
      success: false,
      error: 'Failed to send group notification',
    };
  }
};

/**
 * Send prayer-related notification
 */
export const sendPrayerNotification = async (
  userIds: number[],
  prayerTitle: string,
  notificationType: 'new' | 'answered' | 'update',
  authToken: string,
  prayerId?: number
): Promise<SendNotificationResponse> => {
  const titles = {
    new: '🙏 New Prayer Request',
    answered: '✨ Prayer Answered!',
    update: '📝 Prayer Updated',
  };

  const bodies = {
    new: `${prayerTitle}`,
    answered: `${prayerTitle} has been answered!`,
    update: `${prayerTitle} has been updated`,
  };

  return await sendPushNotification(
    {
      userIds,
      title: titles[notificationType],
      body: bodies[notificationType],
      data: {
        type: 'prayer',
        prayerId: prayerId?.toString() || '',
        notificationType,
      },
      priority: 'high',
      sound: 'default',
    },
    authToken
  );
};