import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { Dimensions } from 'react-native';

import UserCard from '@/components/Home/UserCard';
import UserPreferencesCard from '@/components/Home/UserPreferencesCard';
import PrayerReminderCard from '@/components/Home/PrayerReminderCard';
import StartPrayerSessionCard from '@/components/Home/StartPrayerSessionCard';
import TestNotifications from '@/components/TestNotifications';

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
      <ScrollView style={{ paddingTop: headerHeight }}>
        {user && (
          <UserCard
            user={user}
            onUserUpdate={(updatedUser) => {
              // TODO: Implement user update functionality
              console.log('User update:', updatedUser);
            }}
          />
        )}
        
        <StartPrayerSessionCard />
        <PrayerReminderCard />
        <UserPreferencesCard />
        <TestNotifications />
      </ScrollView>
    </LinearGradient>
  );
}
