import React, { useEffect } from 'react';
import { Text, FlatList } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserPrayers } from '@/store/userPrayersSlice';
import { RootState } from '../../store/store';
import Card from '@/components/ui/PrayerCard';

const renderItem = ({ item }) => (
  <Card
    title={item.title}
    createdDate={item.createdDate}
    answered={item.answered}
  >
    <Text>{item.prayerDescription}</Text>
  </Card>
);

export default function Cards() {
  const dispatch = useAppDispatch();
  const { prayers, status, error } = useAppSelector(
    (state: RootState) => state.userPrayers
  );
  const { user, isAuthenticated } = useAppSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated && status === 'idle') {
      dispatch(fetchUserPrayers());
    }
  }, [dispatch, user, isAuthenticated, status]);

  if (status === 'loading') return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  if (!prayers || prayers.length === 0) return <Text>No prayers found</Text>;

  return (
    <FlatList
      data={prayers}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderItem}
    />
  );
}
