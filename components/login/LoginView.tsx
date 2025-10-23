import {
  KeyboardAvoidingView,
  Text,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '../ui/LinearGradientCompat';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MainButton from '../ui/MainButton';

interface LoginViewProps {
  onPress: (username: string, password: string) => void;
  onSignupPress: () => void;
  errorMessage?: string;
}

function LoginView({ onPress, onSignupPress, errorMessage }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('rememberedUsername');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');
      const shouldRemember = await AsyncStorage.getItem('rememberMe');
      
      if (shouldRemember === 'true' && savedUsername && savedPassword) {
        setUsername(savedUsername);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async (username: string, password: string) => {
    try {
      await AsyncStorage.setItem('rememberedUsername', username);
      await AsyncStorage.setItem('rememberedPassword', password);
      await AsyncStorage.setItem('rememberMe', 'true');
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const clearSavedCredentials = async () => {
    try {
      await AsyncStorage.removeItem('rememberedUsername');
      await AsyncStorage.removeItem('rememberedPassword');
      await AsyncStorage.removeItem('rememberMe');
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  };

  const onUserNameChange = (text: string) => {
    setShowError(false);
    setUsername(text);
  };

  const onPasswordChange = (text: string) => {
    setShowError(false);
    setPassword(text);
  };

  const onSignIn = async () => {
    setShowError(true);
    
    if (rememberMe) {
      await saveCredentials(username, password);
    } else {
      await clearSavedCredentials();
    }
    
    onPress(username, password);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <LinearGradient
        colors={['#90C590', '#F6EDD9']}
        style={styles.gradient}
        end={{ x: 1, y: 0.6 }}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome!</Text>
          {errorMessage && showError ? (
            <Text style={[styles.subtitle, styles.errorText]}>
              {errorMessage}
            </Text>
          ) : (
            <Text style={styles.subtitle}>
              Enter your username and password to get started with prayerloop
            </Text>
          )}

          <TextInput
            style={styles.input}
            placeholder='Username'
            placeholderTextColor={'#666'}
            value={username}
            onChangeText={onUserNameChange}
            autoCapitalize='none'
            textContentType="username"
            autoComplete="username"
          />

          <TextInput
            style={styles.input}
            placeholder='Password'
            placeholderTextColor={'#666'}
            value={password}
            onChangeText={onPasswordChange}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
          />

          <View style={styles.optionsRow}>
            <View style={styles.rememberMe}>
              <Text style={styles.rememberText}>Remember Me</Text>
            </View>
            <Switch
              value={rememberMe}
              onValueChange={async (value) => {
                setRememberMe(value);
                if (!value) {
                  await clearSavedCredentials();
                }
              }}
              thumbColor={rememberMe ? '#white' : 'white'}
              trackColor={{ false: '#ccc', true: '#008000' }}
            />
          </View>
          <MainButton
            title='Sign In'
            onPress={onSignIn}
            accessibilityLabel='Sign In to your account'
            buttonStyle={styles.signInButton}
          />
          
          <Pressable onPress={onSignupPress} style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account? Sign Up
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'InstrumentSans-Bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'InstrumentSans-Regular',
    color: '#666',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'InstrumentSans-Regular',
  },
  optionsRow: {
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'InstrumentSans-Regular',
    marginLeft: 8,
  },
  forgotPassword: {
    color: '#008000',
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
  },
  signInButton: {
    backgroundColor: '#008000',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    paddingBottom: 18,
  },
  signupContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#008000',
    fontSize: 16,
    fontFamily: 'InstrumentSans-Regular',
  },
});

export default LoginView;
