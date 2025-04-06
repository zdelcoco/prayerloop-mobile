import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Text,
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHeaderHeight } from '@react-navigation/elements';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserPrayers, addUserPrayer } from '@/store/userPrayersSlice';
import { RootState } from '../../../store/store';

import LoadingModal from '@/components/ui/LoadingModal';
import PrayerCards from '@/components/PrayerCards/PrayerCards';
import AddButton from '@/components/ui/AddButton';

import type { Prayer } from '@/util/shared.types';

type RootStackParamList = {
  PrayerModal: { mode: string };
};

export default function Cards() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const { token, user } = useAppSelector((state: RootState) => state.auth);

  const { prayers, status, error } = useAppSelector(
    (state: RootState) => state.userPrayers
  );

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loadingModalVisible, setLoadingModalVisible] = useState(
    status === 'loading' || loading
  );

  const flatListRef = useRef<FlatList<Prayer>>(null);
  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const fetchData = useCallback(() => {
    dispatch(fetchUserPrayers());
  }, [dispatch]);

  useFocusEffect(fetchData);

  const onAddPressHandler = () => {
    navigation.navigate('PrayerModal', { mode: 'add' });
  };

  const toggleLoadingModal = () => setLoadingModalVisible(!loadingModalVisible);

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await dispatch(fetchUserPrayers());
    } catch (error) {
      console.error('Failed to refresh prayers:', error);
    } finally {
      setRefreshing(false);
      // Use a timeout to ensure that scrollToOffset doesn't conflict with FlatList's internal logic
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100); // 100ms delay to avoid conflicts
    }
  };

  useEffect(() => {
    if (loading) {
      setLoadingModalVisible(true);
    } else {
      setLoadingModalVisible(false);
    }
  }, [loading]);

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <LoadingModal
        visible={status === 'loading' || loadingModalVisible}
        message='Loading prayers...'
        onClose={toggleLoadingModal}
      />
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        {error && <Text style={styles.text}>Error: {error}</Text>}
        {!user || !prayers || prayers.length === 0 ? (
          <Text style={styles.text}>No prayers found</Text>
        ) : (
          <PrayerCards
            userId={user!.userProfileId}
            token={token ?? ''}
            prayers={prayers}
            refreshing={refreshing}
            onRefresh={onRefresh}
            flatListRef={flatListRef}
            onActionComplete={fetchData}
          />
        )}
      </View>
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
