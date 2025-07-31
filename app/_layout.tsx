import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import store from '../store/store';
import IntroView from '@/components/ui/IntroView';

// Custom Splash Screen Component
function SplashScreen() {
  return (
    // <LinearGradient
    //   colors={['#90c590', '#ffffff']}
    //   style={styles.splashContainer}
    //   start={{ x: 0, y: 0 }}
    //   end={{ x: 0, y: 1 }}
    // >
    //   <View style={styles.splashContent}>
    //     <Text style={styles.appName}>prayerloop</Text>
    //   </View>
    // </LinearGradient>
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
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Set ready after component mounts
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Show splash for 2 seconds, then hide splash and let navigation work naturally
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isReady]);

  // Handle navigation after splash is hidden
  useEffect(() => {
    if (!isReady || showSplash) return;

    // Navigate based on auth status
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)/cards');
    }
  }, [isAuthenticated, isReady, showSplash]);

  if (!isReady || showSplash) {
    return <SplashScreen />;
  }

  return (
    <Stack>
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
