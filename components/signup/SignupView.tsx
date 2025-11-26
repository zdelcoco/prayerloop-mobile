import {
  KeyboardAvoidingView,
  Text,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  InputAccessoryView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useState, useEffect } from 'react';
import MainButton from '../ui/MainButton';
import { SignupRequest } from '../../util/signup.types';
import { formatPhoneNumberInput } from '../../util/phoneFormatter';

const INPUT_ACCESSORY_ID = 'signupInputAccessory';

interface SignupViewProps {
  onPress: (signupData: SignupRequest) => void;
  onBackToLogin: () => void;
  errorMessage?: string;
}

function SignupView({ onPress, onBackToLogin, errorMessage }: SignupViewProps) {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<SignupRequest>({
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
  <>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <LinearGradient
        colors={['#90C590', '#F6EDD9']}
        style={styles.gradient}
        end={{ x: 1, y: 0.6 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={[
              styles.scrollContent,
              !isKeyboardVisible && styles.scrollContentCentered,
              { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
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
              inputAccessoryViewID={INPUT_ACCESSORY_ID}
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
              inputAccessoryViewID={INPUT_ACCESSORY_ID}
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
              inputAccessoryViewID={INPUT_ACCESSORY_ID}
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
              inputAccessoryViewID={INPUT_ACCESSORY_ID}
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
              inputAccessoryViewID={INPUT_ACCESSORY_ID}
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
              inputAccessoryViewID={INPUT_ACCESSORY_ID}
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
    </TouchableWithoutFeedback>

    {Platform.OS === 'ios' && (
      <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
        <View style={styles.accessoryContainer}>
          <Pressable onPress={Keyboard.dismiss} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </InputAccessoryView>
    )}
  </>
  );
}

const styles = StyleSheet.create({
  accessoryContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#f0f0f0',
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backToLoginContainer: {
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#008000',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  doneButtonText: {
    color: '#008000',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
    fontWeight: '600',
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
    paddingHorizontal: 20,
  },
  scrollContentCentered: {
    justifyContent: 'center',
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
