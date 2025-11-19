import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, FlatList, ListRenderItem, StyleSheet, Alert } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import type { Prayer, User } from '@/util/shared.types';

import Card from '@/components/PrayerCards/PrayerCard';
import PrayerDetailModal from './PrayerDetailModal';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { groupUsersCache } from '@/util/groupUsersCache';
import { reorderPrayers } from '@/store/userPrayersSlice';
import { reorderPrayersInGroup } from '@/store/groupPrayersSlice';

interface PrayerCardsProps {
  userId: number;
  token: string;
  prayers: Prayer[];
  refreshing: boolean;
  onRefresh: () => void;
  flatListRef: React.RefObject<FlatList<Prayer>>;
  onActionComplete: () => void;
  context?: 'cards' | 'groups'; // Add context prop
  groupId?: number; // Add groupId for group prayers reordering
}

export default function PrayerCards({
  userId,
  token,
  prayers,
  refreshing,
  onRefresh,
  flatListRef,
  onActionComplete,
  context = 'cards', // Default to 'cards' for backward compatibility
  groupId, // Add groupId to destructured props
}: PrayerCardsProps) {
  const dispatch = useAppDispatch();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [usersLookup, setUsersLookup] = useState<{ [userProfileId: number]: User }>({});
  const hasShownGroupReorderWarning = useRef(false);

  const { groups } = useAppSelector((state: RootState) => state.userGroups);

  const fetchAllGroupUsers = useCallback(async () => {
    if (!groups || !Array.isArray(groups) || !token) return;

    const allUsers: { [userProfileId: number]: User } = {};

    try {
      // Fetch users from all groups using cache
      const userPromises = groups.map(async (group) => {
        const users = await groupUsersCache.fetchGroupUsers(token, group.groupId);
        users.forEach((user) => {
          allUsers[user.userProfileId] = user;
        });
      });

      await Promise.all(userPromises);
      setUsersLookup(allUsers);
    } catch (error) {
      console.error('Error fetching group users for prayer cards:', error);
    }
  }, [groups, token]);

  useEffect(() => {
    fetchAllGroupUsers();
  }, [fetchAllGroupUsers]);

  const onPressHandler = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setDetailModalVisible(true);
  };

  const closeModal = () => {
    setDetailModalVisible(false);
    setSelectedPrayer(null);
  };

  const handleDragEnd = useCallback((data: Prayer[]) => {
    if (context === 'cards') {
      dispatch(reorderPrayers(data));
    } else if (context === 'groups' && groupId) {
      // Show warning alert for group prayers (first time only)
      if (!hasShownGroupReorderWarning.current) {
        hasShownGroupReorderWarning.current = true;
        Alert.alert(
          'Reorder Group Prayers',
          'Reordering prayers in a group will affect how everyone in the group sees them. Continue?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                // Revert the optimistic update by refetching
                onRefresh();
              },
            },
            {
              text: 'Continue',
              onPress: () => {
                dispatch(reorderPrayersInGroup(groupId, data));
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // User has already seen the warning, just dispatch
        dispatch(reorderPrayersInGroup(groupId, data));
      }
    }
  }, [dispatch, context, groupId, onRefresh]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Prayer>) => {
    // Check if prayer description is long enough to be truncated
    const isLongPrayer = item.prayerDescription.length > 200 || item.prayerDescription.split('\n').length > 8;

    return (
      <Card
        prayer={item}
        onPress={() => onPressHandler(item)}
        onLongPress={drag}
        currentUserId={userId}
        usersLookup={usersLookup}
        showReadMore={isLongPrayer}
        isActive={isActive}
      >
        <Text numberOfLines={8} ellipsizeMode="tail">{item.prayerDescription}</Text>
      </Card>
    );
  };

  return (
    <>
      {selectedPrayer && (
        <PrayerDetailModal
          visible={detailModalVisible}
          userId={userId}
          userToken={token}
          prayer={selectedPrayer}
          onClose={closeModal}
          onActionComplete={onActionComplete}
          onShare={() => {}} // Not needed anymore since sharing is integrated
          usersLookup={usersLookup}
          context={context}
        />
      )}
      <DraggableFlatList
        ref={flatListRef}
        data={prayers}
        keyExtractor={(item) => item.prayerId.toString()}
        renderItem={renderItem}
        onDragEnd={({ data }) => handleDragEnd(data)}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 24,
  },
});
