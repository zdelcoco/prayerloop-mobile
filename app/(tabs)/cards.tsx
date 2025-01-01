import { Text, FlatList } from 'react-native';

import Card from '@/components/ui/PrayerCard';

const defaultPrayers = [
  {
    title: 'Prayer for healing',
    createdDate: '2021-08-15',
    answered: false,
  },
  {
    title: 'Prayer for peace',
    createdDate: '2021-08-15',
    answered: true,
  },
  {
    title: 'Prayer for strength',
    createdDate: '2021-08-15',
    answered: false,
  },
]

const renderItem = ({ item }) => (
  <Card title={item.title} createdDate={item.createdDate} answered={item.answered}>
    <Text>Content goes here</Text>
  </Card>
);

export default function Cards() {
  return (
    <FlatList
      data={defaultPrayers}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderItem}
    />
  );
}
