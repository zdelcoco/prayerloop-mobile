import {
  KeyboardAvoidingView,
  Text,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useState } from 'react';
import MainButton from '../ui/MainButton';
import { SignupRequest } from '../../util/signup.types';
import { formatPhoneNumberInput } from '../../util/phoneFormatter';

interface SignupViewProps {
  onPress: (signupData: SignupRequest) => void;
  onBackToLogin: () => void;
  errorMessage?: string;
}

function SignupView({ onPress, onBackToLogin, errorMessage }: SignupViewProps) {
  const [formData, setFormData] = useState<SignupRequest>({
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showError, setShowError] = useState(false);

  const updateField = (field: keyof SignupRequest, value: string) => {
    setShowError(false);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onPhoneNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setShowError(false);
    setFormData(prev => ({ ...prev, phoneNumber: cleaned })); // Store unformatted
  };

  const onConfirmPasswordChange = (text: string) => {
    setShowError(false);
    setConfirmPassword(text);
  };

  const onSignUp = () => {
    setShowError(true);

    // Validate required fields
    if (!formData.email || !formData.password || !confirmPassword || !formData.firstName) {
      return;
    }

    if (formData.password !== confirmPassword) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return;
    }

    onPress(formData);
  };

  const passwordsMatch =
    formData.password === confirmPassword || confirmPassword === '';

  const isValidEmail = formData.email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={styles.gradient}
      end={{ x: 1, y: 0.6 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            {errorMessage && showError ? (
              <Text style={[styles.subtitle, styles.errorText]}>
                {errorMessage}
              </Text>
            ) : (
              <Text style={styles.subtitle}>
                Fill in your details to get started
              </Text>
            )}

            <TextInput
              style={[
                styles.input,
                !isValidEmail && showError && styles.errorInput,
              ]}
              placeholder='Email *'
              placeholderTextColor={'#666'}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
            />
            {!isValidEmail && showError && (
              <Text style={styles.fieldError}>Please enter a valid email address</Text>
            )}

            <TextInput
              style={styles.input}
              placeholder='Password *'
              placeholderTextColor={'#666'}
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="password-new"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />

            <TextInput
              style={[
                styles.input,
                !passwordsMatch && showError && styles.errorInput,
              ]}
              placeholder='Confirm Password *'
              placeholderTextColor={'#666'}
              value={confirmPassword}
              onChangeText={onConfirmPasswordChange}
              secureTextEntry
              textContentType="password"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
            {!passwordsMatch && showError && (
              <Text style={styles.fieldError}>Passwords do not match</Text>
            )}

            <TextInput
              style={styles.input}
              placeholder='First Name *'
              placeholderTextColor={'#666'}
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="givenName"
              autoComplete="name-given"
            />

            <TextInput
              style={styles.input}
              placeholder='Last Name'
              placeholderTextColor={'#666'}
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="familyName"
              autoComplete="name-family"
            />

            <TextInput
              style={styles.input}
              placeholder='Phone Number'
              placeholderTextColor={'#666'}
              value={formatPhoneNumberInput(formData.phoneNumber || '')}
              onChangeText={onPhoneNumberChange}
              keyboardType='phone-pad'
              maxLength={14}
              textContentType="telephoneNumber"
              autoComplete="tel"
            />

            <Text style={styles.requiredText}>* Required fields</Text>

            <MainButton
              title='Sign Up'
              onPress={onSignUp}
              accessibilityLabel='Create your account'
              buttonStyle={styles.signUpButton}
            />

            <Pressable onPress={onBackToLogin} style={styles.backToLoginContainer}>
              <Text style={styles.backToLoginText}>
                Already have an account? Sign In
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backToLoginContainer: {
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#008000',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  errorInput: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    paddingBottom: 18,
  },
  fieldError: {
    color: 'red',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginBottom: 12,
    marginTop: -8,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  gradient: {
    flex: 1,
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
  keyboardContainer: {
    flex: 1,
  },
  requiredText: {
    color: '#666',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
    padding: 20,
    paddingBottom: 40,
  },
  signUpButton: {
    backgroundColor: '#008000',
    marginBottom: 20,
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

export default SignupView;
