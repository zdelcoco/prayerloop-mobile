import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchGroupPrayers,
  setGroupPrayerSearchQuery,
  setGroupPrayerFilters,
  selectGroupPrayerSearchQuery,
  selectGroupPrayerFilters,
  selectFilteredGroupPrayers,
} from '@/store/groupPrayersSlice';
import { RootState } from '../../../store/store';
import ContextMenuButton from '@/components/ui/ContextMenuButton';

import { Group, User } from '@/util/shared.types';
import LoadingModal from '@/components/ui/LoadingModal';
import PrayerCards from '@/components/PrayerCards/PrayerCards';
import { Prayer } from '@/util/shared.types';
import AddButton from '@/components/ui/AddButton';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from 'expo-router';
import PrayerSessionModal from '@/components/PrayerSession/PrayerSessionModal';
import SearchBar from '@/components/Search/SearchBar';
import FilterModal, { FilterOptions } from '@/components/Search/FilterModal';
import { groupUsersCache } from '@/util/groupUsersCache';

type RootStackParamList = {
  GroupPrayers: { group: string }; // Serialized group as a string
  PrayerModal: { mode: string; groupProfileId: number; groupName: string };
  UsersModal: {};
};

type GroupPrayersNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GroupPrayers'
>;

function ms(size: number): number {
  const scale = 1.2;
  return Math.round(size * scale);
}

export default function GroupPrayers() {
  const navigation = useNavigation<GroupPrayersNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'GroupPrayers'>>();

  // Deserialize the group parameter
  const group: Group = JSON.parse(route.params.group);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [groupUsers, setGroupUsers] = useState<User[]>([]);
  const flatListRef = useRef<FlatList<Prayer>>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const dispatch = useAppDispatch();
  const { prayers, status, error } = useAppSelector(
    (state: RootState) => state.groupPrayers
  );
  const { user, token } = useAppSelector((state: RootState) => state.auth);

  const searchQuery = useAppSelector(selectGroupPrayerSearchQuery);
  const filters = useAppSelector(selectGroupPrayerFilters);
  const filteredPrayers = useAppSelector(selectFilteredGroupPrayers);

  const [loadingModalVisible, setLoadingModalVisible] = useState(
    status === 'loading' || loading
  );

  const toggleLoadingModal = () => setLoadingModalVisible(!loadingModalVisible);

  const handleSearchChange = (text: string) => {
    dispatch(setGroupPrayerSearchQuery(text));
  };

  const handleFilterPress = () => {
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    dispatch(setGroupPrayerFilters(newFilters));
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

  useLayoutEffect(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.setOptions({
        headerTitle: () => (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerTitle}>{group.groupName}</Text>
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name='angle-left' size={28} color='#000' />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <Pressable
              onPress={() => setSearchBarVisible((prev) => !prev)}
              style={({ pressed }) => [
                styles.searchButton,
                pressed && styles.searchButtonPressed,
              ]}
            >
              <Ionicons name="search" size={24} color="#000" />
            </Pressable>
            <ContextMenuButton
              type='groupDetail'
              groupId={group.groupId}
              groupName={group.groupName}
              groupCreatorId={group.createdBy}
              prayerCount={sanitizedPrayers?.length || 0}
              iconSize={24}
            />
          </View>
        ),
      });
    }

    return () => {
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: 'Groups',
          headerLeft: null,
          headerRight: () => <ContextMenuButton type='groups' iconSize={24} />,
        });
      }
    };
  }, [navigation, group, dispatch, prayers, searchBarVisible]);

  const fetchData = useCallback(() => {
    // Debounce fetches to prevent duplicate calls within 500ms
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 500) {
      return;
    }
    lastFetchTimeRef.current = now;

    dispatch(fetchGroupPrayers(group.groupId));
  }, [dispatch, group.groupId]);

  // Fetch group users for the Created By filter
  useEffect(() => {
    const fetchUsers = async () => {
      if (token) {
        try {
          const users = await groupUsersCache.fetchGroupUsers(token, group.groupId);
          setGroupUsers(users);
        } catch (error) {
          console.error('Failed to fetch group users:', error);
        }
      }
    };
    fetchUsers();
  }, [token, group.groupId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Add this to window for context menu to access
  useLayoutEffect(() => {
    (global as any).groupSetPrayerSessionVisible = setPrayerSessionVisible;
  }, [setPrayerSessionVisible]);

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await dispatch(fetchGroupPrayers(group.groupId));
    } catch (error) {
      console.error('Failed to refresh group prayers:', error);
    } finally {
      setRefreshing(false);
      // Use a timeout to ensure that scrollToOffset doesn't conflict with FlatList's internal logic
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100); // 100ms delay to avoid conflicts
    }
  };

  // Todo: fix this on the backend
  const sanitizedPrayers = prayers?.filter(
    (prayer, index, self) =>
      index === self.findIndex((p) => p.prayerId === prayer.prayerId)
  );

  const displayedPrayers = filteredPrayers || sanitizedPrayers;

  const onAddPressHandler = () => {
    console.log('Add button pressed');
    navigation.navigate('PrayerModal', {
      mode: 'add',
      groupProfileId: group.groupId,
      groupName: group.groupName,
    });
  };

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <LoadingModal
        visible={status === 'loading' || loading}
        message='Loading group prayers...'
        onClose={toggleLoadingModal}
      />
      <PrayerSessionModal
        visible={prayerSessionVisible}
        prayers={sanitizedPrayers || []}
        currentUserId={user?.userProfileId || 0}
        onClose={() => setPrayerSessionVisible(false)}
        contextTitle={group.groupName}
      />
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        availableUsers={groupUsers.map((user) => ({
          id: user.userProfileId,
          name: `${user.firstName} ${user.lastName}`,
        }))}
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
        {!user || !sanitizedPrayers || sanitizedPrayers.length === 0 ? (
          status !== 'loading' ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Prayers Yet</Text>
              <Text style={styles.emptyStateText}>
                This group doesn't have any prayers yet. Tap the + button below
                to add the first prayer to share with your group!
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
            onActionComplete={fetchData}
            context='groups'
            groupId={group.groupId}
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
  searchBarContainer: {
    backgroundColor: 'transparent',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  searchButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  text: {
    fontSize: ms(18),
    fontWeight: '600',
    color: '#333',
    marginTop: 18,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerTitle: {
    fontSize: ms(18),
    fontFamily: 'InstrumentSans-Bold',
    fontWeight: 'bold',
    color: '#000',
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
});
