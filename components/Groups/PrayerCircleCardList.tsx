import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  Pressable,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, User } from '@/util/shared.types';
import PrayerCircleCard from './PrayerCircleCard';

const SORT_PREFERENCE_KEY = 'prayerCircleSortAlphabetically';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

interface PrayerCircleCardListProps {
  groups: Group[];
  groupMembers?: { [groupId: number]: User[] };
  onGroupPress?: (group: Group) => void;
  onGroupLongPress?: (group: Group) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  searchVisible?: boolean;
  onSearchChange?: (query: string) => void;
  emptyMessage?: string;
  enableReorder?: boolean;
  onReorder?: (reorderedGroups: Group[]) => void;
}

// Sort groups alphabetically by name
const sortGroups = (groups: Group[]): Group[] => {
  return [...groups].sort((a, b) => {
    return a.groupName.localeCompare(b.groupName);
  });
};

const PrayerCircleCardList: React.FC<PrayerCircleCardListProps> = ({
  groups,
  groupMembers = {},
  onGroupPress,
  onGroupLongPress,
  onRefresh,
  refreshing = false,
  searchVisible = false,
  onSearchChange,
  emptyMessage = 'No prayer circles yet',
  enableReorder = false,
  onReorder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [reorderedGroups, setReorderedGroups] = useState<Group[] | null>(null);
  const [sortAlphabetically, setSortAlphabetically] = useState(true);

  // Load sort preference from AsyncStorage on mount
  useEffect(() => {
    const loadSortPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(SORT_PREFERENCE_KEY);
        if (saved !== null) {
          setSortAlphabetically(saved === 'true');
        }
      } catch (error) {
        console.error('Error loading sort preference:', error);
      }
    };
    loadSortPreference();
  }, []);

  // Save sort preference when it changes
  const handleSortToggle = useCallback(async () => {
    const newValue = !sortAlphabetically;
    setSortAlphabetically(newValue);
    try {
      await AsyncStorage.setItem(SORT_PREFERENCE_KEY, String(newValue));
    } catch (error) {
      console.error('Error saving sort preference:', error);
    }
  }, [sortAlphabetically]);

  // Use searchQuery directly
  const currentSearchQuery = searchVisible ? searchQuery : '';

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    onSearchChange?.(text);
  }, [onSearchChange]);

  // Filter and search groups
  const filteredGroups = useMemo(() => {
    let result = groups;

    // Apply search filter
    if (currentSearchQuery.trim()) {
      const query = currentSearchQuery.toLowerCase().trim();
      result = result.filter(
        (group) =>
          group.groupName.toLowerCase().includes(query) ||
          group.groupDescription?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [groups, currentSearchQuery]);

  // Compute local groups for reorder mode (applies both search filter and sorting)
  const localGroups = useMemo(() => {
    let result: Group[];

    if (!enableReorder) {
      result = filteredGroups;
    } else if (reorderedGroups) {
      // Use reordered state if available, but filter by search query
      result = reorderedGroups.filter((group) => {
        if (!currentSearchQuery.trim()) return true;
        const query = currentSearchQuery.toLowerCase().trim();
        return (
          group.groupName.toLowerCase().includes(query) ||
          group.groupDescription?.toLowerCase().includes(query)
        );
      });
    } else {
      result = filteredGroups;
    }

    // Apply alphabetical sorting if enabled
    if (sortAlphabetically) {
      return sortGroups(result);
    }
    return result;
  }, [filteredGroups, enableReorder, reorderedGroups, sortAlphabetically, currentSearchQuery]);

  // Sort filtered groups (alphabetically or by display order)
  const sortedGroups = useMemo(
    () => sortAlphabetically ? sortGroups(filteredGroups) : filteredGroups,
    [filteredGroups, sortAlphabetically]
  );

  const handleGroupPress = useCallback(
    (group: Group) => {
      onGroupPress?.(group);
    },
    [onGroupPress]
  );

  const handleGroupLongPress = useCallback(
    (group: Group) => {
      onGroupLongPress?.(group);
    },
    [onGroupLongPress]
  );

  // Handle drag end for reordering
  const handleDragEnd = useCallback(
    (data: Group[]) => {
      setReorderedGroups(data);
      onReorder?.(data);
    },
    [onReorder]
  );

  // Render item for draggable list
  const renderDraggableItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<Group>) => {
      const index = getIndex() ?? 0;
      const isLastItem = index === localGroups.length - 1;
      const members = groupMembers[item.groupId];

      return (
        <PrayerCircleCard
          group={item}
          members={members}
          onPress={() => handleGroupPress(item)}
          onLongPress={drag}
          isDragging={isActive}
        />
      );
    },
    [localGroups.length, groupMembers, handleGroupPress]
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: Group;
    index: number;
  }) => {
    const members = groupMembers[item.groupId];

    return (
      <PrayerCircleCard
        group={item}
        members={members}
        onPress={() => handleGroupPress(item)}
        onLongPress={() => handleGroupLongPress(item)}
      />
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="users" size={48} color={SUBTLE_TEXT} />
      <Text style={styles.emptyText}>{emptyMessage}</Text>
      {currentSearchQuery.trim() && (
        <Text style={styles.emptySubtext}>
          Try adjusting your search
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar - controlled by parent */}
      {searchVisible && (
        <View style={styles.searchRow}>
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
                placeholder="Search prayer circles..."
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
          {/* Sort Toggle Button */}
          <Pressable
            onPress={handleSortToggle}
            style={({ pressed }) => [
              styles.sortButton,
              sortAlphabetically && styles.sortButtonActive,
              pressed && styles.sortButtonPressed,
            ]}
          >
            <FontAwesome5
              name="sort-alpha-down"
              size={16}
              color={sortAlphabetically ? '#FFFFFF' : DARK_TEXT}
            />
          </Pressable>
        </View>
      )}

      {/* Group List */}
      {enableReorder ? (
        <GestureHandlerRootView style={styles.container}>
          {localGroups.length === 0 ? (
            renderEmptyComponent()
          ) : (
            <DraggableFlatList
              data={localGroups}
              keyExtractor={(item) => item.groupId.toString()}
              renderItem={renderDraggableItem}
              onDragEnd={({ data }) => handleDragEnd(data)}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
              contentContainerStyle={styles.listContent}
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
        </GestureHandlerRootView>
      ) : (
        sortedGroups.length === 0 ? (
          renderEmptyComponent()
        ) : (
          <FlatList
            data={sortedGroups}
            keyExtractor={(item) => item.groupId.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            contentContainerStyle={styles.listContent}
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
        )
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
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchContainer: {
    flex: 1,
  },
  sortButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  sortButtonActive: {
    backgroundColor: ACTIVE_GREEN,
    borderColor: ACTIVE_GREEN,
  },
  sortButtonPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.5)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    letterSpacing: 0,
    paddingVertical: 0,
  },
});

export default PrayerCircleCardList;
