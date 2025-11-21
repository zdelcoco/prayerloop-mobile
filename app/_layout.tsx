import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store from '../store/store';
import { login } from '../store/authSlice';
import { usePushNotifications } from '../hooks/usePushNotifications';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const router = useRouter();

  // Initialize push notifications for authenticated users
  usePushNotifications();

  useEffect(() => {
    checkSavedCredentialsAndAutoLogin();
  }, []);

  const checkSavedCredentialsAndAutoLogin = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('rememberedUsername');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');

      if (savedUsername && savedPassword) {
        // Attempt auto-login with saved credentials
        await store.dispatch(login(savedUsername, savedPassword));
      }
    } catch (error) {
      console.error('Auto-login check failed:', error);
    } finally {
      // Auth check complete - hide splash and allow navigation
      setIsCheckingAuth(false);
      await SplashScreen.hideAsync();
    }
  };

  // Show nothing while checking auth (splash screen stays visible)
  if (isCheckingAuth) {
    return null;
  }

  useEffect(() => {
    // Navigate when auth state changes
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
      <Stack.Screen name='index' options={{ headerShown: false }} />
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

  // Return null while fonts are loading - native splash screen will show
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle='dark-content' />
      <Provider store={store}>
        <RootLayoutNav />
      </Provider>
    </GestureHandlerRootView>
  );
}

