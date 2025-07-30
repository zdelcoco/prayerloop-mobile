import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signup, memoizedAuthSelector } from '../../store/authSlice';
import SignupView from '@/components/signup/SignupView';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import LoadingModal from '@/components/ui/LoadingModal';
import { SignupRequest } from '@/util/signup.types';

export default function SignupScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { error, status } = useAppSelector(memoizedAuthSelector);

  const handleSignup = (signupData: SignupRequest) => {
    dispatch(signup(signupData));
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  const [loadingModalVisible, setLoadingModalVisible] = useState(
    status === 'loading'
  );

  const toggleLoadingModal = () => setLoadingModalVisible(!loadingModalVisible);

  // Handle signup success/failure
  React.useEffect(() => {
    if (status === 'succeeded') {
      Alert.alert(
        'Account Created Successfully!',
        'Your account has been created. Please sign in to continue.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } else if (status === 'failed' && error) {
      Alert.alert(
        'Signup Failed',
        error,
        [{ text: 'OK' }]
      );
    }
  }, [status, error, router]);

  if (status === 'failed') {
    console.log(error);
  }

  return (
    <>
      <LoadingModal
        visible={status === 'loading' || loadingModalVisible}
        message='Creating account...'
        onClose={toggleLoadingModal}
      />
      <SignupView
        onPress={handleSignup}
        onBackToLogin={handleBackToLogin}
        errorMessage={status === 'failed' && error ? error : undefined}
      />
    </>
  );
}