import React from 'react';
import { Text, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Constants from 'expo-constants';

import UserCard from '@/components/Home/UserCard';
import UserPreferencesCard from '@/components/Home/UserPreferencesCard';
import PrayerReminderCard from '@/components/Home/PrayerReminderCard';
import StartPrayerSessionCard from '@/components/Home/StartPrayerSessionCard';

interface User {
  userProfileId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  username: string;
  admin: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdBy: number;
  updatedBy: number;
  datetimeCreate: string;
  datetimeUpdate: string;
  deleted: boolean;
}

interface ProfileContentProps {
  user: User;
  onUserUpdate?: (updatedUser: Partial<User>) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function ProfileContent({ user, onUserUpdate, containerStyle }: ProfileContentProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <UserCard
        user={user}
        onUserUpdate={(updatedUser) => {
          console.log('User updated successfully:', updatedUser);
          onUserUpdate?.(updatedUser);
        }}
      />

      <StartPrayerSessionCard />
      <PrayerReminderCard />
      <UserPreferencesCard />

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          v{Constants.expoConfig?.version}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
