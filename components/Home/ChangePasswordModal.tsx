import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import MainButton from '../ui/MainButton';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (currentPassword: string, newPassword: string) => void;
  isSaving?: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [visible]);

  const handleSave = () => {
    // Validate current password
    if (!currentPassword.trim()) {
      Alert.alert('Validation Error', 'Current password is required.');
      return;
    }

    // Validate new password
    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'New password is required.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return;
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password.');
      return;
    }

    // Call the parent save handler
    onSave(currentPassword, newPassword);
  };

  const handleCancel = () => {
    if (currentPassword || newPassword || confirmPassword) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to cancel? Your changes will not be saved.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient
        colors={['#90C590', '#F6EDD9']}
        style={styles.gradient}
        end={{ x: 1, y: 0.6 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>
              Enter your current password and choose a new password.
            </Text>

            <Text style={styles.fieldLabel}>Current Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your current password"
              placeholderTextColor="#666"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
            />

            <Text style={styles.fieldLabel}>New Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your new password"
              placeholderTextColor="#666"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="password-new"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
            />

            <Text style={styles.fieldLabel}>Confirm New Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your new password"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="password-new"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
            />

            <Text style={styles.helperText}>
              Password must be at least 6 characters long.
            </Text>

            <View style={styles.buttonRow}>
              <MainButton
                title="Cancel"
                onPress={handleCancel}
                buttonStyle={{ ...styles.cancelButton, ...styles.halfWidth }}
                disabled={isSaving}
              />
              <MainButton
                title={isSaving ? "Saving..." : "Save Password"}
                onPress={handleSave}
                buttonStyle={{ ...styles.saveButton, ...styles.halfWidth }}
                disabled={isSaving}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  fieldLabel: {
    color: '#333',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    marginBottom: 6,
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 20,
  },
  gradient: {
    flex: 1,
  },
  halfWidth: {
    flex: 1,
  },
  helperText: {
    color: '#666',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    marginBottom: 12,
    padding: 15,
  },
  saveButton: {
    backgroundColor: '#008000',
  },
  subtitle: {
    color: '#666',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  title: {
    color: '#000',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default ChangePasswordModal;
