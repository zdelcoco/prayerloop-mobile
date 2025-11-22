import {
  KeyboardAvoidingView,
  Text,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  Platform,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
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
}

function LoginView({ onPress, onSignupPress, errorMessage }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);

  // Password reset modal states
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [verifyCodeVisible, setVerifyCodeVisible] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    loadSavedCredentialsForDisplay();
  }, []);

  const loadSavedCredentialsForDisplay = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('rememberedUsername');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');

      if (savedUsername && savedPassword) {
        // Pre-fill the form with saved credentials
        setUsername(savedUsername);
        setPassword(savedPassword);
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            returnKeyType="next"
            onSubmitEditing={() => {
              // Focus password field when pressing "next" on keyboard
            }}
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
            returnKeyType="done"
            onSubmitEditing={onSignIn}
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    paddingBottom: 18,
  },
  forgotPassword: {
    color: '#008000',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  gradient: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    marginBottom: 12,
    padding: 15,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingTop: 8,
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
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  subtitle: {
    color: '#666',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    marginBottom: 20,
  },
  title: {
    color: '#000',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 24,
    marginBottom: 8,
  },
});

export default LoginView;
