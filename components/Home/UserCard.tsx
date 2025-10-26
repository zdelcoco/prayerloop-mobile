import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { formatPhoneNumber } from '../../util/phoneFormatter';
import { User } from '../../util/shared.types';
import { updateUserProfile, UpdateUserProfileRequest } from '../../util/updateUserProfile';
import { updateUserProfileSuccess } from '../../store/authSlice';
import { RootState } from '../../store/store';
import UserEditModal from './UserEditModal';

interface UserCardProps {
  user: User;
  onUserUpdate: (updatedUser: Partial<User>) => void;
}

const UserCard = ({ user, onUserUpdate }: UserCardProps) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  if (!user) {
    return null;
  }

  const { username, email, phoneNumber, firstName, lastName } = user;
  const userIcon = `${firstName?.[0]?.toUpperCase() || ''}${lastName?.[0]?.toUpperCase() || ''}`;
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const handleEditPress = () => {
    setEditModalVisible(true);
  };

  const handleCloseEdit = () => {
    setEditModalVisible(false);
  };

  const handleSaveEdit = async (updatedData: Partial<User>) => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to update your profile.');
      return;
    }

    setIsSaving(true);

    try {
      // Build the update request - only include changed fields
      const updateRequest: UpdateUserProfileRequest = {};

      if (updatedData.username !== undefined && updatedData.username !== user.username) {
        updateRequest.username = updatedData.username;
      }
      if (updatedData.firstName !== undefined && updatedData.firstName !== user.firstName) {
        updateRequest.firstName = updatedData.firstName;
      }
      if (updatedData.lastName !== undefined && updatedData.lastName !== user.lastName) {
        updateRequest.lastName = updatedData.lastName;
      }
      if (updatedData.email !== undefined && updatedData.email !== user.email) {
        updateRequest.email = updatedData.email;
      }
      if (updatedData.phoneNumber !== user.phoneNumber) {
        updateRequest.phoneNumber = updatedData.phoneNumber || '';
      }

      // Check if there are any changes
      if (Object.keys(updateRequest).length === 0) {
        Alert.alert('No Changes', 'No changes were made to your profile.');
        setEditModalVisible(false);
        setIsSaving(false);
        return;
      }

      const result = await updateUserProfile(token, user.userProfileId, updateRequest);

      if (result.success && result.data) {
        // Update Redux store with new user data
        dispatch(updateUserProfileSuccess(result.data.user));

        Alert.alert('Success', 'Your profile has been updated successfully!');
        setEditModalVisible(false);

        // Call the parent callback if provided
        onUserUpdate(result.data.user);
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to update profile. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <View style={styles.cardContainer}>
        <Pressable style={styles.editButton} onPress={handleEditPress}>
          <Ionicons name="pencil" size={20} color="#008000" />
        </Pressable>
        
        <View style={styles.iconWrapper}>
          <Text style={styles.iconText}>{userIcon}</Text>
        </View>
        
        <Text style={styles.name}>{`${firstName} ${lastName}`}</Text>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Username</Text>
            <Text style={styles.detailText}>{username}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailText}>{email}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailText}>
              {formattedPhone || 'Not provided'}
            </Text>
          </View>
        </View>
      </View>

      <UserEditModal
        visible={editModalVisible}
        user={user}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        isSaving={isSaving}
      />
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconWrapper: {
    backgroundColor: '#008000',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'InstrumentSans-Bold',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'InstrumentSans-SemiBold',
    textAlign: 'center',
  },
  details: {
    width: '100%',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'InstrumentSans-SemiBold',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'InstrumentSans-Regular',
    flex: 2,
    textAlign: 'right',
  },
});

export default UserCard;
