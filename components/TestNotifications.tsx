import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import pushNotificationService from '../services/pushNotificationService';
import { sendPushNotification } from '../util/sendPushNotification';

export default function TestNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useSelector((state: RootState) => state.auth);
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSetupNotifications = async () => {
    if (!token) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    setIsLoading(true);
    try {
      const success = await pushNotificationService.setupPushNotifications(token);
      Alert.alert(
        'Setup Complete', 
        success ? 'Push notifications enabled!' : 'Setup failed'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to setup notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLocalNotification = async () => {
    try {
      await pushNotificationService.scheduleLocalNotification(
        'Test Local Notification',
        'This is a test notification from your app!'
      );
      Alert.alert('Success', 'Local notification scheduled');
    } catch (error) {
      Alert.alert('Error', 'Failed to send local notification');
    }
  };

  const handleTestPushNotification = async () => {
    if (!token || !user) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPushNotification(
        {
          userIds: [user.userProfileId],
          title: '🙏 Test Push Notification',
          body: 'This is a test from your backend!',
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
          },
          priority: 'high',
          sound: 'default',
        },
        token
      );

      Alert.alert(
        'Test Result',
        result.success ? 'Push notification sent!' : `Failed: ${result.error}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send push notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notification Testing</Text>
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSetupNotifications}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Setup Push Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.localButton]}
        onPress={handleTestLocalNotification}
      >
        <Text style={styles.buttonText}>Test Local Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.pushButton, isLoading && styles.buttonDisabled]}
        onPress={handleTestPushNotification}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Push Notification</Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        Current token: {pushNotificationService.getCurrentPushToken() ? 'Set' : 'Not set'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#90c590',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  localButton: {
    backgroundColor: '#4CAF50',
  },
  pushButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  info: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 10,
  },
});