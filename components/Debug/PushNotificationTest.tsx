import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';
import { RootState } from '@/store/store';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { sendPushNotification } from '@/util/sendPushNotification';

export default function PushNotificationTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const { token: authToken, user } = useSelector((state: RootState) => state.auth);
  const { isSetup, isLoading, pushToken, scheduleLocalNotification } = usePushNotifications();

  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    };
    checkPermissions();
  }, []);

  const handleTestLocalNotification = async () => {
    try {
      await scheduleLocalNotification(
        'Test Local Notification',
        'This is a test notification from your prayer app!',
        { type: 'test', timestamp: Date.now() }
      );
      Alert.alert('Success', 'Local notification scheduled!');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule notification');
      console.error('Local notification error:', error);
    }
  };

  const handleTestPushNotification = async () => {
    if (!authToken || !user) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    setIsTesting(true);
    try {
      const result = await sendPushNotification(
        {
          userIds: [user.userProfileId],
          title: '🙏 Test Prayer Notification',
          body: 'This is a test push notification from your prayer app!',
          data: {
            type: 'test',
            timestamp: Date.now().toString(),
          },
          priority: 'high',
          sound: 'default',
        },
        authToken
      );

      if (result.success) {
        Alert.alert('Success', 'Push notification sent successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to send notification');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send push notification');
      console.error('Push notification error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notification Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Setup Status: {isLoading ? 'Loading...' : isSetup ? '✅ Ready' : '❌ Not Setup'}
        </Text>
        {pushToken && (
          <Text style={styles.tokenText}>
            Token: {pushToken.substring(0, 30)}...
          </Text>
        )}
        {pushToken && (
          <Text style={styles.tokenText}>
            Token Type: {pushToken.startsWith('ExponentPushToken[') ? 'Expo' : 'Native FCM'}
          </Text>
        )}
        <Text style={styles.statusText}>
          Permissions: {permissionStatus}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.localButton]}
          onPress={handleTestLocalNotification}
          disabled={!isSetup}
        >
          <Text style={styles.buttonText}>Test Local Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.pushButton]}
          onPress={handleTestPushNotification}
          disabled={!isSetup || isTesting}
        >
          <Text style={styles.buttonText}>
            {isTesting ? 'Sending...' : 'Test Push Notification'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How to test:</Text>
        <Text style={styles.infoText}>
          1. Local Notification: Shows immediately on this device
        </Text>
        <Text style={styles.infoText}>
          2. Push Notification: Sends through server (requires admin permissions)
        </Text>
        <Text style={styles.infoText}>
          3. Close the app and wait a few seconds to see push notifications
        </Text>
        <Text style={styles.infoText}>
          4. Use Bruno API client to check push receipts with ticket IDs from backend logs
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
    padding: 20,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  infoTitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  localButton: {
    backgroundColor: '#4CAF50',
  },
  pushButton: {
    backgroundColor: '#2196F3',
  },
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
  },
  statusText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  tokenText: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});