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
    alignItems: 'center',
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailLabel: {
    color: '#666',
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailText: {
    color: '#333',
    flex: 2,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    textAlign: 'right',
  },
  details: {
    gap: 8,
    width: '100%',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    elevation: 2,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    top: 12,
    width: 36,
  },
  iconText: {
    color: '#FFF',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconWrapper: {
    alignItems: 'center',
    backgroundColor: '#008000',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 8,
    width: 64,
  },
  name: {
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default UserCard;
