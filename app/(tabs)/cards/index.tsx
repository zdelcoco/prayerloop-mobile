import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useHeaderHeight } from '@react-navigation/elements';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchUserPrayers,
  addUserPrayer,
  setSearchQuery,
  setFilters,
  selectSearchQuery,
  selectFilters,
  selectFilteredPrayers,
} from '@/store/userPrayersSlice';
import { logout } from '@/store/authSlice';
import { RootState } from '@/store/store';

import LoadingModal from '@/components/ui/LoadingModal';
import PrayerCards from '@/components/PrayerCards/PrayerCards';
import AddButton from '@/components/ui/AddButton';
import PrayerSessionModal from '@/components/PrayerSession/PrayerSessionModal';
import SearchBar from '@/components/Search/SearchBar';
import FilterModal, { FilterOptions } from '@/components/Search/FilterModal';

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

  const searchQuery = useAppSelector(selectSearchQuery);
  const filters = useAppSelector(selectFilters);
  const filteredPrayers = useAppSelector(selectFilteredPrayers);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchBarVisible, setSearchBarVisible] = useState(false);

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

  // Expose functions to global for tab layout to access
  useLayoutEffect(() => {
    (global as any).cardsSetPrayerSessionVisible = setPrayerSessionVisible;
    (global as any).cardsToggleSearch = () => setSearchBarVisible((prev) => !prev);
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

  const handleSearchChange = (text: string) => {
    dispatch(setSearchQuery(text));
  };

  const handleFilterPress = () => {
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    dispatch(setFilters(newFilters));
  };

  // Hide search bar when user starts scrolling (only if no active search/filters)
  const handleScrollBeginDrag = useCallback(() => {
    if (
      searchBarVisible &&
      !searchQuery &&
      !filters.createdBy &&
      filters.dateRange === 'all' &&
      filters.isAnswered === null
    ) {
      setSearchBarVisible(false);
    }
  }, [searchBarVisible, searchQuery, filters]);

  const displayedPrayers = filteredPrayers || prayers;

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
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        availableUsers={[]}
      />
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        {/* Search Bar - shown when searchBarVisible is true */}
        {searchBarVisible && (
          <View style={styles.searchBarContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={handleSearchChange}
              onFilterPress={handleFilterPress}
              placeholder="Search prayers..."
            />
          </View>
        )}

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
        ) : displayedPrayers && displayedPrayers.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No Results</Text>
            <Text style={styles.emptyStateText}>
              No prayers match your search or filters.
            </Text>
          </View>
        ) : (
          <PrayerCards
            userId={user!.userProfileId}
            token={token ?? ''}
            prayers={displayedPrayers || []}
            refreshing={refreshing}
            onRefresh={onRefresh}
            flatListRef={flatListRef}
            onActionComplete={() => {
              onRefresh();
            }}
            onScrollBeginDrag={handleScrollBeginDrag}
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
  emptyStateContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  emptyStateTitle: {
    color: '#333',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  inlineLoadingIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
  },
  text: {
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
});
