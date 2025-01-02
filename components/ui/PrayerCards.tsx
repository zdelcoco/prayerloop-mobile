import { Text, FlatList, ListRenderItem, View, StyleSheet } from 'react-native';
import type { Prayer } from '@/util/getUserPrayers.types';

import Card from '@/components/ui/PrayerCard';

interface PrayerCardsProps {
  prayers: Prayer[]; 
}

const renderItem: ListRenderItem<Prayer> = ({ item }) => (
  <Card
    title={item.title}
    createdDate={item.datetimeCreate}
    answered={item.isAnswered}
  >
    <Text>{item.prayerDescription}</Text>
  </Card>
);

export default function PrayerCards({ prayers }: PrayerCardsProps) {
  return (
    <FlatList
      data={prayers}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 24,
  },
});
