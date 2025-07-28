import React, { useState, useEffect, useCallback } from 'react';
import { Text, FlatList, ListRenderItem, StyleSheet } from 'react-native';
import type { Prayer, User } from '@/util/shared.types';

import Card from '@/components/PrayerCards/PrayerCard';
import PrayerDetailModal from './PrayerDetailModal';
import { useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { getGroupUsers } from '@/util/getGroupUsers';

interface PrayerCardsProps {
  userId: number;
  token: string;
  prayers: Prayer[];
  refreshing: boolean;
  onRefresh: () => void;
  flatListRef: React.RefObject<FlatList<any>>;
  onActionComplete: () => void;
}

export default function PrayerCards({
  userId,
  token,
  prayers,
  refreshing,
  onRefresh,
  flatListRef,
  onActionComplete,
}: PrayerCardsProps) {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [usersLookup, setUsersLookup] = useState<{ [userProfileId: number]: User }>({});

  const { groups } = useAppSelector((state: RootState) => state.userGroups);

  const fetchAllGroupUsers = useCallback(async () => {
    if (!groups || !token) return;

    const allUsers: { [userProfileId: number]: User } = {};

    try {
      // Fetch users from all groups in parallel
      const userPromises = groups.map(async (group) => {
        const result = await getGroupUsers(token, group.groupId);
        if (result.success && result.data) {
          const users = result.data as User[];
          users.forEach((user) => {
            allUsers[user.userProfileId] = user;
          });
        }
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

  const renderItem: ListRenderItem<Prayer> = ({ item }) => (
    <Card 
      prayer={item} 
      onPress={() => onPressHandler(item)} 
      currentUserId={userId}
      usersLookup={usersLookup}
    >
      <Text>{item.prayerDescription}</Text>
    </Card>
  );

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
