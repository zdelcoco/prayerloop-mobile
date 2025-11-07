import React, { useState, useEffect, useCallback } from 'react';
import { Text, FlatList, ListRenderItem, StyleSheet } from 'react-native';
import type { Prayer, User } from '@/util/shared.types';

import Card from '@/components/PrayerCards/PrayerCard';
import PrayerDetailModal from './PrayerDetailModal';
import { useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { groupUsersCache } from '@/util/groupUsersCache';

interface PrayerCardsProps {
  userId: number;
  token: string;
  prayers: Prayer[];
  refreshing: boolean;
  onRefresh: () => void;
  flatListRef: React.RefObject<FlatList<any>>;
  onActionComplete: () => void;
  context?: 'cards' | 'groups'; // Add context prop
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
}: PrayerCardsProps) {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [usersLookup, setUsersLookup] = useState<{ [userProfileId: number]: User }>({});

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

  const renderItem: ListRenderItem<Prayer> = ({ item }) => {
    // Check if prayer description is long enough to be truncated
    const isLongPrayer = item.prayerDescription.length > 200 || item.prayerDescription.split('\n').length > 8;

    return (
      <Card
        prayer={item}
        onPress={() => onPressHandler(item)}
        currentUserId={userId}
        usersLookup={usersLookup}
        showReadMore={isLongPrayer}
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
      <FlatList
        ref={flatListRef}
        data={prayers}
        keyExtractor={(item) => item.prayerId.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        extraData={prayers}
        refreshing={refreshing}
        onRefresh={onRefresh}
        windowSize={5}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 24,
  },
});
