import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Configure how notifications are displayed when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

export interface NotificationData {
  title?: string;
  body?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

class PushNotificationService {
  private pushToken: string | null = null;

  /**
   * Request push notification permissions from the user
   */
  async requestPermissions(): Promise<PushNotificationPermissions> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied' as Notifications.PermissionStatus,
      };
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return {
      granted: finalStatus === 'granted',
      canAskAgain: existingStatus === 'undetermined',
      status: finalStatus,
    };
  }

  /**
   * Get the FCM push token for this device using Firebase
   */
  async getFCMToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Request Firebase messaging permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Firebase messaging permission not granted');
        return null;
      }

      // Get FCM token from Firebase
      const token = await messaging().getToken();

      this.pushToken = token;
      console.log('Got FCM token:', token);

      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  /**
   * @deprecated Use getFCMToken() instead
   */
  async getExpoPushToken(): Promise<string | null> {
    return this.getFCMToken();
  }

  /**
   * Register the push token with the backend
   */
  async registerPushToken(token: string, authToken: string): Promise<boolean> {
    try {
      const platform = Platform.OS;
      
      const response = await fetch(`${API_URL}/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          pushToken: token,
          platform,
        }),
      });

      if (response.ok) {
        console.log('Push token registered successfully');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to register push token:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  /**
   * Complete setup flow: request permissions, get token, register with backend
   */
  async setupPushNotifications(authToken: string): Promise<boolean> {
    try {
      // Get FCM token (this also requests permissions internally)
      const token = await this.getFCMToken();
      if (!token) {
        console.log('Failed to get FCM token');
        return false;
      }

      // Register with backend
      const registered = await this.registerPushToken(token, authToken);
      return registered;
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      return false;
    }
  }

  /**
   * Set up notification listeners for both Firebase and Expo notifications
   */
  setupNotificationListeners() {
    // Handle FCM token refresh
    const tokenRefreshUnsubscribe = messaging().onTokenRefresh(async (token) => {
      console.log('FCM token refreshed:', token);
      this.pushToken = token;
      // You may want to update the backend with the new token here
    });

    // Handle Firebase messages when app is in foreground
    const foregroundUnsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received in foreground:', remoteMessage);
      // Display a local notification
      if (remoteMessage.notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title || '',
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data,
          },
          trigger: null,
        });
      }
    });

    // Handle notification responses (when user taps on notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);

      const data = response.notification.request.content.data;

      // Handle navigation based on notification data
      this.handleNotificationNavigation(data);
    });

    return () => {
      tokenRefreshUnsubscribe();
      foregroundUnsubscribe();
      responseListener.remove();
    };
  }

  /**
   * Handle navigation when user taps on notification
   */
  private handleNotificationNavigation(data: any) {
    // You can implement navigation logic here based on the notification data
    // For example:
    // - Navigate to a specific prayer
    // - Navigate to a group
    // - Navigate to notifications screen
    
    if (data?.type === 'prayer') {
      // Navigate to prayer screen
      console.log('Navigate to prayer:', data.prayerId);
    } else if (data?.type === 'group') {
      // Navigate to group screen
      console.log('Navigate to group:', data.groupId);
    }
  }

  /**
   * Get the current push token
   */
  getCurrentPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(title: string, body: string, data?: Record<string, any>) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
  }
}

export default new PushNotificationService();