import { Tabs } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/hooks/redux';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { Dimensions, StyleSheet, View, Text, Animated, Pressable } from 'react-native';
import { RootState } from '@/store/store';
import ContextMenuButton from '@/components/ui/ContextMenuButton';
import { useEffect, useRef } from 'react';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import Colors from '@/constants/Colors';

// Tab configuration for icons
const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  cards: { icon: 'vcard', label: 'Cards' },
  userProfile: { icon: 'home', label: 'Home' },
  groups: { icon: 'users', label: 'Groups' },
};

// Animated circular tab button
function FloatingTabButton({
  focused,
  icon,
  label,
  onPress
}: {
  focused: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const bgOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0.85,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(bgOpacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Pressable onPress={onPress} style={styles.floatingTabButton}>
      <Animated.View
        style={[
          styles.floatingTabCircle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Active background */}
        <Animated.View
          style={[
            styles.floatingTabActiveBackground,
            { opacity: bgOpacity },
          ]}
        />
        <FontAwesome
          name={icon as any}
          size={22}
          color={focused ? '#FFFFFF' : '#555555'}
          style={styles.floatingTabIcon}
        />
      </Animated.View>
      {/* <Text style={[styles.floatingTabLabel, focused && styles.floatingTabLabelActive]}>
        {label}
      </Text> */}
    </Pressable>
  );
}

// Custom floating tab bar component
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.floatingTabBarContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <BlurView intensity={12} tint="regular" style={styles.floatingTabBarBlur}>
        <View style={styles.floatingTabBarInner}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name] || { icon: 'circle', label: route.name };

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
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  const { prayers } = useAppSelector((state: RootState) => state.userPrayers);

  function ms(size: number): number {
    const scale = 1.2;
    return Math.round(size * scale);
  }
  const SCREEN_HEIGHT = Dimensions.get('window').height;

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerBackground: () => (
            <LinearGradient
              colors={['#90c590', '#ffffff']}
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
            headerRight: () => (
              <View style={styles.headerRightContainer}>
                <Pressable
                  onPress={() => {
                    // Call the global search toggle function
                    if ((global as any).cardsToggleSearch) {
                      (global as any).cardsToggleSearch();
                    }
                  }}
                  style={({ pressed }) => [
                    styles.searchButton,
                    pressed && styles.searchButtonPressed,
                  ]}
                >
                  <Ionicons name="search" size={ms(20)} color="#000" />
                </Pressable>
                <ContextMenuButton type="cards" prayerCount={prayers?.length || 0} iconSize={ms(20)} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name='userProfile'
          options={{
            title: 'Home',
            headerRight: () => (
              <ContextMenuButton type="home" iconSize={ms(20)} />
            ),
          }}
        />
        <Tabs.Screen
          name='groups'
          options={{
            title: 'Groups',
            headerRight: () => (
              <ContextMenuButton type="groups" iconSize={ms(20)} />
            ),
          }}
        />
      </Tabs>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  searchButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  searchButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  // Floating tab bar styles
  floatingTabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  floatingTabBarBlur: {
    borderRadius: 60,
    overflow: 'hidden',
    borderColor: '#2d3e31ff',
    borderWidth: 1,
    // Shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  floatingTabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    gap: 16,
  },
  floatingTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  floatingTabCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingTabActiveBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
    backgroundColor: '#2E7D32', // Deep green for active state
  },
  floatingTabIcon: {
    zIndex: 1,
  },
  // floatingTabLabel: {
  //   fontSize: 11,
  //   marginTop: 4,
  //   color: '#666666',
  //   fontWeight: '500',
  // },
  // floatingTabLabelActive: {
  //   color: '#2E7D32',
  //   fontWeight: '600',
  // },
});
