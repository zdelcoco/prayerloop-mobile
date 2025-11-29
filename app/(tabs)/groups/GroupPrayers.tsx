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
              <Ionicons name="search" size={20} color="#2d3e31" />
            </Pressable>
            <ContextMenuButton
              type='groupDetail'
              groupId={group.groupId}
              groupName={group.groupName}
              groupCreatorId={group.createdBy}
              prayerCount={sanitizedPrayers?.length || 0}
              iconSize={20}
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
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <ContextMenuButton type='groups' iconSize={20} />
            </View>
          ),
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

  // Register tab bar add button handler when this screen is focused
  useFocusEffect(
    useCallback(() => {
      global.tabBarAddVisible = true;
      global.tabBarAddHandler = () => {
        navigation.navigate('PrayerModal', {
          mode: 'add',
          groupProfileId: group.groupId,
          groupName: group.groupName,
        });
      };
      return () => {
        // Cleanup when screen loses focus
        global.tabBarAddHandler = null;
      };
    }, [navigation, group.groupId, group.groupName])
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

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
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
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: '#000',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: ms(18),
    fontWeight: 'bold',
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
  },
  searchButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#2d3e31',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  searchButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)', // Muted green with transparency
  },
  text: {
    color: '#333',
    fontSize: ms(18),
    fontWeight: '600',
    marginTop: 18,
    textAlign: 'center',
  },
});
