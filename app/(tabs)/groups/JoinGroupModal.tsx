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
import { LinearGradient } from 'expo-linear-gradient';
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  inputSection: {
    flex: 1,
    justifyContent: 'center',
  },
  previewSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 30,
    fontSize: 16,
    backgroundColor: '#F1FDED',
    textAlign: 'center',
    letterSpacing: 1,
  },
  groupCard: {
    backgroundColor: '#F1FDED',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  groupDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  membersSection: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 15,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  memberName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  previewButton: {
    backgroundColor: '#007AFF',
  },
  joinButton: {
    backgroundColor: '#008000',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
