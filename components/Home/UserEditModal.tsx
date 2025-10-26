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
import { useSelector } from 'react-redux';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import MainButton from '../ui/MainButton';
import { formatPhoneNumberInput } from '../../util/phoneFormatter';
import { User } from '../../util/shared.types';
import { changeUserPassword } from '../../util/changeUserPassword';
import { RootState } from '../../store/store';
import ChangePasswordModal from './ChangePasswordModal';

interface UserEditModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => void;
  isSaving?: boolean;
}

interface EditableUserData {
  username: string;
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
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
  });
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (visible) {
      setFormData({
        username: user.username || '',
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
    if (!formData.username.trim()) {
      Alert.alert('Validation Error', 'Username is required.');
      return;
    }
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required.');
      return;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required.');
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
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
    });
  };

  const handleCancel = () => {
    // Check if any changes have been made
    const hasChanges =
      formData.username !== (user.username || '') ||
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

              <Text style={styles.fieldLabel}>Username *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#666"
                value={formData.username}
                onChangeText={(text) => updateField('username', text)}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.fieldLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#666"
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                autoCorrect={false}
              />

              <Text style={styles.fieldLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#666"
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
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
  gradient: {
    flex: 1,
  },
  container: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'InstrumentSans-Bold',
    marginBottom: 8,
    color: '#000',
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'InstrumentSans-SemiBold',
    color: '#333',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'InstrumentSans-Regular',
  },
  togglePasswordButton: {
    backgroundColor: '#90c590',
    marginBottom: 12,
  },
  togglePasswordText: {
    color: '#333',
  },
  requiredText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#008000',
  },
});

export default UserEditModal;