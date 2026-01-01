import { Tabs, router } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/hooks/redux';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { Dimensions, StyleSheet, View, Animated, Pressable } from 'react-native';
import { RootState } from '@/store/store';
import ContextMenuButton from '@/components/ui/ContextMenuButton';
import ProfileButton from '@/components/ui/ProfileButton';
import ProfileDrawer from '@/components/Profile/ProfileDrawer';
import { useEffect, useRef, useState, useCallback } from 'react';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { DrawerLayoutMethods } from 'react-native-gesture-handler/ReanimatedDrawerLayout';
// Global add button handler - screens register their add action here
// This allows nested screens (like GroupPrayers) to override the default behavior
declare global {
  // eslint-disable-next-line no-var
  var tabBarAddHandler: (() => void) | null;
  // eslint-disable-next-line no-var
  var tabBarAddVisible: boolean;
  // eslint-disable-next-line no-var
  var tabBarHidden: boolean;
}

// Initialize globals
global.tabBarAddHandler = null;
global.tabBarAddVisible = true;
global.tabBarHidden = false;

// Tab configuration for icons (only Cards and Prayer Circles in bottom nav)
const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  cards: { icon: 'vcard', label: 'Cards' },
  groups: { icon: 'users', label: 'Prayer Circles' },
};

// Muted green for inactive states
const MUTED_GREEN = '#ccf0ccff';
// Deep green for active states
const ACTIVE_GREEN = '#2E7D32';
// Dark color for inactive icons
const DARK_ICON = '#2d3e31';

// Animated circular tab button
function FloatingTabButton({
  focused,
  icon,
  label: _label,
  onPress
}: {
  focused: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1 : 0.9,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [focused]);

  return (
    <Pressable onPress={onPress} style={styles.floatingTabButton}>
      <Animated.View
        style={[
          styles.floatingTabCircle,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: focused ? ACTIVE_GREEN : MUTED_GREEN,
          },
        ]}
      >
        <FontAwesome
          name={icon as any}
          size={22}
          color={focused ? '#FFFFFF' : DARK_ICON}
          style={styles.floatingTabIcon}
        />
      </Animated.View>
    </Pressable>
  );
}

// Floating add button for tab bar
function FloatingAddButton({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.8,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.floatingTabButton}
    >
      <Animated.View
        style={[
          styles.floatingAddCircle,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <FontAwesome name="plus" size={22} color={DARK_ICON} style={styles.floatingTabIcon} />
      </Animated.View>
    </Pressable>
  );
}

// Header icon button with circular outline (matches tab button size)
function HeaderIconButton({
  onPress,
  iconName,
  iconType = 'fontawesome',
  size = 20,
}: {
  onPress: () => void;
  iconName: string;
  iconType?: 'fontawesome' | 'ionicons';
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerIconButton,
        pressed && styles.headerIconButtonPressed,
      ]}
    >
      {iconType === 'ionicons' ? (
        <Ionicons name={iconName as any} size={size} color={DARK_ICON} />
      ) : (
        <FontAwesome name={iconName as any} size={size} color={DARK_ICON} />
      )}
    </Pressable>
  );
}

