import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import MainButton from '../ui/MainButton';
import { formatPhoneNumberInput } from '../../util/phoneFormatter';
import { User } from '../../util/shared.types';
import { changeUserPassword } from '../../util/changeUserPassword';
import { deleteUserAccount } from '../../util/deleteUserAccount';
import { RootState, AppDispatch } from '../../store/store';
import { logout } from '../../store/authSlice';
import ChangePasswordModal from './ChangePasswordModal';

interface UserEditModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => void;
  isSaving?: boolean;
}

interface EditableUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState<EditableUserData>({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
  });
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (visible) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [visible, user]);

  const updateField = (field: keyof EditableUserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onPhoneNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, phoneNumber: cleaned }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required.');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    // Call the parent save handler with the updated data
    onSave({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
    });
  };

  const handleCancel = () => {
    // Check if any changes have been made
    const hasChanges =
      formData.firstName !== (user.firstName || '') ||
      formData.lastName !== (user.lastName || '') ||
      formData.email !== (user.email || '') ||
      formData.phoneNumber !== (user.phoneNumber || '');

    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      // No changes made, just close the modal
      onClose();
    }
  };

  const handleChangePasswordPress = () => {
    setChangePasswordModalVisible(true);
  };

  const handleChangePasswordSave = async (currentPassword: string, newPassword: string) => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to change your password.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changeUserPassword(token, user.userProfileId, {
        oldPassword: currentPassword,
        newPassword: newPassword,
      });

      if (result.success) {
        Alert.alert('Success', 'Your password has been changed successfully!');
        setChangePasswordModalVisible(false);
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to change password. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Error changing password:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangePasswordClose = () => {
    setChangePasswordModalVisible(false);
  };

  const handleDeleteAccountPress = () => {
    // First confirmation
    Alert.alert(
      'Delete Account',
      'Deleting your account will permanently delete all your data, including prayers, groups, and preferences. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Warning',
              'This action is irreversible. Your account and all associated data will be permanently deleted. Continue?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: handleDeleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to delete your account.');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const result = await deleteUserAccount(token, user.userProfileId);

      if (result.success) {
        // Close the modal immediately
        onClose();

        // Logout immediately to prevent any data fetching
        dispatch(logout());

        // Show success message after logout (user will see it on login screen)
        setTimeout(() => {
          Alert.alert(
            'Account Deleted',
            'Your account has been permanently deleted.'
          );
        }, 500);
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to delete account. Please try again.'
        );
        setIsDeletingAccount(false);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Error deleting account:', error);
      setIsDeletingAccount(false);
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
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <Text style={styles.title}>Edit Profile</Text>

              <Text style={styles.fieldLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#666"
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                autoCapitalize="words"
                autoCorrect={false}
              />

              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#666"
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                autoCapitalize="words"
                autoCorrect={false}
              />

              <Text style={styles.fieldLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor="#666"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#666"
                value={formatPhoneNumberInput(formData.phoneNumber)}
                onChangeText={onPhoneNumberChange}
                keyboardType="phone-pad"
                maxLength={14}
              />

              <Text style={styles.requiredText}>* Required fields</Text>

              <View style={styles.buttonRow}>
                <MainButton
                  title="Cancel"
                  onPress={handleCancel}
                  buttonStyle={{ ...styles.cancelButton, ...styles.halfWidth }}
                  disabled={isSaving}
                />
                <MainButton
                  title={isSaving ? "Saving..." : "Save Changes"}
                  onPress={handleSave}
                  buttonStyle={{ ...styles.saveButton, ...styles.halfWidth }}
                  disabled={isSaving}
                />
              </View>

              <MainButton
                title="Change Password"
                onPress={handleChangePasswordPress}
                buttonStyle={styles.togglePasswordButton}
                textStyle={styles.togglePasswordText}
                disabled={isDeletingAccount}
              />

              <MainButton
                title={isDeletingAccount ? "Deleting..." : "Delete Account"}
                onPress={handleDeleteAccountPress}
                buttonStyle={styles.deleteAccountButton}
                textStyle={styles.deleteAccountText}
                disabled={isDeletingAccount || isSaving}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <ChangePasswordModal
        visible={changePasswordModalVisible}
        onClose={handleChangePasswordClose}
        onSave={handleChangePasswordSave}
        isSaving={isChangingPassword}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  container: {
    flex: 1,
  },
  deleteAccountButton: {
    backgroundColor: '#ef606fff',
    marginBottom: 12,
  },
  deleteAccountText: {
    color: '#fff',
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    marginBottom: 12,
    padding: 15,
  },
  requiredText: {
    color: '#666',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#008000',
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
  title: {
    color: '#000',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  togglePasswordButton: {
    backgroundColor: '#90c590',
    marginBottom: 12,
  },
  togglePasswordText: {
    color: '#333',
  },
});

export default UserEditModal;