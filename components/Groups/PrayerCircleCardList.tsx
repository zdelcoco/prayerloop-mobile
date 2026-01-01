import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Group, User } from '@/util/shared.types';
import PrayerCircleCard from './PrayerCircleCard';

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

  // Compute local groups for reorder mode
  const localGroups = useMemo(() => {
    if (!enableReorder) {
      return groups;
    }
    // Use reordered state if available, otherwise use original order
    if (reorderedGroups) {
      return reorderedGroups;
    }
    return [...groups];
  }, [groups, enableReorder, reorderedGroups]);

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

  // Sort filtered groups alphabetically
  const sortedGroups = useMemo(
    () => sortGroups(filteredGroups),
    [filteredGroups]
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
      )}

      {/* Group List */}
      {enableReorder ? (
        <GestureHandlerRootView style={styles.container}>
          <DraggableFlatList
            data={localGroups}
            keyExtractor={(item) => item.groupId.toString()}
            renderItem={renderDraggableItem}
            onDragEnd={({ data }) => handleDragEnd(data)}
            ListEmptyComponent={renderEmptyComponent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              localGroups.length === 0
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
        </GestureHandlerRootView>
      ) : (
        <FlatList
          data={sortedGroups}
          keyExtractor={(item) => item.groupId.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            sortedGroups.length === 0
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
    letterSpacing: 0,
    paddingVertical: 0,
  },
});

export default PrayerCircleCardList;
