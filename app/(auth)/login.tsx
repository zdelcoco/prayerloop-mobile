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

  const handleAutoLogin = (username: string, password: string) => {
    // Auto-login with saved credentials
    dispatch(login(username, password));
  };

  const handleSignupPress = () => {
    router.push('/signup');
  };

  const [loadingModalVisible, setLoadingModalVisible] = useState(
    status === 'loading'
  );

  const toggleLoadingModal = () => setLoadingModalVisible(!loadingModalVisible);

  if (status === 'failed') {
    console.log(error);
  }

  return (
    <>
      <LoadingModal
        visible={status === 'loading' || loadingModalVisible}
        message='Logging in...'
        onClose={toggleLoadingModal}
      />
      <LoginView
        onPress={(username: string, password: string) =>
          handleLogin(username, password)
        }
        onAutoLogin={(username: string, password: string) =>
          handleAutoLogin(username, password)
        }
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
