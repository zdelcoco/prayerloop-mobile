import { Text, StyleSheet } from 'react-native';
import { login, memoizedAuthSelector } from '../../store/authSlice';
import LoginView from '@/components/login/LoginView';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { RootState } from '../../store/store'; // Adjust the import path as needed

export default function LoginScreen() {
  const dispatch = useAppDispatch();

  const { error, status } = useAppSelector(memoizedAuthSelector);

  const handleLogin = (username: string, password: string) => {
    dispatch(login(username, password));
  };

  if (status === 'failed') {
    console.log(error);
  }

  return (
    <>
      <LoginView 
        onPress={(username: string, password: string) => handleLogin(username, password)} 
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
