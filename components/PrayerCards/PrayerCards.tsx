import { Text, FlatList, ListRenderItem, StyleSheet } from 'react-native';
import type { Prayer } from '@/util/getUserPrayers.types';
import React from 'react';

import Card from '@/components/PrayerCards/PrayerCard';

interface PrayerCardsProps {
  prayers: Prayer[]; 
  refreshing: boolean;
  onRefresh: () => void;
  flatListRef: React.RefObject<FlatList<any>>;
}

const renderItem: ListRenderItem<Prayer> = ({ item }) => (
  <Card
    id={item.prayerId.toString()}
    title={item.title}
    createdDate={item.datetimeCreate}
    answered={item.isAnswered}
  >
    <Text>{item.prayerDescription}</Text>
  </Card>
);

export default function PrayerCards({ prayers, refreshing, onRefresh, flatListRef }: PrayerCardsProps) {
  return (
    <FlatList
      ref={flatListRef}
      data={prayers}
      keyExtractor={(item) => item.prayerId.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      initialNumToRender={10}
      windowSize={5}
      removeClippedSubviews={true}
      refreshing={refreshing} 
      onRefresh={onRefresh} 
      progressViewOffset={50} 
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 24,
  },
});
