import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TextInput,
  RefreshControl,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PrayerSubject } from '@/util/shared.types';
import ContactCard from './ContactCard';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

// Threshold for showing section headers
const SECTION_HEADER_THRESHOLD = 10;

type FilterType = 'all' | 'individual' | 'family' | 'group';

interface ContactCardListProps {
  contacts: PrayerSubject[];
  currentUserId?: number;
  onContactPress?: (contact: PrayerSubject) => void;
  onContactLongPress?: (contact: PrayerSubject) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  searchVisible?: boolean;
  onSearchChange?: (query: string) => void;
  showFilters?: boolean;
  emptyMessage?: string;
  enableReorder?: boolean;
  onReorder?: (reorderedContacts: PrayerSubject[]) => void;
}

// Sort contacts: user's own card first, then alphabetically by display name
const sortContacts = (contacts: PrayerSubject[], currentUserId?: number): PrayerSubject[] => {
  return [...contacts].sort((a, b) => {
    // User's own card comes first
    const aIsSelf = currentUserId && a.userProfileId === currentUserId;
    const bIsSelf = currentUserId && b.userProfileId === currentUserId;

    if (aIsSelf && !bIsSelf) return -1;
    if (bIsSelf && !aIsSelf) return 1;

    // Then sort alphabetically
    return a.prayerSubjectDisplayName.localeCompare(b.prayerSubjectDisplayName);
  });
};

// Group contacts into sections for SectionList
const groupContactsIntoSections = (
  contacts: PrayerSubject[],
  currentUserId?: number
): { title: string; data: PrayerSubject[] }[] => {
  const sections: { [key: string]: PrayerSubject[] } = {};
  let userCard: PrayerSubject | null = null;

  contacts.forEach((contact) => {
    // Separate user's own card
    if (currentUserId && contact.userProfileId === currentUserId) {
      userCard = contact;
      return;
    }

    const firstLetter = contact.prayerSubjectDisplayName.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';

    if (!sections[key]) {
      sections[key] = [];
    }
    sections[key].push(contact);
  });

  // Sort contacts within each section
  Object.keys(sections).forEach((key) => {
    sections[key].sort((a, b) =>
      a.prayerSubjectDisplayName.localeCompare(b.prayerSubjectDisplayName)
    );
  });

  // Build result array with user's card first (no section header)
  const result: { title: string; data: PrayerSubject[] }[] = [];

  if (userCard) {
    result.push({ title: '', data: [userCard] });
  }

  // Add alphabetical sections
  Object.keys(sections)
    .sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    })
    .forEach((key) => {
      result.push({ title: key, data: sections[key] });
    });

  return result;
};

