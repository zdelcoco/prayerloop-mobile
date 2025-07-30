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
import { LinearGradient } from 'expo-linear-gradient';
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
  gradient: {
    flex: 1,
    width: '100%',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: '100%',
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
  errorInput: {
    borderWidth: 1,
    borderColor: 'red',
  },
  successInput: {
    borderWidth: 1,
    borderColor: 'green',
  },
  passwordError: {
    color: 'red',
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
    marginBottom: 12,
    marginTop: -8,
  },
  requiredText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#008000',
    marginBottom: 20,
  },
  signUpButton: {
    backgroundColor: '#008000',
  },
  backButton: {
    backgroundColor: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
  },
  backToLoginContainer: {
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#008000',
    fontSize: 16,
    fontFamily: 'InstrumentSans-Regular',
  },
  errorText: {
    color: 'red',
    paddingBottom: 18,
  },
  usernameStatusText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'InstrumentSans-Regular',
    marginTop: -8,
    marginBottom: 8,
  },
  usernameAvailableText: {
    color: 'green',
    fontSize: 12,
    fontFamily: 'InstrumentSans-Regular',
    marginTop: -8,
    marginBottom: 8,
  },
  usernameTakenText: {
    color: 'red',
    fontSize: 12,
    fontFamily: 'InstrumentSans-Regular',
    marginTop: -8,
    marginBottom: 8,
  },
  usernameErrorText: {
    color: 'orange',
    fontSize: 12,
    fontFamily: 'InstrumentSans-Regular',
    marginTop: -8,
    marginBottom: 8,
  },
});

export default SignupView;
