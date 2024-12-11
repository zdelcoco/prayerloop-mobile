import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { useFonts } from 'expo-font';
import store from '../store/store';

function RootLayoutNav() {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/intro');
    } else {
      router.replace('/(tabs)/cards');
    }
  }, [isAuthenticated]);

  return <Slot />;
}

export default function RootLayout() {

  const [fontsLoaded] = useFonts({
    'InstrumentSans-Regular': require('../assets/fonts/InstrumentSans-Regular-BF645daa1019d9e.ttf'),
    'InstrumentSans-Bold': require('../assets/fonts/InstrumentSans-Bold-BF645daa10224d2.ttf'),
    'InstrumentSans-SemiBold': require('../assets/fonts/InstrumentSans-SemiBold-BF645daa0fdb37c.ttf'),
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
