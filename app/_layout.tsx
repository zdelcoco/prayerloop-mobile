import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { PersistGate } from 'redux-persist/integration/react';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store, { persistor } from '../store/store';
import { useAppDispatch } from '../store/hooks';
import { validateToken, loginSuccess, logoutSuccess } from '../store/authSlice';
import { clearUserPrayers } from '../store/userPrayersSlice';
import { clearUserGroups } from '../store/groupsSlice';
import { setupApiClient } from '../util/apiClient';
import { usePushNotifications } from '../hooks/usePushNotifications';
import SplashView from '../components/ui/SplashView';
import InstrumentSansRegular from '../assets/fonts/InstrumentSans-Regular.ttf';
import InstrumentSansBold from '../assets/fonts/InstrumentSans-Bold.ttf';
import InstrumentSansSemiBold from '../assets/fonts/InstrumentSans-SemiBold.ttf';

// Setup API client with store and actions for 401 handling and auto re-login
setupApiClient(store, loginSuccess, logoutSuccess, clearUserPrayers, clearUserGroups);

// Keep splash visible until we're ready
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isTokenValidated } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Initialize push notifications for authenticated users
  usePushNotifications();

  // Validate token on mount (check if expired)
  useEffect(() => {
    dispatch(validateToken());
  }, []);

  // Navigate based on auth state - only after token validation completes
  useEffect(() => {
    // Wait for token validation to complete before navigating
    if (!isTokenValidated) {
      return;
    }

    const handleNavigation = async () => {
      if (!isAuthenticated) {
        router.replace('/(auth)/login');
      } else {
        // Check for pending group invite from deep link
        try {
          const pendingInvite = await AsyncStorage.getItem('pendingGroupInvite');
          if (pendingInvite) {
            // Clear the pending invite
            await AsyncStorage.removeItem('pendingGroupInvite');
            // Navigate to groups tab first
            router.replace('/(tabs)/groups');
            // Then open the join modal with the code
            setTimeout(() => {
              router.push({
                pathname: '/(tabs)/groups/JoinGroupModal',
                params: { code: pendingInvite },
              });
            }, 100);
          } else {
            // Normal navigation to cards
            router.replace('/(tabs)/cards');
          }
        } catch (error) {
          console.error('Error checking pending invite:', error);
          router.replace('/(tabs)/cards');
        }
      }
    };

    handleNavigation();
  }, [isAuthenticated, isTokenValidated, router]);

  return (
    <Stack
      screenOptions={{
        animation: 'fade',
        animationDuration: 300,
        headerShown: false,
      }}
    >
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='join-group' options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    'InstrumentSans-Regular': InstrumentSansRegular,
    'InstrumentSans-Bold': InstrumentSansBold,
    'InstrumentSans-SemiBold': InstrumentSansSemiBold,
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

