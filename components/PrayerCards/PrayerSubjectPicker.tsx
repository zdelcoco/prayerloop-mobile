import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createPrayerSubject } from '@/util/prayerSubjects';
import type { PrayerSubject } from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

export interface PrayerSubjectPickerProps {
  // Data
  subjects: PrayerSubject[];
  selectedSubjectId: number | null;

  // Callbacks
  onSelectSubject: (subject: PrayerSubject | null) => void;
  onQuickAddSuccess?: (newSubjectId: number, displayName: string) => void;
  onNavigateToAddContact?: () => void;
  onDropdownVisibilityChange?: (visible: boolean) => void;

  // Options
  filterType?: 'individual' | 'family' | 'group' | 'individual-only' | 'group-family-only';
  showQuickAdd?: boolean;
  showAddContactButton?: boolean;
  placeholder?: string;
  label?: string;
  invalidHint?: string;
  disabled?: boolean;

  // Auth
  token: string;
  userProfileId: number;
}

export default function PrayerSubjectPicker({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onQuickAddSuccess,
  onNavigateToAddContact,
  onDropdownVisibilityChange,
  filterType,
  showQuickAdd = true,
  showAddContactButton = true,
  placeholder = 'Search or select a contact...',
  label,
  invalidHint,
  disabled = false,
  token,
  userProfileId,
}: PrayerSubjectPickerProps) {
  const [searchText, setSearchText] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [quickAddedName, setQuickAddedName] = useState<string | null>(null);

  // Initialize search text from selected subject
  React.useEffect(() => {
    if (selectedSubjectId && subjects) {
      const subject = subjects.find((s) => s.prayerSubjectId === selectedSubjectId);
      if (subject && searchText !== subject.prayerSubjectDisplayName) {
        setSearchText(subject.prayerSubjectDisplayName);
      }
    }
  }, [selectedSubjectId, subjects]);

  // Filter subjects based on type filter and sort alphabetically
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    let filtered: PrayerSubject[];
    if (!filterType) {
      filtered = [...subjects];
    } else if (filterType === 'individual-only') {
      filtered = subjects.filter((s) => s.prayerSubjectType === 'individual');
    } else if (filterType === 'group-family-only') {
      filtered = subjects.filter((s) => s.prayerSubjectType === 'family' || s.prayerSubjectType === 'group');
    } else {
      filtered = subjects.filter((s) => s.prayerSubjectType === filterType);
    }
    // Sort alphabetically by display name (case-insensitive)
    return filtered.sort((a, b) =>
      a.prayerSubjectDisplayName.toLowerCase().localeCompare(b.prayerSubjectDisplayName.toLowerCase())
    );
  }, [subjects, filterType]);

  // Filter subjects based on search text
  const autocompleteResults = useMemo(() => {
    if (!searchText.trim()) return [];
    const query = searchText.toLowerCase().trim();
    return filteredSubjects.filter((s) =>
      s.prayerSubjectDisplayName.toLowerCase().includes(query)
    );
  }, [searchText, filteredSubjects]);

  // Check if search text exactly matches any existing contact
  const hasExactMatch = useMemo(() => {
    if (!searchText.trim()) return false;
    const query = searchText.toLowerCase().trim();
    return filteredSubjects.some(
      (s) => s.prayerSubjectDisplayName.toLowerCase() === query
    );
  }, [searchText, filteredSubjects]);

  // Should show "Add [name]" option
  const shouldShowQuickAdd = showQuickAdd && searchText.trim().length > 0 && !hasExactMatch;

  // Notify parent of dropdown visibility changes
  const isDropdownActuallyVisible = showAutocomplete && (autocompleteResults.length > 0 || shouldShowQuickAdd);
  React.useEffect(() => {
    if (onDropdownVisibilityChange) {
      onDropdownVisibilityChange(isDropdownActuallyVisible);
    }
  }, [isDropdownActuallyVisible, onDropdownVisibilityChange]);

  // Check if search text is invalid
  const hasInvalidContact = searchText.trim().length > 0 && !selectedSubjectId &&
    searchText.trim().toLowerCase() !== quickAddedName?.toLowerCase();

  // Find selected subject
  const selectedSubject = useMemo(() => {
    if (!selectedSubjectId || !subjects) return null;
    return subjects.find((s) => s.prayerSubjectId === selectedSubjectId);
  }, [selectedSubjectId, subjects]);

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    setShowAutocomplete(text.trim().length > 0);
    // Clear selection if user is typing something different
    if (selectedSubject && text !== selectedSubject.prayerSubjectDisplayName) {
      onSelectSubject(null);
    }
    // Clear quick-added name if user changes the text
    if (quickAddedName && text.trim().toLowerCase() !== quickAddedName.toLowerCase()) {
      setQuickAddedName(null);
    }
  };

  const handleSelectAutocomplete = (subject: PrayerSubject) => {
    onSelectSubject(subject);
    setSearchText(subject.prayerSubjectDisplayName);
    setShowAutocomplete(false);
  };

  const handleSelectFromDropdown = (subject: PrayerSubject | null) => {
    onSelectSubject(subject);
    setSearchText(subject?.prayerSubjectDisplayName || '');
    setShowAutocomplete(false);
    setDropdownVisible(false);
  };

  const handleQuickAddContact = useCallback(async () => {
    const displayName = searchText.trim();
    if (!displayName || !token) return;

    setIsCreatingContact(true);
    setShowAutocomplete(false);
    setDropdownVisible(false);

    try {
      const result = await createPrayerSubject(token, userProfileId, {
        prayerSubjectType: 'individual',
        prayerSubjectDisplayName: displayName,
      });

      if (result.success && result.data) {
        setQuickAddedName(displayName);
        if (onQuickAddSuccess) {
          onQuickAddSuccess(result.data.prayerSubjectId, displayName);
        }
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setIsCreatingContact(false);
    }
  }, [searchText, token, userProfileId, onQuickAddSuccess]);

  const handleAddContact = () => {
    setDropdownVisible(false);
    setShowAutocomplete(false);
    if (onNavigateToAddContact) {
      onNavigateToAddContact();
    }
  };

  const renderDropdownItem = ({ item }: { item: PrayerSubject | 'add_contact' | 'quick_add' }) => {
    // Quick add option
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

    // Add contact option
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
        onPress={() => handleSelectFromDropdown(item)}
      >
        <Text style={styles.dropdownItemText}>{item.prayerSubjectDisplayName}</Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={ACTIVE_GREEN} />
        )}
      </Pressable>
    );
  };

  // Prepare dropdown data
  const dropdownData = useMemo(() => {
    const addOption = shouldShowQuickAdd ? ('quick_add' as const) : ('add_contact' as const);
    const options: (PrayerSubject | 'add_contact' | 'quick_add')[] = [...filteredSubjects];
    if (showQuickAdd || showAddContactButton) {
      options.push(addOption);
    }
    return options;
  }, [filteredSubjects, shouldShowQuickAdd, showQuickAdd, showAddContactButton]);

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {hasInvalidContact && invalidHint && (
            <Text style={styles.invalidHint}>{invalidHint}</Text>
          )}
        </View>
      )}

      <View style={styles.selectorRow}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={[
              styles.searchInput,
              hasInvalidContact && styles.searchInputInvalid,
              disabled && styles.searchInputDisabled,
            ]}
            placeholder={placeholder}
            placeholderTextColor={SUBTLE_TEXT}
            value={searchText}
            onChangeText={handleSearchTextChange}
            onFocus={() => setShowAutocomplete(searchText.trim().length > 0)}
            onBlur={() => {
              setTimeout(() => setShowAutocomplete(false), 200);
            }}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!disabled}
          />
          <Pressable
            style={({ pressed }) => [
              styles.dropdownCaret,
              pressed && styles.dropdownCaretPressed,
            ]}
            onPress={() => !disabled && setDropdownVisible(true)}
            disabled={disabled}
          >
            <Ionicons name="chevron-down" size={20} color={disabled ? '#ccc' : SUBTLE_TEXT} />
          </Pressable>

          {/* Autocomplete Results */}
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
                {/* Quick add option */}
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

        {/* Add Contact Button */}
        {showAddContactButton && onNavigateToAddContact && (
          <Pressable
            style={({ pressed }) => [
              styles.addContactButton,
              pressed && styles.addContactButtonPressed,
              disabled && styles.addContactButtonDisabled,
            ]}
            onPress={handleAddContact}
            disabled={disabled}
          >
            <Ionicons name="person-add" size={20} color={disabled ? '#ccc' : ACTIVE_GREEN} />
          </Pressable>
        )}
      </View>

      {/* Dropdown Modal */}
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
              renderItem={renderDropdownItem}
              style={styles.dropdownList}
              ItemSeparatorComponent={() => <View style={styles.dropdownSeparator} />}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
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
  addContactButtonDisabled: {
    opacity: 0.5,
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
  autocompleteContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(45, 62, 49, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 4,
    left: 0,
    marginTop: 4,
    maxHeight: 264,
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
  container: {
    marginBottom: 20,
    overflow: 'visible',
    zIndex: 20,
  },
  containerDisabled: {
    opacity: 0.6,
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
  dropdownSeparator: {
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    height: StyleSheet.hairlineWidth,
  },
  invalidHint: {
    color: '#D32F2F',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginLeft: 8,
  },
  label: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    marginLeft: 4,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
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
    letterSpacing: 0,
    paddingHorizontal: 16,
    paddingRight: 40,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  searchInputDisabled: {
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
  },
  searchInputInvalid: {
    backgroundColor: 'rgba(255, 235, 238, 0.9)',
    borderColor: '#D32F2F',
    borderWidth: 1.5,
  },
  selectorRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
