import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { login, memoizedAuthSelector } from '../../store/authSlice';
import LoginView from '@/components/login/LoginView';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import LoadingModal from '@/components/ui/LoadingModal';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { error, status } = useAppSelector(memoizedAuthSelector);

  const handleLogin = (username: string, password: string) => {
    dispatch(login(username, password));
  };

  const handleSignupPress = () => {
    router.push('/signup');
  };

  if (status === 'failed') {
    console.log(error);
  }

  return (
    <>
      <LoadingModal
        visible={status === 'loading'}
        message='Logging in...'
      />
      <LoginView
        onPress={handleLogin}
        onSignupPress={handleSignupPress}
        errorMessage={status === 'failed' && error ? error : undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});
