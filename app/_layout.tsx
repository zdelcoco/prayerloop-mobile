import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { PersistGate } from 'redux-persist/integration/react';
import * as SplashScreen from 'expo-splash-screen';
import store, { persistor } from '../store/store';
import { validateToken } from '../store/authSlice';
import { usePushNotifications } from '../hooks/usePushNotifications';
import SplashView from '../components/ui/SplashView';

// Keep splash visible until we're ready
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const router = useRouter();
  const dispatch = useDispatch();

  // Initialize push notifications for authenticated users
  usePushNotifications();

  // Validate token on mount (check if expired)
  useEffect(() => {
    dispatch(validateToken());
  }, []);

  // Navigate based on auth state
  useEffect(() => {
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
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    'InstrumentSans-Regular': require('../assets/fonts/InstrumentSans-Regular-BF645daa1019d9e.ttf'),
    'InstrumentSans-Bold': require('../assets/fonts/InstrumentSans-Bold-BF645daa10224d2.ttf'),
    'InstrumentSans-SemiBold': require('../assets/fonts/InstrumentSans-SemiBold-BF645daa0fdb37c.ttf'),
  });

  // Hide splash screen once fonts are loaded and persist is ready
  useEffect(() => {
    if (fontsLoaded && appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appIsReady]);

  const onBeforeLift = useCallback(() => {
    // Called when PersistGate is ready (state rehydrated)
    setAppIsReady(true);
  }, []);

  // Show nothing while fonts are loading - native splash screen will show
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#90C590' }}>
      <StatusBar barStyle='dark-content' />
      <Provider store={store}>
        <PersistGate
          loading={<SplashView />}
          persistor={persistor}
          onBeforeLift={onBeforeLift}
        >
          <RootLayoutNav />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

