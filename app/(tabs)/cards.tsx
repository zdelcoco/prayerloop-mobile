import React, { useEffect } from 'react';
import { Text, FlatList, ListRenderItem, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserPrayers } from '@/store/userPrayersSlice';
import { RootState } from '../../store/store';
import Card from '@/components/ui/PrayerCard';
import { useHeaderHeight } from '@react-navigation/elements';
import { Dimensions } from 'react-native';

import type { Prayer } from '@/util/getUserPrayers.types';

const renderItem: ListRenderItem<Prayer> = ({ item }) => (
  <Card
    title={item.title}
    createdDate={item.datetimeCreate}
    answered={item.isAnswered}
  >
    <Text>{item.prayerDescription}</Text>
  </Card>
);

export default function Cards() {
  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

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

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        {status === 'loading' && <Text style={styles.text}>Loading...</Text>}
        {error && <Text style={styles.text}>Error: {error}</Text>}
        {!prayers || prayers.length === 0 ? (
          <Text style={styles.text}>No prayers found</Text>
        ) : (
          <FlatList
            data={prayers}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Card
                title={item.title}
                createdDate={item.datetimeCreate}
                answered={item.isAnswered}
              >
                <Text>{item.prayerDescription}</Text>
              </Card>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  listContainer: {
    paddingBottom: 20,
    flex: 1,
  },
  text: {
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
  },
});
