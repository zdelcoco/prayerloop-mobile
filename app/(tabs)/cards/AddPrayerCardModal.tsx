import React, { useState, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchPrayerSubjects, setPendingNewContactId } from '@/store/prayerSubjectsSlice';
import { addUserPrayer } from '@/store/userPrayersSlice';
import { createPrayerSubject as createPrayerSubjectAPI } from '@/util/prayerSubjects';
import { RootState } from '@/store/store';
import type { CreatePrayerSubjectRequest, CreatePrayerRequest } from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = 120;

// Generate a preview color based on the name
const getAvatarColor = (displayName: string): string => {
  if (!displayName.trim()) {
    return '#9E9E9E'; // Gray default
  }
  const colors = [
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#00BCD4', // Cyan
    '#E91E63', // Pink
    '#607D8B', // Blue Grey
    '#795548', // Brown
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

// Type for prayer request items
interface PrayerRequestItem {
  id: string;
  title: string;
  description: string;
}

// Prayer subject type options
type PrayerSubjectType = 'individual' | 'family' | 'group';

const TYPE_OPTIONS: { value: PrayerSubjectType; label: string; icon: 'user' | 'home' | 'users' }[] = [
  { value: 'individual', label: 'Individual', icon: 'user' },
  { value: 'family', label: 'Family', icon: 'home' },
  { value: 'group', label: 'Group', icon: 'users' },
];

const HEADER_HEIGHT = 56;

type RootStackParamList = {
  AddPrayerCardModal: { returnToPrayer?: boolean };
  PrayerModal: { mode: 'add' | 'edit'; newContactId?: number };
};

export default function AddPrayerCardModal() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<{
    key: string;
    name: string;
    params?: { returnToPrayer?: boolean };
  }>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const { token, user } = useAppSelector((state: RootState) => state.auth);

  const [displayName, setDisplayName] = useState('');
  const [notes, setNotes] = useState('');
  const [subjectType, setSubjectType] = useState<PrayerSubjectType>('individual');
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequestItem[]>([]);
  const [linkedUserId, setLinkedUserId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const totalHeaderHeight = insets.top + HEADER_HEIGHT;
  const headerGradientEnd = totalHeaderHeight / SCREEN_HEIGHT;

  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Please enter a display name.');
      return;
    }

    if (!token || !user) {
      Alert.alert('Error', 'You must be logged in to create a prayer card.');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    try {
      // Step 1: Create the prayer subject
      const subjectData: CreatePrayerSubjectRequest = {
        prayerSubjectDisplayName: displayName.trim(),
        notes: notes.trim() || undefined,
        prayerSubjectType: subjectType,
        userProfileId: linkedUserId || undefined,
      };

      const result = await createPrayerSubjectAPI(token, user.userProfileId, subjectData);

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to create prayer card');
      }

      const newSubjectId = result.data.prayerSubjectId;

      // Step 2: Create any prayer requests for this subject
      const validPrayers = prayerRequests.filter((pr) => pr.title.trim());
      for (const pr of validPrayers) {
        const prayerData: CreatePrayerRequest = {
          title: pr.title.trim(),
          prayerDescription: pr.description.trim() || pr.title.trim(),
          isPrivate: false,
          prayerType: 'general',
          prayerSubjectId: newSubjectId,
        };
        await dispatch(addUserPrayer(prayerData));
      }

      // Refresh the prayer subjects list
      await dispatch(fetchPrayerSubjects());

      // If we came from PrayerModal, set the pending contact ID so PrayerModal can pick it up
      if (route.params?.returnToPrayer) {
        dispatch(setPendingNewContactId(newSubjectId));
      }

      // Go back to the previous screen (PrayerModal or wherever we came from)
      navigation.goBack();
    } catch (error) {
      console.error('Error creating prayer card:', error);
      Alert.alert('Error', 'Failed to create prayer card. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [displayName, notes, subjectType, linkedUserId, prayerRequests, isSaving, token, user, dispatch, navigation]);

  const handleAddPhoto = () => {
    // TODO: Implement photo picker
    Alert.alert('Coming Soon', 'Photo upload will be available in a future update.');
  };

  const handleAddPrayerRequest = () => {
    const newId = Date.now().toString();
    setPrayerRequests([
      ...prayerRequests,
      { id: newId, title: '', description: '' },
    ]);
  };

  const handleUpdatePrayerRequest = (
    id: string,
    field: 'title' | 'description',
    value: string
  ) => {
    setPrayerRequests(
      prayerRequests.map((pr) =>
        pr.id === id ? { ...pr, [field]: value } : pr
      )
    );
  };

  const handleRemovePrayerRequest = (id: string) => {
    setPrayerRequests(prayerRequests.filter((pr) => pr.id !== id));
  };

  const handleLinkUser = () => {
    // TODO: Implement user search/selection modal
    Alert.alert(
      'Coming Soon',
      'User linking will be available in a future update.'
    );
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
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={DARK_TEXT} />
        </Pressable>

        <Text style={styles.headerTitle}>New Prayer Card</Text>

        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
            !displayName.trim() && styles.headerButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!displayName.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={ACTIVE_GREEN} />
          ) : (
            <Ionicons
              name="checkmark"
              size={24}
              color={displayName.trim() ? ACTIVE_GREEN : SUBTLE_TEXT}
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
        {/* Type Selector Section */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              <View style={styles.typeSelector}>
                {TYPE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.typeOption,
                      subjectType === option.value && styles.typeOptionSelected,
                      pressed && styles.typeOptionPressed,
                    ]}
                    onPress={() => setSubjectType(option.value)}
                  >
                    <FontAwesome
                      name={option.icon}
                      size={16}
                      color={subjectType === option.value ? '#FFFFFF' : DARK_TEXT}
                      style={styles.typeOptionIcon}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        subjectType === option.value && styles.typeOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </BlurView>
        </View>
        
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
              <FontAwesome name="user" size={50} color="rgba(255,255,255,0.7)" />
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

        {/* Name & Note Section */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputRowBorder} />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Note"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </BlurView>
        </View>

        {/* Prayer Requests Section */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              {prayerRequests.map((pr, index) => (
                <View key={pr.id}>
                  {index > 0 && <View style={styles.inputRowBorder} />}
                  <View style={styles.prayerRequestItem}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.removeButton,
                        pressed && styles.removeButtonPressed,
                      ]}
                      onPress={() => handleRemovePrayerRequest(pr.id)}
                    >
                      <Ionicons name="remove-circle" size={24} color="#E53935" />
                    </Pressable>
                    <View style={styles.prayerRequestInputs}>
                      <TextInput
                        style={styles.prayerTitleInput}
                        placeholder="Prayer title"
                        placeholderTextColor={SUBTLE_TEXT}
                        value={pr.title}
                        onChangeText={(text) =>
                          handleUpdatePrayerRequest(pr.id, 'title', text)
                        }
                        autoCapitalize="sentences"
                      />
                      <TextInput
                        style={[styles.input, styles.prayerDescInput]}
                        placeholder="Description (optional)"
                        placeholderTextColor={SUBTLE_TEXT}
                        value={pr.description}
                        onChangeText={(text) =>
                          handleUpdatePrayerRequest(pr.id, 'description', text)
                        }
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                        autoCapitalize="sentences"
                      />
                    </View>
                  </View>
                </View>
              ))}
              {prayerRequests.length > 0 && <View style={styles.inputRowBorder} />}
              <Pressable
                style={({ pressed }) => [
                  styles.addRow,
                  pressed && styles.addRowPressed,
                ]}
                onPress={handleAddPrayerRequest}
              >
                <Ionicons
                  name="add-circle"
                  size={22}
                  color={ACTIVE_GREEN}
                  style={styles.addIcon}
                />
                <Text style={styles.addRowText}>add prayer request</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>

        {/* Link to User Section */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              {linkedUserId && (
                <>
                  <View style={styles.linkedUserRow}>
                    <Text style={styles.linkedUserText}>
                      Linked to user #{linkedUserId}
                    </Text>
                    <Pressable
                      onPress={() => setLinkedUserId(null)}
                      style={({ pressed }) => [
                        styles.removeButton,
                        pressed && styles.removeButtonPressed,
                      ]}
                    >
                      <Ionicons name="remove-circle" size={24} color="#E53935" />
                    </Pressable>
                  </View>
                  <View style={styles.inputRowBorder} />
                </>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.addRow,
                  pressed && styles.addRowPressed,
                ]}
                onPress={handleLinkUser}
              >
                <Ionicons
                  name="add-circle"
                  size={22}
                  color={ACTIVE_GREEN}
                  style={styles.addIcon}
                />
                <Text style={styles.addRowText}>link card to prayerloop user</Text>
              </Pressable>
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
            <Text style={styles.loadingText}>Saving...</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  addIcon: {
    marginRight: 8,
  },
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
  addRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 12,
  },
  addRowPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
  },
  addRowText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
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
    paddingVertical: 4,
  },
  inputRow: {
    paddingVertical: 10,
  },
  inputRowBorder: {
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    height: StyleSheet.hairlineWidth,
  },
  linkedUserRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  linkedUserText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
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
  prayerDescInput: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    minHeight: 40,
  },
  prayerRequestInputs: {
    flex: 1,
  },
  prayerRequestItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingVertical: 10,
  },
  prayerTitleInput: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
    paddingVertical: 4,
  },
  removeButton: {
    marginRight: 8,
    padding: 4,
  },
  removeButtonPressed: {
    opacity: 0.7,
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
  typeOption: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeOptionIcon: {
    marginRight: 6,
  },
  typeOptionPressed: {
    opacity: 0.7,
  },
  typeOptionSelected: {
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 8,
  },
  typeOptionText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
  typeSelector: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
});
