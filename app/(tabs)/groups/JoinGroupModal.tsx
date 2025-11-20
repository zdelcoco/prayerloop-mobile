import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserGroups } from '@/store/groupsSlice';
import { router } from 'expo-router';

import type { Group, User } from '@/util/shared.types';
import { joinGroup } from '@/util/joinGroup';

export default function JoinGroupModal() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const handleDirectJoin = useCallback(async () => {
    if (!inviteCode.trim() || !token) return;

    // Validate invite code format
    const parts = inviteCode.trim().split('-');
    if (parts.length !== 2) {
      Alert.alert(
        'Invalid Code',
        'Please enter a valid invite code (format: XXXX-XXXX)'
      );
      return;
    }

    const groupId = parseInt(parts[0], 10);
    if (isNaN(groupId)) {
      Alert.alert(
        'Invalid Code',
        'Please enter a valid invite code (format: XXXX-XXXX)'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await joinGroup(token, groupId, inviteCode);

      if (result.success) {
        // Success - refresh groups and navigate back
        await dispatch(fetchUserGroups());

        Alert.alert('Success!', 'You have successfully joined the group!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack(); // Close modal
              router.replace('/(tabs)/groups'); // Navigate to groups tab
            },
          },
        ]);
      } else {
        Alert.alert(
          'Error',
          result.error?.message ||
            'Failed to join group. Please check the invite code and try again.'
        );
      }
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [inviteCode, token, dispatch, navigation]);

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView
        style={[{ paddingTop: headerHeight }, styles.container]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inputSection}>
          <Text style={styles.title}>Join a Group</Text>
          <Text style={styles.subtitle}>
            Enter the invite code you received
          </Text>

          <TextInput
            style={styles.input}
            placeholder='Enter invite code (e.g., 0003-B8E3)'
            placeholderTextColor='#888'
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize='characters'
            autoCorrect={false}
          />

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.joinButton,
                !inviteCode.trim() && styles.disabledButton,
              ]}
              onPress={handleDirectJoin}
              disabled={!inviteCode.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.buttonText}>Join Group</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 10,
    elevation: 3,
    flex: 1,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'space-between',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  groupCard: {
    backgroundColor: '#F1FDED',
    borderRadius: 15,
    elevation: 3,
    marginBottom: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupDescription: {
    color: '#666',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  groupName: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1FDED',
    borderColor: '#ccc',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 30,
    paddingHorizontal: 15,
    paddingVertical: 12,
    textAlign: 'center',
  },
  inputSection: {
    flex: 1,
    justifyContent: 'center',
  },
  joinButton: {
    backgroundColor: '#008000',
  },
  memberName: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  membersSection: {
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    paddingTop: 15,
  },
  membersTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  previewButton: {
    backgroundColor: '#007AFF',
  },
  previewSection: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});
