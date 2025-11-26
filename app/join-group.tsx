import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootState } from '@/store/store';

/**
 * Deep link handler for group invitations
 * Handles URLs like: prayerloop://join-group?code=XXXX-XXXX
 *
 * This route immediately redirects to the JoinGroupModal with the invite code
 * If user is not authenticated, redirects to login and saves code for after login
 */
export default function JoinGroupDeepLink() {
  const params = useLocalSearchParams<{ code?: string }>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    const handleDeepLink = async () => {
      const code = params.code
        ? Array.isArray(params.code)
          ? params.code[0]
          : params.code
        : undefined;

      // Check if user is authenticated
      if (!isAuthenticated) {
        // Save the invite code for after login
        if (code) {
          try {
            await AsyncStorage.setItem('pendingGroupInvite', code);
          } catch (error) {
            console.error('Error saving pending invite code:', error);
          }
        }
        // Redirect to login
        router.replace('/(auth)/login');
        return;
      }

      // User is authenticated, proceed with join flow
      if (code) {
        // First navigate to the base groups tab
        router.replace('/(tabs)/groups');
        // Then push the modal with the code (using setTimeout to ensure groups tab is rendered first)
        setTimeout(() => {
          router.push({
            pathname: '/(tabs)/groups/JoinGroupModal',
            params: { code },
          });
        }, 100);
      } else {
        // If no code provided, just go to groups tab
        router.replace('/(tabs)/groups');
      }
    };

    handleDeepLink();
  }, [params.code, isAuthenticated]);

  // Show loading indicator while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#008000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#90C590',
    flex: 1,
    justifyContent: 'center',
  },
});
