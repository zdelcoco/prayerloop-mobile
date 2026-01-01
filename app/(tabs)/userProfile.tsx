import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { Dimensions } from 'react-native';
import ProfileContent from '@/components/Profile/ProfileContent';

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120, // Extra padding for floating tab bar
  },
});

// This route is kept for deep link compatibility but hidden from tab bar via href: null
export default function UserProfile() {
  const user = useSelector((state: RootState) => state.auth.user);
  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
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
