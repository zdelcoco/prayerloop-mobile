import {
  KeyboardAvoidingView,
  Text,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';

import MainButton from '../ui/MainButton';
interface LoginViewProps {
  onPress: (username: string, password: string) => void;
  errorMessage?: string;
}
function LoginView({ onPress, errorMessage }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const onUserNameChange = (text: string) => {
    setShowError(false);
    setUsername(text);
  };

  const onPasswordChange = (text: string) => {
    setShowError(false);
    setPassword(text);
  };

  const onSignIn = () => {
    setShowError(true);
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
            <Text style={[styles.subtitle, styles.errorText]}>{errorMessage}</Text>
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
          />

          <TextInput
            style={styles.input}
            placeholder='Password'
            placeholderTextColor={'#666'}
            value={password}
            onChangeText={onPasswordChange}
            secureTextEntry
          />

          <View style={styles.optionsRow}>
            <View style={styles.rememberMe}>
              <Pressable
                style={[styles.checkbox, rememberMe && styles.checked]}
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text style={styles.rememberText}>Remember me?</Text>
            </View>
            <Pressable onPress={() => console.log('Forgot password')}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </Pressable>
          </View>
          <MainButton
            title='Sign In'
            onPress={onSignIn}
            accessibilityLabel='Sign In to your account'
            buttonStyle={styles.signInButton}
          />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    marginRight: 8,
  },
  checked: {
    backgroundColor: '#008000',
    borderColor: '#008000',
  },
  rememberText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
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
});

export default LoginView;
