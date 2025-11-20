import React from 'react';
import { Text, ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { Dimensions } from 'react-native';
import Constants from 'expo-constants';

import UserCard from '@/components/Home/UserCard';
import UserPreferencesCard from '@/components/Home/UserPreferencesCard';
import PrayerReminderCard from '@/components/Home/PrayerReminderCard';
import StartPrayerSessionCard from '@/components/Home/StartPrayerSessionCard';
import TestNotifications from '@/components/TestNotifications';

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    color: '#666',
    fontSize: 12,
    opacity: 0.6,
  },
});

export default function UserProfile() {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView style={{ paddingTop: headerHeight }} contentContainerStyle={styles.scrollContent}>
        {user && (
          <UserCard
            user={user}
            onUserUpdate={(updatedUser) => {
              console.log('User updated successfully:', updatedUser);
            }}
          />
        )}

        <StartPrayerSessionCard />
        <PrayerReminderCard />
        <UserPreferencesCard />

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            v{Constants.expoConfig?.version}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
