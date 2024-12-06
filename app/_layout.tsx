import React, { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import store from '../store/store';

function RootLayoutNav() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)/cards');
    }
  }, [isAuthenticated]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