// Custom floating tab bar component
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [addButtonVisible, setAddButtonVisible] = useState(global.tabBarAddVisible);
  const [isHidden, setIsHidden] = useState(global.tabBarHidden);

  // Poll for visibility changes (screens will update global.tabBarAddVisible and global.tabBarHidden)
  useEffect(() => {
    const interval = setInterval(() => {
      if (addButtonVisible !== global.tabBarAddVisible) {
        setAddButtonVisible(global.tabBarAddVisible);
      }
      if (isHidden !== global.tabBarHidden) {
        setIsHidden(global.tabBarHidden);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [addButtonVisible, isHidden]);

  // Handle add button press - calls the registered handler
  const handleAddPress = useCallback(() => {
    if (global.tabBarAddHandler) {
      global.tabBarAddHandler();
    }
  }, []);

  // Don't render if hidden (must be after all hooks)
  if (isHidden) {
    return null;
  }

  // Filter routes to only show those in TAB_CONFIG
  const visibleRoutes = state.routes.filter((route) => TAB_CONFIG[route.name]);

  return (
    <View style={[styles.floatingTabBarContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <BlurView intensity={8} tint="regular" style={styles.floatingTabBarBlur}>
        <View style={styles.floatingTabBarInner}>
          {visibleRoutes.map((route) => {
            const originalIndex = state.routes.findIndex((r) => r.key === route.key);
            const isFocused = state.index === originalIndex;
            const config = TAB_CONFIG[route.name];

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <FloatingTabButton
                key={route.key}
                focused={isFocused}
                icon={config.icon}
                label={config.label}
                onPress={onPress}
              />
            );
          })}
          {/* Vertical divider and add button on the right side - only show if visible */}
          {addButtonVisible && (
            <>
              <View style={styles.tabBarDivider} />
              <FloatingAddButton onPress={handleAddPress} />
            </>
          )}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  const { prayers } = useAppSelector((state: RootState) => state.userPrayers);
  const user = useAppSelector((state: RootState) => state.auth.user);
  const drawerRef = useRef<DrawerLayoutMethods>(null);

  function ms(size: number): number {
    const scale = 1.2;
    return Math.round(size * scale);
  }
  const SCREEN_HEIGHT = Dimensions.get('window').height;

  return (
    <ProfileDrawer ref={drawerRef}>
      <LinearGradient
        colors={['#90C590', '#F6EDD9']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Tabs
          tabBar={(props) => <FloatingTabBar {...props} />}
          screenOptions={{
            headerShown: true,
            headerTransparent: true,
            headerStyle: {
              height: 120, // Increased to fit larger icon buttons
            },
            headerBackground: () => (
              <LinearGradient
                colors={['#90C590', '#F6EDD9']}
                style={{ flex: 1 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: SCREEN_HEIGHT }}
              />
            ),
            headerTitleAlign: 'left',
            headerTitleStyle: {
              fontSize: ms(18),
              fontFamily: 'InstrumentSans-Bold',
            },
            // Hide default tab bar since we're using custom
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen
            name='cards'
            options={{
              title: 'Prayer Cards',
              headerLeft: () => (
                <View style={styles.headerLeftContainer}>
                  <ContextMenuButton type="cards" prayerCount={prayers?.length || 0} iconSize={18} />
                </View>
              ),
              headerRight: () => (
                <View style={styles.headerRightContainer}>
                  <HeaderIconButton
                    onPress={() => {
                      if ((global as any).cardsToggleSearch) {
                        (global as any).cardsToggleSearch();
                      }
                    }}
                    iconName="search"
                    iconType="ionicons"
                    size={18}
                  />
                  <ProfileButton
                    firstName={user?.firstName || ''}
                    lastName={user?.lastName || ''}
                    onPress={() => router.navigate('/userProfile')}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name='userProfile'
            options={{
              title: 'Home',
              href: null, // Hide from tab bar but keep route for compatibility
              headerLeft: () => (
                <View style={styles.headerLeftContainer}>
                  <ContextMenuButton type="cards" prayerCount={prayers?.length || 0} iconSize={18} buttonSize={36} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name='groups'
            options={{
              title: 'Prayer Circles',
              headerLeft: () => (
                <View style={styles.headerLeftContainer}>
                  <ContextMenuButton type="groups" iconSize={18} />
                </View>
              ),
              headerRight: () => (
                <View style={styles.headerRightContainer}>
                  <HeaderIconButton
                    onPress={() => {
                      if ((global as any).groupsToggleSearch) {
                        (global as any).groupsToggleSearch();
                      }
                    }}
                    iconName="search"
                    iconType="ionicons"
                    size={18}
                  />
                  <ProfileButton
                    firstName={user?.firstName || ''}
                    lastName={user?.lastName || ''}
                    onPress={() => router.navigate('/userProfile')}
                  />
                </View>
              ),
            }}
          />
        </Tabs>
      </LinearGradient>
    </ProfileDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  floatingAddCircle: {
    alignItems: 'center',
    backgroundColor: MUTED_GREEN, // Muted tan for add button
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 30,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 60,
  },
  floatingTabBarBlur: {
    borderColor: 'rgba(252, 251, 231, 0.58)',
    borderRadius: 60,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  floatingTabBarContainer: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  floatingTabBarInner: {
    alignItems: 'center',
    backgroundColor: 'rgba(192, 181, 106, 0.09)',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  floatingTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  floatingTabCircle: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 30,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 60,
  },
  floatingTabIcon: {
    zIndex: 1,
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: MUTED_GREEN,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 36,
  },
  headerIconButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)', // Muted green with transparency
  },
  headerLeftContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
    marginRight: 12,
  },
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  tabBarDivider: {
    backgroundColor: ACTIVE_GREEN,
    height: 36,
    marginHorizontal: 8,
    width: 2,
  },
});
