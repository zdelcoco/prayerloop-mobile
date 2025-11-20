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
import { useState, useEffect } from 'react';
import MainButton from '../ui/MainButton';
import { SignupRequest } from '../../util/signup.types';
import { checkUsernameAvailability, UsernameCheckResponse } from '../../util/usernameCheck';
import { formatPhoneNumberInput } from '../../util/phoneFormatter';

interface SignupViewProps {
  onPress: (signupData: SignupRequest) => void;
  onBackToLogin: () => void;
  errorMessage?: string;
}

function SignupView({ onPress, onBackToLogin, errorMessage }: SignupViewProps) {
  const [formData, setFormData] = useState<SignupRequest>({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const updateField = (field: keyof SignupRequest, value: string) => {
    setShowError(false);
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Handle username availability checking
    if (field === 'username') {
      setUsernameStatus('idle');
      
      // Clear existing timeout
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout);
      }
      
      // Set new timeout for username check (debounce)
      if (value.trim() !== '') {
        const timeout = setTimeout(() => {
          checkUsername(value.trim());
        }, 800); // 800ms delay
        setUsernameCheckTimeout(timeout);
      }
    }
  };

  const checkUsername = async (username: string) => {
    setUsernameStatus('checking');
    
    const result = await checkUsernameAvailability(username);
    
    if (result.success) {
      const response = result.data as UsernameCheckResponse;
      setUsernameStatus(response.available ? 'available' : 'taken');
    } else {
      setUsernameStatus('error');
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout);
      }
    };
  }, [usernameCheckTimeout]);

  const onPhoneNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setShowError(false);
    setFormData(prev => ({ ...prev, phoneNumber: cleaned })); // Store unformatted
  };

  const onConfirmPasswordChange = (text: string) => {
    setShowError(false);
    setConfirmPassword(text);
  };

  const onNext = () => {
    setShowError(true);
    
    // Validate step 1 fields
    if (!formData.username || !formData.password || !confirmPassword) {
      return;
    }
    
    if (formData.password !== confirmPassword) {
      return;
    }
    
    if (usernameStatus === 'taken') {
      return;
    }
    
    setCurrentStep(2);
    setShowError(false);
  };

  const onBack = () => {
    setCurrentStep(1);
    setShowError(false);
  };

  const onSignUp = () => {
    setShowError(true);
    
    // Validate step 2 fields
    if (!formData.firstName || !formData.lastName || !formData.email) {
      return;
    }
    
    onPress(formData);
  };

  const passwordsMatch =
    formData.password === confirmPassword || confirmPassword === '';

  const renderStepOne = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Create Account</Text>
      {errorMessage && showError ? (
        <Text style={[styles.subtitle, styles.errorText]}>
          {errorMessage}
        </Text>
      ) : (
        <Text style={styles.subtitle}>
          Step 1 of 2: Choose your login credentials
        </Text>
      )}

      <View>
        <TextInput
          style={[
            styles.input,
            usernameStatus === 'taken' && styles.errorInput,
            usernameStatus === 'available' && styles.successInput,
          ]}
          placeholder='Username *'
          placeholderTextColor={'#666'}
          value={formData.username}
          onChangeText={(text) => updateField('username', text)}
          autoCapitalize='none'
          autoCorrect={false}
          textContentType="username"
          autoComplete="username-new"
        />
        {usernameStatus === 'checking' && (
          <Text style={styles.usernameStatusText}>Checking availability...</Text>
        )}
        {usernameStatus === 'available' && (
          <Text style={styles.usernameAvailableText}>✓ Username is available</Text>
        )}
        {usernameStatus === 'taken' && (
          <Text style={styles.usernameTakenText}>✗ Username is already taken</Text>
        )}
        {usernameStatus === 'error' && (
          <Text style={styles.usernameErrorText}>Error checking username</Text>
        )}
      </View>

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
        <Text style={styles.passwordError}>Passwords do not match</Text>
      )}

      <Text style={styles.requiredText}>* Required fields</Text>

      <MainButton
        title='Next'
        onPress={onNext}
        accessibilityLabel='Continue to personal information'
        buttonStyle={styles.nextButton}
      />

      <Pressable onPress={onBackToLogin} style={styles.backToLoginContainer}>
        <Text style={styles.backToLoginText}>
          Already have an account? Sign In
        </Text>
      </Pressable>
    </View>
  );

  const renderStepTwo = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Personal Information</Text>
      {errorMessage && showError ? (
        <Text style={[styles.subtitle, styles.errorText]}>
          {errorMessage}
        </Text>
      ) : (
        <Text style={styles.subtitle}>
          Step 2 of 2: Tell us about yourself
        </Text>
      )}

      <TextInput
        style={styles.input}
        placeholder='First Name *'
        placeholderTextColor={'#666'}
        value={formData.firstName}
        onChangeText={(text) => updateField('firstName', text)}
        autoCorrect={false}
        textContentType="givenName"
        autoComplete="name-given"
      />

      <TextInput
        style={styles.input}
        placeholder='Last Name *'
        placeholderTextColor={'#666'}
        value={formData.lastName}
        onChangeText={(text) => updateField('lastName', text)}
        autoCorrect={false}
        textContentType="familyName"
        autoComplete="name-family"
      />

      <TextInput
        style={styles.input}
        placeholder='Email *'
        placeholderTextColor={'#666'}
        value={formData.email}
        onChangeText={(text) => updateField('email', text)}
        keyboardType='email-address'
        autoCapitalize='none'
        textContentType="emailAddress"
        autoComplete="email"
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

      <View style={styles.buttonRow}>
        <MainButton
          title='Back'
          onPress={onBack}
          accessibilityLabel='Go back to credentials'
          buttonStyle={{...styles.backButton, ...styles.halfWidth}}
        />
        <MainButton
          title='Sign Up'
          onPress={onSignUp}
          accessibilityLabel='Create your account'
          buttonStyle={{...styles.signUpButton, ...styles.halfWidth}}
        />
      </View>
    </View>
  );

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
          {currentStep === 1 ? renderStepOne() : renderStepTwo()}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: '#666',
  },
  backToLoginContainer: {
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#008000',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  errorInput: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    paddingBottom: 18,
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
  halfWidth: {
    flex: 1,
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
  nextButton: {
    backgroundColor: '#008000',
    marginBottom: 20,
  },
  passwordError: {
    color: 'red',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginBottom: 12,
    marginTop: -8,
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
  },
  subtitle: {
    color: '#666',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    marginBottom: 20,
  },
  successInput: {
    borderColor: 'green',
    borderWidth: 1,
  },
  title: {
    color: '#000',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 24,
    marginBottom: 8,
  },
  usernameAvailableText: {
    color: 'green',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
  usernameErrorText: {
    color: 'orange',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
  usernameStatusText: {
    color: '#666',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
  usernameTakenText: {
    color: 'red',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
});

export default SignupView;
