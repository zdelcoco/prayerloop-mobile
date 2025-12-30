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
  Modal,
  FlatList,
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
import { createPrayerSubject } from '@/util/prayerSubjects';
import { selectAuthState } from '@/store/authSlice';

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
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [quickAddedName, setQuickAddedName] = useState<string | null>(null);

  const totalHeaderHeight = HEADER_HEIGHT + 12;
  const headerGradientEnd = totalHeaderHeight / SCREEN_HEIGHT;

  // Initialize searchText from prayerSubjectId on mount (for edit mode)
  useEffect(() => {
    if (route.params?.prayerSubjectId && prayerSubjects && !searchText) {
      const subject = prayerSubjects.find(
        (s) => s.prayerSubjectId === route.params.prayerSubjectId
      );
      if (subject) {
        setSearchText(subject.prayerSubjectDisplayName);
      }
    }
  }, [route.params?.prayerSubjectId, prayerSubjects]);

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
          setSearchText(newContact.prayerSubjectDisplayName);
          setShowAutocomplete(false);
          // Clear the pending ID to prevent re-triggering
          dispatch(clearPendingNewContactId());
        }
      }
    }, [pendingNewContactId, prayerSubjects, dispatch])
  );

  const isEditMode = route.params?.mode === 'edit';
  // Allow save if we have a selected subject OR if we just quick-added a contact
  const canSave = prayerTitle.trim() && (selectedSubjectId || quickAddedName);

  // Check if search text is invalid (has text but no matching selection)
  // Skip invalid check if we just quick-added this contact
  const hasInvalidContact = searchText.trim().length > 0 && !selectedSubjectId &&
    searchText.trim().toLowerCase() !== quickAddedName?.toLowerCase();

  // Find selected subject name
  const selectedSubject = useMemo(() => {
    if (!selectedSubjectId || !prayerSubjects) return null;
    return prayerSubjects.find((s) => s.prayerSubjectId === selectedSubjectId);
  }, [selectedSubjectId, prayerSubjects]);

  // Filter subjects based on search text
  const autocompleteResults = useMemo(() => {
    if (!searchText.trim() || !prayerSubjects) return [];
    const query = searchText.toLowerCase().trim();
    return prayerSubjects.filter((s) =>
      s.prayerSubjectDisplayName.toLowerCase().includes(query)
    );
  }, [searchText, prayerSubjects]);

  // Check if search text exactly matches any existing contact (case-insensitive)
  const hasExactMatch = useMemo(() => {
    if (!searchText.trim() || !prayerSubjects) return false;
    const query = searchText.toLowerCase().trim();
    return prayerSubjects.some(
      (s) => s.prayerSubjectDisplayName.toLowerCase() === query
    );
  }, [searchText, prayerSubjects]);

  // Should show "Add [name]" option when text is entered and no exact match exists
  const shouldShowQuickAdd = searchText.trim().length > 0 && !hasExactMatch;

  const handleSave = useCallback(async () => {
    if (!prayerTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a prayer title.');
      return;
    }

    // Determine the subject ID - either from selection or look up by quick-added name
    let subjectIdToUse = selectedSubjectId;
    if (!subjectIdToUse && quickAddedName && prayerSubjects) {
      const quickAddedSubject = prayerSubjects.find(
        (s) => s.prayerSubjectDisplayName.toLowerCase() === quickAddedName.toLowerCase()
      );
      subjectIdToUse = quickAddedSubject?.prayerSubjectId || null;
    }

    if (!subjectIdToUse) {
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
        prayerSubjectId: subjectIdToUse,
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
    quickAddedName,
    prayerSubjects,
    isEditMode,
    route.params?.prayer,
    isSaving,
    dispatch,
    navigation,
  ]);

  const handleSelectSubject = (subject: PrayerSubject | null) => {
    setSelectedSubjectId(subject?.prayerSubjectId || null);
    setSearchText(subject?.prayerSubjectDisplayName || '');
    setShowAutocomplete(false);
    setDropdownVisible(false);
  };

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    setShowAutocomplete(text.trim().length > 0);
    // Clear selection if user is typing something different
    if (selectedSubject && text !== selectedSubject.prayerSubjectDisplayName) {
      setSelectedSubjectId(null);
    }
    // Clear quick-added name if user changes the text
    if (quickAddedName && text.trim().toLowerCase() !== quickAddedName.toLowerCase()) {
      setQuickAddedName(null);
    }
  };

  const handleSelectAutocomplete = (subject: PrayerSubject) => {
    setSelectedSubjectId(subject.prayerSubjectId);
    setSearchText(subject.prayerSubjectDisplayName);
    setShowAutocomplete(false);
  };

  const handleAddContact = () => {
    setDropdownVisible(false);
    setShowAutocomplete(false);
    navigation.navigate('AddPrayerCardModal', { returnToPrayer: true });
  };

  // Quick add a new contact with just the display name (defaults to individual type)
  const handleQuickAddContact = useCallback(async () => {
    const displayName = searchText.trim();
    if (!displayName || !auth.token || !auth.user) return;

    setIsCreatingContact(true);
    setShowAutocomplete(false);
    setDropdownVisible(false);

    try {
      const result = await createPrayerSubject(auth.token, auth.user.userProfileId, {
        prayerSubjectType: 'individual',
        prayerSubjectDisplayName: displayName,
      });

      if (result.success && result.data) {
        // Select the newly created contact immediately to clear invalid state
        setSelectedSubjectId(result.data.prayerSubjectId);
        // Also track the quick-added name to bypass validation until user changes it
        setQuickAddedName(displayName);

        // Refresh prayer subjects in the background to get the new contact details
        dispatch(fetchPrayerSubjects());
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to create contact.');
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      Alert.alert('Error', 'Failed to create contact.');
    } finally {
      setIsCreatingContact(false);
    }
  }, [searchText, auth.token, auth.user, dispatch]);

  const renderSubjectItem = ({ item }: { item: PrayerSubject | 'add_contact' | 'quick_add' }) => {
    // Quick add option - creates contact with searchText as name
    if (item === 'quick_add') {
      return (
        <Pressable
          style={({ pressed }) => [
            styles.dropdownItem,
            styles.dropdownItemLast,
            styles.dropdownQuickAddItem,
            pressed && styles.dropdownItemPressed,
          ]}
          onPress={handleQuickAddContact}
          disabled={isCreatingContact}
        >
          <View style={styles.dropdownQuickAddContent}>
            <View style={styles.dropdownItemContent}>
              {isCreatingContact ? (
                <ActivityIndicator size="small" color={ACTIVE_GREEN} style={styles.dropdownItemIcon} />
              ) : (
                <Ionicons name="add-circle" size={20} color={ACTIVE_GREEN} style={styles.dropdownItemIcon} />
              )}
              <Text style={[styles.dropdownItemText, { color: ACTIVE_GREEN }]} numberOfLines={1}>
                Add "{searchText.trim()}"
              </Text>
            </View>
            <Text style={styles.dropdownQuickAddHint}>Creates contact · Edit details later</Text>
          </View>
        </Pressable>
      );
    }

    // Regular add contact option - opens the full modal
    if (item === 'add_contact') {
      return (
        <Pressable
          style={({ pressed }) => [
            styles.dropdownItem,
            styles.dropdownItemLast,
            pressed && styles.dropdownItemPressed,
          ]}
          onPress={handleAddContact}
        >
          <View style={styles.dropdownItemContent}>
            <Ionicons name="add-circle" size={20} color={ACTIVE_GREEN} style={styles.dropdownItemIcon} />
            <Text style={[styles.dropdownItemText, { color: ACTIVE_GREEN }]}>Add Contact</Text>
          </View>
        </Pressable>
      );
    }

    const isSelected = selectedSubjectId === item.prayerSubjectId;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.dropdownItem,
          pressed && styles.dropdownItemPressed,
        ]}
        onPress={() => handleSelectSubject(item)}
      >
        <Text style={styles.dropdownItemText}>{item.prayerSubjectDisplayName}</Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={ACTIVE_GREEN} />
        )}
      </Pressable>
    );
  };

  // Prepare dropdown data with quick add or add contact at the end
  const dropdownData = useMemo(() => {
    const subjects = prayerSubjects || [];
    // Show "Add [name]" if user has typed something without exact match, otherwise "Add Contact"
    const addOption = shouldShowQuickAdd ? ('quick_add' as const) : ('add_contact' as const);
    return [...subjects, addOption];
  }, [prayerSubjects, shouldShowQuickAdd]);

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
        <View style={[styles.section, styles.sectionWithOverflow]}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Who is this prayer for?</Text>
            {hasInvalidContact && (
              <Text style={styles.invalidContactHint}>
                Select a contact or add new
              </Text>
            )}
          </View>
          <View style={styles.subjectSelectorRow}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  hasInvalidContact && styles.searchInputInvalid,
                ]}
                placeholder="Search or select a contact..."
                placeholderTextColor={SUBTLE_TEXT}
                value={searchText}
                onChangeText={handleSearchTextChange}
                onFocus={() => setShowAutocomplete(searchText.trim().length > 0)}
                onBlur={() => {
                  // Delay hiding to allow tap on autocomplete item
                  setTimeout(() => setShowAutocomplete(false), 200);
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.dropdownCaret,
                  pressed && styles.dropdownCaretPressed,
                ]}
                onPress={() => setDropdownVisible(true)}
              >
                <Ionicons name="chevron-down" size={20} color={SUBTLE_TEXT} />
              </Pressable>

              {/* Autocomplete Results (when typing) */}
              {showAutocomplete && (autocompleteResults.length > 0 || shouldShowQuickAdd) && (
                <View style={styles.autocompleteContainer}>
                  <ScrollView
                    style={styles.autocompleteScrollView}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                  >
                    {autocompleteResults.map((subject, index) => (
                      <Pressable
                        key={subject.prayerSubjectId}
                        style={({ pressed }) => [
                          styles.autocompleteItem,
                          !shouldShowQuickAdd && index === autocompleteResults.length - 1 && styles.autocompleteItemLast,
                          pressed && styles.autocompleteItemPressed,
                        ]}
                        onPress={() => handleSelectAutocomplete(subject)}
                      >
                        <Text style={styles.autocompleteText} numberOfLines={1}>
                          {subject.prayerSubjectDisplayName}
                        </Text>
                        {selectedSubjectId === subject.prayerSubjectId && (
                          <Ionicons name="checkmark" size={18} color={ACTIVE_GREEN} />
                        )}
                      </Pressable>
                    ))}
                    {/* Dynamic "Add [name]" option */}
                    {shouldShowQuickAdd && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.autocompleteItem,
                          styles.autocompleteItemLast,
                          styles.addContactItem,
                          styles.quickAddItem,
                          pressed && styles.autocompleteItemPressed,
                        ]}
                        onPress={handleQuickAddContact}
                        disabled={isCreatingContact}
                      >
                        <View style={styles.quickAddContent}>
                          <View style={styles.quickAddRow}>
                            {isCreatingContact ? (
                              <ActivityIndicator size="small" color={ACTIVE_GREEN} style={styles.addContactIcon} />
                            ) : (
                              <Ionicons name="add-circle" size={18} color={ACTIVE_GREEN} style={styles.addContactIcon} />
                            )}
                            <Text style={[styles.autocompleteText, styles.addContactText]} numberOfLines={1}>
                              Add "{searchText.trim()}"
                            </Text>
                          </View>
                          <Text style={styles.quickAddHint}>Creates contact · Edit details later</Text>
                        </View>
                      </Pressable>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.addContactButton,
                pressed && styles.addContactButtonPressed,
              ]}
              onPress={handleAddContact}
            >
              <Ionicons name="person-add" size={20} color={ACTIVE_GREEN} />
            </Pressable>
          </View>
        </View>

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

      {/* Dropdown Modal (full unfiltered list) */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>Select Contact</Text>
              <Pressable onPress={() => setDropdownVisible(false)}>
                <Ionicons name="close" size={24} color={DARK_TEXT} />
              </Pressable>
            </View>
            <FlatList
              data={dropdownData}
              keyExtractor={(item) =>
                item === 'add_contact' || item === 'quick_add'
                  ? item
                  : item.prayerSubjectId.toString()
              }
              renderItem={renderSubjectItem}
              style={styles.dropdownList}
              ItemSeparatorComponent={() => <View style={styles.dropdownSeparator} />}
            />
          </View>
        </Pressable>
      </Modal>

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
  addContactButton: {
    alignItems: 'center',
    backgroundColor: MUTED_GREEN,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginLeft: 10,
    width: 48,
  },
  addContactButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  addContactIcon: {
    marginRight: 8,
  },
  addContactItem: {
    borderTopColor: 'rgba(45, 62, 49, 0.15)',
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-start',
  },
  addContactText: {
    color: ACTIVE_GREEN,
  },
  addContactTextWithHint: {
    flex: 0,
  },
  autocompleteContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(45, 62, 49, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 4,
    left: 0,
    marginTop: 4,
    maxHeight: 264, // ~6 items at 44px each
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    top: 48,
    zIndex: 100,
  },
  autocompleteItem: {
    alignItems: 'center',
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  autocompleteItemLast: {
    borderBottomWidth: 0,
  },
  autocompleteItemPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
  },
  autocompleteScrollView: {
    flexGrow: 0,
  },
  autocompleteText: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  quickAddContent: {
    flex: 1,
  },
  quickAddHint: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginLeft: 26,
    marginTop: 2,
  },
  quickAddItem: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  quickAddRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  dropdownCaret: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 40,
  },
  dropdownCaretPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
    borderRadius: 8,
  },
  dropdownHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownHeaderText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  dropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  dropdownItemIcon: {
    marginRight: 8,
  },
  dropdownItemLast: {
    borderTopColor: 'rgba(45, 62, 49, 0.1)',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
  },
  dropdownItemText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  dropdownQuickAddContent: {
    flex: 1,
  },
  dropdownQuickAddHint: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginLeft: 28,
    marginTop: 2,
  },
  dropdownQuickAddItem: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    maxHeight: '70%',
    minWidth: 320,
    overflow: 'hidden',
    width: '92%',
  },
  dropdownSeparator: {
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    height: StyleSheet.hairlineWidth,
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
  invalidContactHint: {
    color: '#D32F2F',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginLeft: 8,
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
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
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
  searchInput: {
    backgroundColor: 'rgba(241, 253, 237, 0.9)',
    borderColor: 'rgba(45, 62, 49, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    height: 48,
    paddingHorizontal: 16,
    paddingRight: 40,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  searchInputInvalid: {
    backgroundColor: 'rgba(255, 235, 238, 0.9)',
    borderColor: '#D32F2F',
    borderWidth: 1.5,
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
  sectionLabel: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    marginLeft: 4,
  },
  sectionLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  sectionWithOverflow: {
    overflow: 'visible',
    zIndex: 20,
  },
  subjectSelectorRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
