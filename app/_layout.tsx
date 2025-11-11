import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { useFonts } from 'expo-font';
import store from '../store/store';
import { usePushNotifications } from '../hooks/usePushNotifications';

function RootLayoutNav() {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const router = useRouter();

  // Initialize push notifications for authenticated users
  usePushNotifications();

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
    <>
      <StatusBar barStyle='dark-content' />
      <Provider store={store}>
        <RootLayoutNav />
      </Provider>
    </>
  );
}

