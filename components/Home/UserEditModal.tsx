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
import { LinearGradient } from 'expo-linear-gradient';
import MainButton from '../ui/MainButton';
import { formatPhoneNumberInput } from '../../util/phoneFormatter';
import { User } from '../../util/shared.types';

interface UserEditModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => void;
}

interface EditableUserData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<EditableUserData>({
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    if (visible) {
      setFormData({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setShowPasswordFields(false);
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
    Alert.alert(
      'Save Changes',
      'Save functionality is coming soon! Your changes cannot be saved at this time.',
      [{ text: 'OK' }]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]
    );
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

              <MainButton
                title={showPasswordFields ? "Hide Password Fields" : "Change Password"}
                onPress={() => {
                  if (!showPasswordFields) {
                    Alert.alert('Change Password', 'Functionality coming soon!');
                  } else {
                    setShowPasswordFields(false);
                  }
                }}
                buttonStyle={styles.togglePasswordButton}
              />

              {showPasswordFields && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Current Password *"
                    placeholderTextColor="#666"
                    value={formData.currentPassword}
                    onChangeText={(text) => updateField('currentPassword', text)}
                    secureTextEntry
                    textContentType="password"
                    autoComplete="current-password"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="New Password *"
                    placeholderTextColor="#666"
                    value={formData.newPassword}
                    onChangeText={(text) => updateField('newPassword', text)}
                    secureTextEntry
                    textContentType="newPassword"
                    autoComplete="password-new"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password *"
                    placeholderTextColor="#666"
                    value={formData.confirmNewPassword}
                    onChangeText={(text) => updateField('confirmNewPassword', text)}
                    secureTextEntry
                    textContentType="newPassword"
                    autoComplete="password-new"
                  />
                </>
              )}

              <Text style={styles.requiredText}>* Required fields</Text>

              <View style={styles.buttonRow}>
                <MainButton
                  title="Cancel"
                  onPress={handleCancel}
                  buttonStyle={{ ...styles.cancelButton, ...styles.halfWidth }}
                />
                <MainButton
                  title="Save Changes"
                  onPress={handleSave}
                  buttonStyle={{ ...styles.saveButton, ...styles.halfWidth }}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
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
    backgroundColor: '#666',
    marginBottom: 12,
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