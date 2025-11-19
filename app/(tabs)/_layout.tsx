import { Tabs } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/hooks/redux';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { Dimensions, StyleSheet, View, Text, Animated, Pressable } from 'react-native';
import { RootState } from '@/store/store';
import ContextMenuButton from '@/components/ui/ContextMenuButton';
import { useEffect, useRef } from 'react';

import Colors from '@/constants/Colors';

// Custom tab button with animated bubble effect
function TabButton({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
  const fadeAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0.9,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.tabButton}>
      {/* Animated background pill */}
      <Animated.View
        style={[
          styles.tabButtonBackground,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      />
      {/* Icon and label on top */}
      <FontAwesome
        name={icon as any}
        size={22}
        color={focused ? '#E8F5E8' : '#666'}
        style={styles.tabIcon}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
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
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            height: 90,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarIconStyle: {
            width: 80,
            height: 40,
          },
          tabBarShowLabel: false, // Hide default labels since we're using custom component
        }}
      >
        <Tabs.Screen
          name='cards'
          options={{
            title: 'Prayer Cards',
            tabBarIcon: ({ focused }) => (
              <TabButton focused={focused} icon="vcard" label="Cards" />
            ),
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
            tabBarIcon: ({ focused }) => (
              <TabButton focused={focused} icon="home" label="Home" />
            ),
            headerRight: () => (
              <ContextMenuButton type="home" iconSize={ms(20)} />
            ),
          }}
        />
        <Tabs.Screen
          name='groups'
          options={{
            title: 'Groups',
            tabBarIcon: ({ focused }) => (
              <TabButton focused={focused} icon="users" label="Groups" />
            ),
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  searchButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 75,
    position: 'relative',
  },
  tabButtonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#008000',
    borderRadius: 24,
  },
  tabIcon: {
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 14,
    marginTop: 2,
    color: '#666', // Darker gray for better readability
    fontWeight: '500',
    zIndex: 1,
  },
  tabLabelActive: {
    color: '#E8F5E8', // Green for active state
    fontWeight: '600',
  },
});
