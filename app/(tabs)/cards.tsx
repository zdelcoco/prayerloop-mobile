import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, FlatList, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserPrayers, addUserPrayer } from '@/store/userPrayersSlice';
import { RootState } from '../../store/store';
import { useHeaderHeight } from '@react-navigation/elements';
import { Dimensions } from 'react-native';
import LoadingModal from '@/components/ui/LoadingModal';

import type { Prayer } from '@/util/getUserPrayers.types';

import { CreateUserPrayerRequest } from '@/util/createUserPrayer.types';

import PrayerCards from '@/components/PrayerCards/PrayerCards';
import AddButton from '@/components/ui/AddButton';
import AddPrayerModal from '@/components/PrayerCards/AddPrayerModal';
import { useFocusEffect } from 'expo-router';

export default function Cards() {
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList<Prayer>>(null);

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

  const fetchData = useCallback(() => {
    dispatch(fetchUserPrayers());
  }, [dispatch]);

  useFocusEffect(fetchData);

  const onAddPressHandler = () => {
    toggleModal();
  };

  const onAddPrayerHandler = (prayerData: CreateUserPrayerRequest) => {
    dispatch(addUserPrayer(prayerData));
  };

  const toggleModal = () => setModalVisible(!modalVisible);

  const onRefresh = async () => {
    if (refreshing) return; // Prevent duplicate refresh triggers
    setRefreshing(true);
    try {
      await dispatch(fetchUserPrayers());
    } catch (error) {
      console.error("Failed to refresh prayers:", error);
    } finally {
      setRefreshing(false);
      // Use a timeout to ensure that scrollToOffset doesn't conflict with FlatList's internal logic
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100); // 100ms delay to avoid conflicts
    }
  };

  const statusOverride = false;

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        <LoadingModal
          visible={status === 'loading' || statusOverride}
          message='Loading prayers...'
        />
        {error && <Text style={styles.text}>Error: {error}</Text>}
        {!prayers || prayers.length === 0 ? (
          <Text style={styles.text}>No prayers found</Text>
        ) : (
          <PrayerCards
            prayers={prayers}
            refreshing={refreshing}
            onRefresh={onRefresh}
            flatListRef={flatListRef}
          />
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
