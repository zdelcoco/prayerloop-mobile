import React from 'react';
import { View, Button, Text } from 'react-native';
import { useDispatch } from 'react-redux';
import { login } from '../../store/authSlice'; // Adjust this import path as needed

export default function LoginScreen() {
  const dispatch = useDispatch();

  const handleLogin = () => {
    // Dispatch action to set isAuthenticated to true
    dispatch(login());
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login Screen</Text>
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
