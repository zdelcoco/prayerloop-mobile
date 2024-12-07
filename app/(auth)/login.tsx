import { useDispatch } from 'react-redux';
import { login } from '../../store/authSlice'; // Adjust this import path as needed

import LoginView from '@/components/ui/LoginView';

export default function LoginScreen() {
  const dispatch = useDispatch();

  const handleLogin = () => {
    // Dispatch action to set isAuthenticated to true
    dispatch(login());
  };

  return (
    <LoginView onPress={handleLogin} />
  );
}
