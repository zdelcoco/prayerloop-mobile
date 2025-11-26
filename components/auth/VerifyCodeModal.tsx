import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { verifyResetCode } from '@/util/verifyResetCode';

interface VerifyCodeModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onSuccess: (token: string) => void;
  onResendCode: () => void;
}

export default function VerifyCodeModal({
  visible,
  email,
  onClose,
  onSuccess,
  onResendCode,
}: VerifyCodeModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyResetCode(email, code);

      if (result.success && result.data) {
        // Success - move to reset password step
        onSuccess(result.data.token);
        setCode('');
      } else {
        Alert.alert(
          'Verification Failed',
          result.error?.message || 'Invalid or expired verification code'
        );
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    Alert.alert(
      'Resend Code',
      'Would you like to request a new verification code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resend',
          onPress: () => {
            setCode('');
            onResendCode();
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  const handleCodeChange = (text: string) => {
    // Only allow digits
    const digitsOnly = text.replace(/[^0-9]/g, '');
    if (digitsOnly.length <= 6) {
      setCode(digitsOnly);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder='000000'
            placeholderTextColor='#ccc'
            value={code}
            onChangeText={handleCodeChange}
            keyboardType='number-pad'
            maxLength={6}
            editable={!loading}
            autoFocus
          />

          <Pressable onPress={handleResend} style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive code? Resend</Text>
          </Pressable>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.verifyButton,
                (code.length !== 6 || loading) && styles.disabledButton,
              ]}
              onPress={handleVerify}
              disabled={code.length !== 6 || loading}
            >
              {loading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.helperText}>
            Code expires in 15 minutes • Max 3 attempts
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  emailText: {
    color: '#008000',
    fontWeight: '600',
  },
  helperText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderColor: '#90c590',
    borderRadius: 8,
    borderWidth: 2,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
    textAlign: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 5,
    maxWidth: 400,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '100%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    color: '#008000',
    fontSize: 14,
    fontWeight: '500',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 25,
    textAlign: 'center',
  },
  title: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#008000',
  },
});
