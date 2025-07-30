import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import {
  Text,
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHeaderHeight } from '@react-navigation/elements';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserPrayers, addUserPrayer } from '@/store/userPrayersSlice';
import { logout } from '@/store/authSlice';
import { RootState } from '@/store/store';

import LoadingModal from '@/components/ui/LoadingModal';
import PrayerCards from '@/components/PrayerCards/PrayerCards';
import AddButton from '@/components/ui/AddButton';
import PrayerSessionModal from '@/components/PrayerSession/PrayerSessionModal';

import type { Prayer } from '@/util/shared.types';
import { ReactReduxContext } from 'react-redux';

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
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);

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

  // Add this to window for tab layout to access
  useLayoutEffect(() => {
    (global as any).cardsSetPrayerSessionVisible = setPrayerSessionVisible;
  }, [setPrayerSessionVisible]);

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

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <LoadingModal
        visible={status === 'loading'}
        message='Loading prayers...'
        onClose={toggleLoadingModal}
      />
      <PrayerSessionModal
        visible={prayerSessionVisible}
        prayers={prayers || []}
        currentUserId={user?.userProfileId || 0}
        onClose={() => setPrayerSessionVisible(false)}
        contextTitle="Personal Prayers"
      />
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        {error && <Text style={styles.text}>Error: {error}</Text>}
        {!user || !prayers || prayers.length === 0 ? (
          status !== 'loading' ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Prayers Yet</Text>
              <Text style={styles.emptyStateText}>
                You haven't created any prayers yet. Tap the + button below to add your first prayer!
              </Text>
            </View>
          ) : null
        ) : (
          <PrayerCards
            userId={user!.userProfileId}
            token={token ?? ''}
            prayers={prayers}
            refreshing={refreshing}
            onRefresh={onRefresh}
            flatListRef={flatListRef}
            onActionComplete={() => {
              onRefresh();
            }}
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
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  inlineLoadingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
});
