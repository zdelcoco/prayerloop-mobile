import React, { useState, useLayoutEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from 'expo-router';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import ProfileContent from '@/components/Profile/ProfileContent';
import PrayerSessionModal from '@/components/PrayerSession/PrayerSessionModal';
import PrayerSourceSelectionModal from '@/components/PrayerSession/PrayerSourceSelectionModal';
import type { Prayer } from '@/util/shared.types';

// This route is kept for deep link compatibility but hidden from tab bar via href: null
export default function UserProfile() {
  const user = useSelector((state: RootState) => state.auth.user);
  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const [sourceSelectionVisible, setSourceSelectionVisible] = useState(false);
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);
  const [sessionPrayers, setSessionPrayers] = useState<Prayer[]>([]);
  const [sessionContextTitle, setSessionContextTitle] = useState('Prayer Session');

  // Set up global function for context menu to trigger prayer session
  useLayoutEffect(() => {
    (global as any).cardsSetPrayerSessionVisible = setSourceSelectionVisible;
    return () => {
      // Don't clear - let the cards screen manage this when it's focused
    };
  }, []);

  // Hide tab bar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      global.tabBarHidden = true;
      return () => {
        global.tabBarHidden = false;
      };
    }, [])
  );

  const handleStartSession = (prayers: Prayer[], contextTitle: string) => {
    setSessionPrayers(prayers);
    setSessionContextTitle(contextTitle);
    setPrayerSessionVisible(true);
  };

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <PrayerSourceSelectionModal
        visible={sourceSelectionVisible}
        onClose={() => setSourceSelectionVisible(false)}
        onStartSession={handleStartSession}
      />
      <PrayerSessionModal
        visible={prayerSessionVisible}
        prayers={sessionPrayers}
        currentUserId={user?.userProfileId || 0}
        onClose={() => {
          setPrayerSessionVisible(false);
          setSessionPrayers([]);
        }}
        contextTitle={sessionContextTitle}
      />
      <ScrollView style={{ paddingTop: headerHeight }} contentContainerStyle={styles.scrollContent}>
        {user && (
          <ProfileContent
            user={user}
            onUserUpdate={(updatedUser) => {
              console.log('User updated successfully:', updatedUser);
            }}
          />
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120, // Extra padding for floating tab bar
  },
});
