import React, { useState } from 'react';
import { Text, FlatList, ListRenderItem, StyleSheet } from 'react-native';
import type { Prayer } from '@/util/shared.types';

import Card from '@/components/PrayerCards/PrayerCard';

interface PrayerCardsProps {
  userId: number;
  token: string;
  prayers: Prayer[];
  refreshing: boolean;
  onRefresh: () => void;
  flatListRef: React.RefObject<FlatList<any>>;
  setLoading: (isLoading: boolean) => void;
}

export default function PrayerCards({
  userId,
  token,
  prayers,
  refreshing,
  onRefresh,
  flatListRef,
  setLoading,
}: PrayerCardsProps) {
  const renderItem: ListRenderItem<Prayer> = ({ item }) => (
    <Card
      userId={userId}
      prayer={item}
      userToken={token}
      setLoading={setLoading}
    >
      <Text>{item.prayerDescription}</Text>
    </Card>
  );

  return (
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
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 24,
  },
});
