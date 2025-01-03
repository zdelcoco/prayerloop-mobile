import React, { useEffect, useState } from 'react';
import { Text, FlatList, ListRenderItem, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserPrayers, addUserPrayer } from '@/store/userPrayersSlice';
import { RootState } from '../../store/store';
import Card from '@/components/PrayerCards/PrayerCard';
import { useHeaderHeight } from '@react-navigation/elements';
import { Dimensions } from 'react-native';

import type { Prayer } from '@/util/getUserPrayers.types';

import { CreateUserPrayerRequest } from '@/util/createUserPrayer.types';

import PrayerCards from '@/components/PrayerCards/PrayerCards';
import AddButton from '@/components/ui/AddButton';
import AddPrayerModal from '@/components/PrayerCards/AddPrayerModal';

export default function Cards() {
  const [modalVisible, setModalVisible] = useState(false);

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

  const onAddPressHandler = () => {
    toggleModal();
  };

  const onAddPrayerHandler = (prayerData: CreateUserPrayerRequest) => {
    dispatch(addUserPrayer(prayerData));
  };

  const toggleModal = () => setModalVisible(!modalVisible);

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
          <PrayerCards prayers={prayers} />
        )}
      </View>
      <AddPrayerModal
        visible={modalVisible}
        onAddPrayer={onAddPrayerHandler}
        onClose={toggleModal}
      />
      <AddButton onPress={onAddPressHandler} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  text: {
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
  },
});
