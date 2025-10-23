import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { useFonts } from 'expo-font';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import store from '../store/store';
import { usePushNotifications } from '../hooks/usePushNotifications';

// Custom Splash Screen Component
function SplashScreen() {
  return (
    <View style={styles.gradient}>
      <Text style={styles.text}>prayerloop</Text>
    </View>
  );
}

function RootLayoutNav() {
  const isAuthenticated = useSelector(
    (state: any) => state.auth.isAuthenticated
  );
  const router = useRouter();

  // Initialize push notifications for authenticated users
  usePushNotifications();

  useEffect(() => {
    // Navigate immediately when auth state changes
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)/cards');
    }
  }, [isAuthenticated]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'InstrumentSans-Regular': require('../assets/fonts/InstrumentSans-Regular-BF645daa1019d9e.ttf'),
    'InstrumentSans-Bold': require('../assets/fonts/InstrumentSans-Bold-BF645daa10224d2.ttf'),
    'InstrumentSans-SemiBold': require('../assets/fonts/InstrumentSans-SemiBold-BF645daa0fdb37c.ttf'),
  });

  // Show splash screen while fonts are loading
  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar barStyle='dark-content' />
      <Provider store={store}>
        <RootLayoutNav />
      </Provider>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: '100%',
    backgroundColor: '#90C590',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 48,
    marginBottom: 20,    
    fontFamily: 'InstrumentSans-SemiBold',
    color: '#FFFFFF',
  }
});