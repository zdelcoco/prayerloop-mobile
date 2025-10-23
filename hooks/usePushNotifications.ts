import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import PushNotificationService from '@/services/pushNotificationService';

export const usePushNotifications = () => {
  const [isSetup, setIsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  const { token: authToken, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !authToken) {
      return;
    }

    const setupNotifications = async () => {
      setIsLoading(true);
      try {
        const success = await PushNotificationService.setupPushNotifications(authToken);
        setIsSetup(success);
        
        if (success) {
          const token = PushNotificationService.getCurrentPushToken();
          setPushToken(token);
        }
      } catch (error) {
        console.error('Failed to setup push notifications:', error);
        setIsSetup(false);
      } finally {
        setIsLoading(false);
      }
    };

    setupNotifications();

    // Setup notification listeners
    const cleanup = PushNotificationService.setupNotificationListeners();

    return cleanup;
  }, [isAuthenticated, authToken]);

  const requestPermissions = async () => {
    return await PushNotificationService.requestPermissions();
  };

  const scheduleLocalNotification = async (title: string, body: string, data?: Record<string, any>) => {
    return await PushNotificationService.scheduleLocalNotification(title, body, data);
  };

  return {
    isSetup,
    isLoading,
    pushToken,
    requestPermissions,
    scheduleLocalNotification,
  };
};