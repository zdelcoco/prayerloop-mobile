import React, { forwardRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import DrawerLayout, {
  DrawerPosition,
  DrawerType,
  DrawerLayoutMethods,
} from 'react-native-gesture-handler/ReanimatedDrawerLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';
import ProfileContent from './ProfileContent';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.85;
const DARK_ICON = '#2d3e31';

interface ProfileDrawerProps {
  children: React.ReactNode;
}

const ProfileDrawer = forwardRef<DrawerLayoutMethods, ProfileDrawerProps>(
  function ProfileDrawer({ children }, ref) {
    const insets = useSafeAreaInsets();
    const user = useAppSelector((state: RootState) => state.auth.user);

    const handleCloseDrawer = () => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.closeDrawer();
      }
    };

    const renderDrawerContent = () => {
      return (
        <LinearGradient
          colors={['#90C590', '#F6EDD9']}
          style={styles.drawerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={[styles.drawerHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable
              onPress={handleCloseDrawer}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <FontAwesome name="times" size={18} color={DARK_ICON} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.drawerScrollView}
            contentContainerStyle={[
              styles.drawerScrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {user && (
              <ProfileContent
                user={user}
                onUserUpdate={(updatedUser) => {
                  console.log('User updated from drawer:', updatedUser);
                }}
              />
            )}
          </ScrollView>
        </LinearGradient>
      );
    };

    return (
      <DrawerLayout
        ref={ref}
        drawerWidth={DRAWER_WIDTH}
        drawerPosition={DrawerPosition.RIGHT}
        drawerType={DrawerType.FRONT}
        overlayColor="rgba(0, 0, 0, 0.5)"
        renderNavigationView={renderDrawerContent}
      >
        {children}
      </DrawerLayout>
    );
  }
);

export default ProfileDrawer;

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(204, 240, 204, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 36,
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  drawerGradient: {
    flex: 1,
  },
  drawerHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  drawerScrollContent: {
    paddingHorizontal: 0,
  },
  drawerScrollView: {
    flex: 1,
  },
});
