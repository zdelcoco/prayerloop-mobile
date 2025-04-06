import React, { useState } from 'react';
import { Text, FlatList, ListRenderItem, StyleSheet } from 'react-native';
import type { Prayer } from '@/util/shared.types';

import Card from '@/components/PrayerCards/PrayerCard';
import PrayerDetailModal from './PrayerDetailModal';

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

  const onPressHandler = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setDetailModalVisible(true);
  };

  const renderItem: ListRenderItem<Prayer> = ({ item }) => (
    <Card prayer={item} onPress={() => onPressHandler(item)}>
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
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedPrayer(null);
          }}
          onActionComplete={onActionComplete}
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
