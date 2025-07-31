import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import store from '../store/store';

// Custom Splash Screen Component
function SplashScreen() {
  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={styles.gradient}
      end={{ x: 1, y: 0.6 }}
    >
      <Text style={styles.text}>prayerloop</Text>
    </LinearGradient>
  );
}

function RootLayoutNav() {
  const isAuthenticated = useSelector(
    (state: any) => state.auth.isAuthenticated
  );
  const router = useRouter();

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 48,
    marginBottom: 20,    
    fontFamily: 'InstrumentSans-SemiBold',
  }
});