const ContactCardList: React.FC<ContactCardListProps> = ({
  contacts,
  currentUserId,
  onContactPress,
  onContactLongPress,
  onRefresh,
  refreshing = false,
  searchVisible = false,
  onSearchChange,
  showFilters = true,
  emptyMessage = 'No contacts yet',
  enableReorder = false,
  onReorder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [reorderedContacts, setReorderedContacts] = useState<PrayerSubject[] | null>(null);

  // Compute local contacts for reorder mode (sorted by displaySequence when reordering)
  const localContacts = useMemo(() => {
    if (!enableReorder) {
      return contacts;
    }
    // Use reordered state if available, otherwise sort by displaySequence
    if (reorderedContacts) {
      return reorderedContacts;
    }
    return [...contacts].sort((a, b) => a.displaySequence - b.displaySequence);
  }, [contacts, enableReorder, reorderedContacts]);

  // Use searchQuery directly, clearing is controlled by parent component
  const currentSearchQuery = searchVisible ? searchQuery : '';

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    onSearchChange?.(text);
  }, [onSearchChange]);

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Apply type filter
    if (activeFilter !== 'all') {
      result = result.filter(
        (contact) => contact.prayerSubjectType === activeFilter
      );
    }

    // Apply search filter
    if (currentSearchQuery.trim()) {
      const query = currentSearchQuery.toLowerCase().trim();
      result = result.filter(
        (contact) =>
          contact.prayerSubjectDisplayName.toLowerCase().includes(query) ||
          contact.notes?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [contacts, activeFilter, currentSearchQuery]);

  // Sort filtered contacts: user's card first, then alphabetically
  const sortedContacts = useMemo(
    () => sortContacts(filteredContacts, currentUserId),
    [filteredContacts, currentUserId]
  );

  const handleContactPress = useCallback(
    (contact: PrayerSubject) => {
      onContactPress?.(contact);
    },
    [onContactPress]
  );

  const handleContactLongPress = useCallback(
    (contact: PrayerSubject) => {
      onContactLongPress?.(contact);
    },
    [onContactLongPress]
  );

  // Handle drag end for reordering
  const handleDragEnd = useCallback(
    (data: PrayerSubject[]) => {
      setReorderedContacts(data);
      onReorder?.(data);
    },
    [onReorder]
  );

  // Render item for draggable list
  const renderDraggableItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<PrayerSubject>) => {
      const index = getIndex() ?? 0;
      const isLastItem = index === localContacts.length - 1;

      return (
        <ContactCard
          contact={item}
          isCurrentUser={currentUserId !== undefined && item.userProfileId === currentUserId}
          onPress={() => handleContactPress(item)}
          onLongPress={drag}
          showSeparator={!isLastItem}
          isDragging={isActive}
          showDragHandle={true}
        />
      );
    },
    [currentUserId, localContacts.length, handleContactPress]
  );

  const renderItem = ({
    item,
    index,
    section,
  }: {
    item: PrayerSubject;
    index: number;
    section?: { title: string; data: PrayerSubject[] };
  }) => {
    // For SectionList, hide separator on last item in section
    // For FlatList, hide separator on last item overall
    const isLastInSection = section
      ? index === section.data.length - 1
      : index === sortedContacts.length - 1;

    return (
      <ContactCard
        contact={item}
        isCurrentUser={currentUserId !== undefined && item.userProfileId === currentUserId}
        onPress={() => handleContactPress(item)}
        onLongPress={() => handleContactLongPress(item)}
        showSeparator={!isLastInSection}
      />
    );
  };

  // Group contacts into sections when threshold is met
  const sections = useMemo(
    () => groupContactsIntoSections(sortedContacts, currentUserId),
    [sortedContacts, currentUserId]
  );

  const useSectionList = filteredContacts.length > SECTION_HEADER_THRESHOLD;

  const renderSectionHeader = ({ section }: { section: { title: string; data: PrayerSubject[] } }) => {
    // Don't render header for user's card section (empty title)
    if (!section.title) return null;

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <View style={styles.sectionHeaderLine} />
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="users" size={48} color={SUBTLE_TEXT} />
      <Text style={styles.emptyText}>{emptyMessage}</Text>
      {currentSearchQuery.trim() && (
        <Text style={styles.emptySubtext}>
          Try adjusting your search or filters
        </Text>
      )}
    </View>
  );

  const renderFilterButton = (
    filter: FilterType,
    label: string,
    icon: 'th-list' | 'user' | 'home' | 'users'
  ) => (
    <Pressable
      key={filter}
      onPress={() => setActiveFilter(filter)}
      style={[
        styles.filterButton,
        activeFilter === filter && styles.filterButtonActive,
      ]}
    >
      <FontAwesome
        name={icon}
        size={12}
        color={activeFilter === filter ? '#FFFFFF' : DARK_TEXT}
        style={styles.filterIcon}
      />
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar - controlled by parent */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <BlurView intensity={60} tint="light" style={styles.searchBlur}>
            <FontAwesome
              name="search"
              size={16}
              color={SUBTLE_TEXT}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor={SUBTLE_TEXT}
              value={currentSearchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            {currentSearchQuery.length > 0 && (
              <Pressable
                onPress={() => handleSearchChange('')}
                style={styles.clearButton}
              >
                <FontAwesome name="times-circle" size={16} color={SUBTLE_TEXT} />
              </Pressable>
            )}
          </BlurView>
        </View>
      )}

      {/* Filter Buttons - shown with search */}
      {searchVisible && showFilters && (
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All', 'th-list')}
          {renderFilterButton('individual', 'People', 'user')}
          {renderFilterButton('family', 'Families', 'home')}
          {renderFilterButton('group', 'Groups', 'users')}
        </View>
      )}

      {/* Contact List */}
      {enableReorder ? (
        <GestureHandlerRootView style={styles.container}>
          <DraggableFlatList
            data={localContacts}
            keyExtractor={(item) => item.prayerSubjectId.toString()}
            renderItem={renderDraggableItem}
            onDragEnd={({ data }) => handleDragEnd(data)}
            ListEmptyComponent={renderEmptyComponent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              localContacts.length === 0
                ? styles.emptyListContent
                : styles.listContent
            }
          />
        </GestureHandlerRootView>
      ) : useSectionList ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.prayerSubjectId.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={
            sortedContacts.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={ACTIVE_GREEN}
                colors={[ACTIVE_GREEN]}
              />
            ) : undefined
          }
        />
      ) : (
        <FlatList
          data={sortedContacts}
          keyExtractor={(item) => item.prayerSubjectId.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            sortedContacts.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={ACTIVE_GREEN}
                colors={[ACTIVE_GREEN]}
              />
            ) : undefined
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  clearButton: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptySubtext: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(45, 62, 49, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterButtonActive: {
    backgroundColor: ACTIVE_GREEN,
    borderColor: ACTIVE_GREEN,
  },
  filterButtonText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Medium',
    fontSize: 13,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  filterIcon: {
    marginRight: 4,
  },
  listContent: {
    paddingBottom: 120,
  },
  searchBlur: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchContainer: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    paddingVertical: 0,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeaderLine: {
    backgroundColor: 'rgba(45, 62, 49, 0.15)',
    flex: 1,
    height: StyleSheet.hairlineWidth,
    marginLeft: 8,
  },
  sectionHeaderText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
});

export default ContactCardList;
