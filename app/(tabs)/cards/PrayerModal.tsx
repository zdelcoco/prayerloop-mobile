import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { addUserPrayer, putUserPrayer, fetchUserPrayers } from '@/store/userPrayersSlice';
import { fetchPrayerSubjects, selectPrayerSubjects, selectPendingNewContactId, clearPendingNewContactId } from '@/store/prayerSubjectsSlice';
import { StackNavigationProp } from '@react-navigation/stack';
import { selectAuthState } from '@/store/authSlice';
import PrayerSubjectPicker from '@/components/PrayerCards/PrayerSubjectPicker';

import type { Prayer, PrayerSubject, CreatePrayerRequest } from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 56;

type RootStackParamList = {
  AddPrayerCardModal: { returnToPrayer?: boolean };
  PrayerModal: { mode: 'add' | 'edit'; prayer?: Prayer; prayerSubjectId?: number; newContactId?: number };
};

export default function PrayerModal() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const route = useRoute<{
    key: string;
    name: string;
    params: { mode: 'add' | 'edit'; prayer?: Prayer; prayerSubjectId?: number; newContactId?: number };
  }>();

  const prayerSubjects = useAppSelector(selectPrayerSubjects);
  const pendingNewContactId = useAppSelector(selectPendingNewContactId);
  const auth = useAppSelector(selectAuthState);

  // Initialize state based on mode
  const [prayerTitle, setPrayerTitle] = useState(() => {
    if (route.params?.mode === 'edit' && route.params.prayer) {
      return route.params.prayer.title;
    }
    return '';
  });
  const [prayerDescription, setPrayerDescription] = useState(() => {
    if (route.params?.mode === 'edit' && route.params.prayer) {
      return route.params.prayer.prayerDescription;
    }
    return '';
  });
  const [isPrivate, setIsPrivate] = useState(() => {
    if (route.params?.mode === 'edit' && route.params.prayer) {
      return route.params.prayer.isPrivate;
    }
    return false;
  });
  const [isAnswered, setIsAnswered] = useState(() => {
    if (route.params?.mode === 'edit' && route.params.prayer) {
      return route.params.prayer.isAnswered;
    }
    return false;
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(() => {
    if (route.params?.prayerSubjectId) {
      return route.params.prayerSubjectId;
    }
    return null;
  });
  const [isSaving, setIsSaving] = useState(false);

  const totalHeaderHeight = HEADER_HEIGHT + 12;
  const headerGradientEnd = totalHeaderHeight / SCREEN_HEIGHT;

  // Handle newly created contact from AddPrayerCardModal via Redux state
  // Using useFocusEffect to ensure it triggers when navigating back from AddPrayerCardModal
  useFocusEffect(
    useCallback(() => {
      if (pendingNewContactId && prayerSubjects) {
        const newContact = prayerSubjects.find(
          (s) => s.prayerSubjectId === pendingNewContactId
        );
        if (newContact) {
          setSelectedSubjectId(newContact.prayerSubjectId);
          // Clear the pending ID to prevent re-triggering
          dispatch(clearPendingNewContactId());
        }
      }
    }, [pendingNewContactId, prayerSubjects, dispatch])
  );

  const isEditMode = route.params?.mode === 'edit';
  const canSave = prayerTitle.trim() && selectedSubjectId;

  const handleSave = useCallback(async () => {
    if (!prayerTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a prayer title.');
      return;
    }

    if (!selectedSubjectId) {
      Alert.alert('Validation Error', 'Please select a contact for this prayer.');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    try {
      const prayerData: CreatePrayerRequest = {
        title: prayerTitle.trim(),
        prayerDescription: prayerDescription.trim() || prayerTitle.trim(),
        isPrivate,
        isAnswered,
        prayerType: 'general',
        prayerSubjectId: selectedSubjectId,
      };

      if (isEditMode && route.params.prayer) {
        await dispatch(putUserPrayer(route.params.prayer.prayerId, prayerData));
      } else {
        await dispatch(addUserPrayer(prayerData));
      }

      // Refresh data
      await dispatch(fetchUserPrayers());
      await dispatch(fetchPrayerSubjects());

      navigation.goBack();
    } catch (error) {
      console.error('Error saving prayer:', error);
      Alert.alert('Error', 'Something went wrong while saving the prayer.');
    } finally {
      setIsSaving(false);
    }
  }, [
    prayerTitle,
    prayerDescription,
    isPrivate,
    isAnswered,
    selectedSubjectId,
    isEditMode,
    route.params?.prayer,
    isSaving,
    dispatch,
    navigation,
  ]);

  const handleSelectSubject = (subject: PrayerSubject | null) => {
    setSelectedSubjectId(subject?.prayerSubjectId || null);
  };

  const handleQuickAddSuccess = (newSubjectId: number) => {
    setSelectedSubjectId(newSubjectId);
    dispatch(fetchPrayerSubjects());
  };

  const handleNavigateToAddContact = () => {
    navigation.navigate('AddPrayerCardModal', { returnToPrayer: true });
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

        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Prayer' : 'New Prayer'}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
            !canSave && styles.headerButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!canSave || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={ACTIVE_GREEN} />
          ) : (
            <Ionicons
              name="checkmark"
              size={24}
              color={canSave ? ACTIVE_GREEN : SUBTLE_TEXT}
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
        {/* Prayer Subject Selector */}
        {auth.token && auth.user && (
          <PrayerSubjectPicker
            subjects={prayerSubjects || []}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={handleSelectSubject}
            onQuickAddSuccess={handleQuickAddSuccess}
            onNavigateToAddContact={handleNavigateToAddContact}
            label="Who is this prayer for?"
            invalidHint="Select a contact or add new"
            token={auth.token}
            userProfileId={auth.user.userProfileId}
          />
        )}

        {/* Prayer Details */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Prayer title"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={prayerTitle}
                  onChangeText={setPrayerTitle}
                  autoCapitalize="sentences"
                  autoCorrect
                />
              </View>
              <View style={styles.inputRowBorder} />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Prayer description (optional)"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={prayerDescription}
                  onChangeText={setPrayerDescription}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                  autoCorrect
                />
              </View>
            </View>
          </BlurView>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Mark as Private</Text>
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: '#ccc', true: ACTIVE_GREEN }}
                />
              </View>
              <View style={styles.inputRowBorder} />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Mark as Answered</Text>
                <Switch
                  value={isAnswered}
                  onValueChange={setIsAnswered}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: '#ccc', true: ACTIVE_GREEN }}
                />
              </View>
            </View>
          </BlurView>
        </View>

        {/* Bottom padding */}
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
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 50,
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
    minHeight: 120,
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
    backgroundColor: 'rgba(192, 181, 106, 0.09)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  switchLabel: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
});
