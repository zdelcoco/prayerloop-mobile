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
import ForgotPasswordModal from '../auth/ForgotPasswordModal';
import VerifyCodeModal from '../auth/VerifyCodeModal';
import ResetPasswordModal from '../auth/ResetPasswordModal';
import { forgotPassword } from '@/util/forgotPassword';

interface LoginViewProps {
  onPress: (username: string, password: string) => void;
  onSignupPress: () => void;
  errorMessage?: string;
  onAutoLogin?: (username: string, password: string) => void;
}

function LoginView({ onPress, onSignupPress, errorMessage, onAutoLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);

  // Password reset modal states
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [verifyCodeVisible, setVerifyCodeVisible] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    loadSavedCredentialsAndAutoLogin();
  }, []);

  const loadSavedCredentialsAndAutoLogin = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('rememberedUsername');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');

      if (savedUsername && savedPassword) {
        setUsername(savedUsername);
        setPassword(savedPassword);

        // Auto-login if credentials exist and we haven't tried yet
        if (!hasAttemptedAutoLogin && onAutoLogin) {
          setHasAttemptedAutoLogin(true);
          onAutoLogin(savedUsername, savedPassword);
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async (username: string, password: string) => {
    try {
      await AsyncStorage.setItem('rememberedUsername', username);
      await AsyncStorage.setItem('rememberedPassword', password);
    } catch (error) {
      console.error('Error saving credentials:', error);
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

    // Always save credentials for auto-login next time
    await saveCredentials(username, password);

    onPress(username, password);
  };

  // Password reset handlers
  const handleForgotPassword = () => {
    setForgotPasswordVisible(true);
  };

  const handleForgotPasswordSuccess = (email: string) => {
    setResetEmail(email);
    setForgotPasswordVisible(false);
    setVerifyCodeVisible(true);
  };

  const handleVerifyCodeSuccess = (token: string) => {
    setResetToken(token);
    setVerifyCodeVisible(false);
    setResetPasswordVisible(true);
  };

  const handleResendCode = async () => {
    // Close verify modal and reopen forgot password modal
    setVerifyCodeVisible(false);
    const result = await forgotPassword(resetEmail);
    if (result.success) {
      setVerifyCodeVisible(true);
    } else {
      setForgotPasswordVisible(true);
    }
  };

  const handleResetPasswordSuccess = () => {
    setResetPasswordVisible(false);
    setResetEmail('');
    setResetToken('');
  };

  const handleCloseAllModals = () => {
    setForgotPasswordVisible(false);
    setVerifyCodeVisible(false);
    setResetPasswordVisible(false);
    setResetEmail('');
    setResetToken('');
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
            <Pressable onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </Pressable>
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

        {/* Password Reset Modals */}
        <ForgotPasswordModal
          visible={forgotPasswordVisible}
          onClose={() => setForgotPasswordVisible(false)}
          onSuccess={handleForgotPasswordSuccess}
        />

        <VerifyCodeModal
          visible={verifyCodeVisible}
          email={resetEmail}
          onClose={handleCloseAllModals}
          onSuccess={handleVerifyCodeSuccess}
          onResendCode={handleResendCode}
        />

        <ResetPasswordModal
          visible={resetPasswordVisible}
          token={resetToken}
          onClose={handleCloseAllModals}
          onSuccess={handleResetPasswordSuccess}
        />
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    color: '#008000',
    fontSize: 16,
    fontFamily: 'InstrumentSans-Regular',
  },
  signInButton: {
    backgroundColor: '#008000',
    marginTop: 20,
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
  errorText: {
    color: 'red',
    paddingBottom: 18,
  },
});

export default LoginView;
