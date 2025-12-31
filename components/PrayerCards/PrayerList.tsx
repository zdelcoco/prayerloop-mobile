import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  RefreshControl,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Prayer, PrayerSubject } from '@/util/shared.types';
import PrayerDetailModal from './PrayerDetailModal';
import { useAppDispatch } from '@/hooks/redux';
import { fetchPrayerSubjects } from '@/store/prayerSubjectsSlice';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

interface PrayerSection {
  subject: PrayerSubject;
  data: Prayer[];
}

interface PrayerListProps {
  subjects: PrayerSubject[];
  currentUserId?: number;
  userToken?: string;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  searchVisible?: boolean;
  showFilters?: boolean;
  emptyMessage?: string;
}

type FilterType = 'all' | 'active' | 'answered';

// Generate initials from display name
const getInitials = (displayName: string): string => {
  const words = displayName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return displayName.substring(0, 2).toUpperCase();
};

// Generate a consistent color based on the name
const getAvatarColor = (displayName: string): string => {
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

// Get icon for subject type
const getTypeIcon = (type: PrayerSubject['prayerSubjectType']): 'home' | 'users' | 'user' => {
  switch (type) {
    case 'family':
      return 'home';
    case 'group':
      return 'users';
    default:
      return 'user';
  }
};

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const PrayerList: React.FC<PrayerListProps> = ({
  subjects,
  currentUserId,
  userToken,
  onRefresh,
  refreshing = false,
  searchVisible = false,
  showFilters = true,
  emptyMessage = 'No prayers yet.',
}) => {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // Prayer detail modal state
  const [selectedPrayer, setSelectedPrayer] = useState<{ prayer: Prayer; subject: PrayerSubject } | null>(null);
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);

  // Create sections from subjects
  const sections = useMemo<PrayerSection[]>(() => {
    const result: PrayerSection[] = [];

    for (const subject of subjects) {
      let prayers = subject.prayers || [];

      // Apply filter
      if (filter === 'active') {
        prayers = prayers.filter(p => !p.isAnswered);
      } else if (filter === 'answered') {
        prayers = prayers.filter(p => p.isAnswered);
      }

      // Apply search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        prayers = prayers.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.prayerDescription.toLowerCase().includes(query) ||
          subject.prayerSubjectDisplayName.toLowerCase().includes(query)
        );
      }

      // Only include sections with prayers
      if (prayers.length > 0) {
        result.push({ subject, data: prayers });
      }
    }

    return result;
  }, [subjects, filter, searchQuery]);

  // Handle prayer press
  const handlePrayerPress = useCallback((prayer: Prayer, subject: PrayerSubject) => {
    setSelectedPrayer({ prayer, subject });
    setPrayerModalVisible(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setPrayerModalVisible(false);
    setSelectedPrayer(null);
  }, []);

  // Handle action complete (after edit/delete)
  const handleActionComplete = useCallback(() => {
    dispatch(fetchPrayerSubjects());
  }, [dispatch]);

  // Render filter button
  const renderFilterButton = (type: FilterType, label: string) => (
    <Pressable
      key={type}
      onPress={() => setFilter(type)}
      style={[
        styles.filterButton,
        filter === type && styles.filterButtonActive,
      ]}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === type && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  // Render section header
  const renderSectionHeader = useCallback(({ section }: { section: PrayerSection }) => {
    const { subject } = section;
    const initials = getInitials(subject.prayerSubjectDisplayName);
    const avatarColor = getAvatarColor(subject.prayerSubjectDisplayName);
    const hasPhoto = subject.photoS3Key !== null;

    return (
      <View style={styles.sectionHeader}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {hasPhoto ? (
            <Image
              source={{ uri: subject.photoS3Key! }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatarInitials, { backgroundColor: avatarColor }]}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}

          {/* Type indicator badge for family/group */}
          {subject.prayerSubjectType !== 'individual' && (
            <View style={styles.typeBadge}>
              <FontAwesome
                name={getTypeIcon(subject.prayerSubjectType)}
                size={10}
                color="#FFFFFF"
              />
            </View>
          )}
        </View>

        {/* Display Name */}
        <Text style={styles.sectionHeaderText} numberOfLines={1}>
          {subject.prayerSubjectDisplayName}
        </Text>

        {/* Prayer count */}
        <Text style={styles.prayerCount}>
          {section.data.length} prayer{section.data.length !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  }, []);

  // Render prayer item
  const renderItem = useCallback(({ item, index, section }: { item: Prayer; index: number; section: PrayerSection }) => {
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;

    return (
      <Pressable
        onPress={() => handlePrayerPress(item, section.subject)}
        style={({ pressed }) => [
          styles.prayerItem,
          isFirst && styles.prayerItemFirst,
          isLast && styles.prayerItemLast,
          !isLast && styles.prayerItemBorder,
          pressed && styles.prayerItemPressed,
        ]}
      >
        <View style={styles.prayerContent}>
          {/* Prayer title */}
          <View style={styles.prayerHeader}>
            <Text style={styles.prayerTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.isAnswered && (
              <View style={styles.answeredBadge}>
                <FontAwesome name="check" size={10} color="#FFFFFF" />
              </View>
            )}
            {item.isPrivate && (
              <Ionicons
                name="lock-closed"
                size={14}
                color={SUBTLE_TEXT}
                style={styles.privateIcon}
              />
            )}
          </View>

          {/* Prayer description */}
          <Text style={styles.prayerDescription} numberOfLines={3}>
            {item.prayerDescription}
          </Text>

          {/* Date row */}
          <Text style={styles.dateText}>
            {formatDate(item.datetimeCreate)}
            {item.isAnswered && item.datetimeAnswered && (
              <Text style={styles.answeredDate}>
                {' · Answered '}{formatDate(item.datetimeAnswered)}
              </Text>
            )}
          </Text>
        </View>

        {/* Chevron */}
        <FontAwesome
          name="chevron-right"
          size={14}
          color={SUBTLE_TEXT}
          style={styles.chevron}
        />
      </Pressable>
    );
  }, [handlePrayerPress]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  );

  // Key extractor
  const keyExtractor = useCallback((item: Prayer) => item.prayerId.toString(), []);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <BlurView intensity={10} tint="regular" style={styles.searchBlur}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={18} color={SUBTLE_TEXT} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search prayers..."
                placeholderTextColor={SUBTLE_TEXT}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={SUBTLE_TEXT} />
                </Pressable>
              )}
            </View>
          </BlurView>
        </View>
      )}

      {/* Filter Buttons - only shown when search is visible */}
      {showFilters && searchVisible && (
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('active', 'Active')}
          {renderFilterButton('answered', 'Answered')}
        </View>
      )}

      {/* Prayer Section List */}
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          sections.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        stickySectionHeadersEnabled={false}
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
        showsVerticalScrollIndicator={false}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      />

      {/* Prayer Detail Modal */}
      {selectedPrayer && (
        <PrayerDetailModal
          visible={prayerModalVisible}
          userId={currentUserId || 0}
          userToken={userToken || ''}
          prayer={selectedPrayer.prayer}
          prayerSubjectId={selectedPrayer.subject.prayerSubjectId}
          onClose={handleModalClose}
          onActionComplete={handleActionComplete}
          onShare={() => {}}
          context="cards"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  answeredBadge: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginLeft: 8,
    width: 20,
  },
  answeredDate: {
    color: ACTIVE_GREEN,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatarImage: {
    backgroundColor: '#ccf0ccff',
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  avatarInitials: {
    alignItems: 'center',
    borderRadius: 22,
    elevation: 2,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 44,
  },
  chevron: {
    marginLeft: 12,
  },
  container: {
    flex: 1,
  },
  dateText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: ACTIVE_GREEN,
  },
  filterButtonText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  initialsText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  prayerContent: {
    flex: 1,
  },
  prayerCount: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginLeft: 'auto',
  },
  prayerDescription: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  prayerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  prayerItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  prayerItemBorder: {
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  prayerItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  prayerItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  prayerItemPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
  },
  prayerTitle: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  privateIcon: {
    marginLeft: 8,
  },
  searchBlur: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchInput: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 0,
  },
  searchInputContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  sectionSeparator: {
    height: 8,
  },
  typeBadge: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderColor: '#F6EDD9',
    borderRadius: 10,
    borderWidth: 2,
    bottom: -2,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 20,
  },
});

export default PrayerList;
