import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { BlurView } from 'expo-blur';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addGroup } from '@/store/groupsSlice';
import { useAppDispatch } from '@/hooks/redux';
import { CreateGroupRequest } from '@/util/createGroup.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = 120;
const HEADER_HEIGHT = 56;

// Generate a preview color based on the name
const getAvatarColor = (displayName: string): string => {
  if (!displayName.trim()) {
    return '#9E9E9E';
  }
  const colors = [
    '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
    '#00BCD4', '#E91E63', '#607D8B', '#795548',
  ];

  let hash = 0;
  for (let i = 0; i < displayName.length; i++) {
    hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Generate initials from display name
const getInitials = (displayName: string): string => {
  if (!displayName.trim()) return '';
  const words = displayName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return displayName.substring(0, 2).toUpperCase();
};

export default function GroupModal() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totalHeaderHeight = HEADER_HEIGHT + 12;
  const headerGradientEnd = totalHeaderHeight / SCREEN_HEIGHT;

  const initials = useMemo(() => getInitials(groupName), [groupName]);
  const avatarColor = useMemo(() => getAvatarColor(groupName), [groupName]);

  const canCreate = groupName.trim().length > 0;

  const handleClose = useCallback(() => {
    if (groupName.trim() || groupDescription.trim()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [groupName, groupDescription, navigation]);

  const handleCreate = useCallback(async () => {
    if (!groupName.trim()) {
      Alert.alert('Required', 'Please enter a circle name.');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    const newGroup: CreateGroupRequest = {
      groupName: groupName.trim(),
      groupDescription: groupDescription.trim() || undefined,
    };

    try {
      await dispatch(addGroup(newGroup));
      navigation.goBack();
      setTimeout(() => {
        Alert.alert('Success', 'Prayer circle created successfully!');
      }, 100);
    } catch (error) {
      console.error('Error adding group:', error);
      Alert.alert('Error', 'Something went wrong while creating the prayer circle.');
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, groupName, groupDescription, navigation, isSaving]);

  const handleAddPhoto = () => {
    Alert.alert('Coming Soon', 'Photo upload will be available in a future update.');
  };

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      {/* Custom Header */}
      <View style={[styles.header, { height: HEADER_HEIGHT + 12, paddingTop: 12 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
          ]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color={DARK_TEXT} />
        </Pressable>

        <Text style={styles.headerTitle}>Create Prayer Circle</Text>

        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
            !canCreate && styles.headerButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!canCreate || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={ACTIVE_GREEN} />
          ) : (
            <Ionicons
              name="checkmark"
              size={24}
              color={canCreate ? ACTIVE_GREEN : SUBTLE_TEXT}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: avatarColor },
            ]}
          >
            {initials ? (
              <Text style={styles.initialsText}>{initials}</Text>
            ) : (
              <FontAwesome name="users" size={50} color="rgba(255,255,255,0.7)" />
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addPhotoButton,
              pressed && styles.addPhotoButtonPressed,
            ]}
            onPress={handleAddPhoto}
          >
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </Pressable>
        </View>

        {/* Name & Description Section */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Circle Name"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={groupName}
                  onChangeText={setGroupName}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
              <View style={styles.inputRowBorder} />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Description"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </BlurView>
        </View>

        {/* Bottom padding for scroll */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      {/* Loading Overlay */}
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.extraLargeSpinner}>
              <ActivityIndicator size="large" color="#b2d8b2" />
            </View>
            <Text style={styles.loadingText}>Creating...</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  addPhotoButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addPhotoButtonPressed: {
    opacity: 0.7,
  },
  addPhotoText: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  avatar: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    elevation: 4,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: AVATAR_SIZE,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  extraLargeSpinner: {
    transform: [{ scale: 2 }],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: MUTED_GREEN,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 36,
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  headerTitle: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 18,
  },
  initialsText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 42,
    letterSpacing: 2,
  },
  input: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    letterSpacing: 0,
    paddingVertical: 4,
  },
  inputRow: {
    paddingVertical: 10,
  },
  inputRowBorder: {
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    height: StyleSheet.hairlineWidth,
  },
  loadingContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    paddingBottom: 30,
    paddingHorizontal: 60,
    paddingTop: 48,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  loadingText: {
    color: '#b2d8b2',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 24,
    marginTop: 48,
  },
  multilineInput: {
    minHeight: 60,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionBlur: {
    borderColor: 'rgba(252, 251, 231, 0.58)',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
