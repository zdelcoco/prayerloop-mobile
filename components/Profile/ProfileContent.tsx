import React from 'react';
import { Text, View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '@/hooks/redux';
import { logout } from '@/store/authSlice';

import UserProfileCard from '@/components/Home/UserProfileCard';
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
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <UserProfileCard user={user} />

      <StartPrayerSessionCard />
      <PrayerReminderCard />
      <UserPreferencesCard />

      <View style={styles.logoutContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#c62828" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>

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
  logoutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    borderColor: 'rgba(198, 40, 40, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(198, 40, 40, 0.2)',
  },
  logoutContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: '#c62828',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    color: '#5a6b5e',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    opacity: 0.8,
  },
});
