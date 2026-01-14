import React, { useState, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect, useNavigation, router } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import ProfileButtonWithBadge from '@/components/ui/ProfileButtonWithBadge';
import HeaderTitleActionDropdown, { ActionOption } from '@/components/ui/HeaderTitleActionDropdown';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserGroups, reorderGroups } from '@/store/groupsSlice';
import { RootState } from '@/store/store';
import { clearGroupPrayers } from '@/store/groupPrayersSlice';
import { selectPrayerSubjects } from '@/store/prayerSubjectsSlice';

import LoadingModal from '@/components/ui/LoadingModal';
import PrayerSessionModal from '@/components/PrayerSession/PrayerSessionModal';
import PrayerSourceSelectionModal from '@/components/PrayerSession/PrayerSourceSelectionModal';
import { PrayerCircleCardList } from '@/components/Groups';

import type { Group, User, Prayer } from '@/util/shared.types';
import { groupUsersCache } from '@/util/groupUsersCache';
import { useEffect, useRef } from 'react';

type RootStackParamList = {
  CircleDetail: { group: string };
  PrayerModal: { mode: string };
};

const CIRCLE_ACTION_OPTIONS: ActionOption[] = [
  { value: 'create', label: 'Create Prayer Circle', icon: 'add-outline' },
  { value: 'join', label: 'Join Prayer Circle', icon: 'enter-outline' },
];

export default function Groups() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const { groups, status } = useAppSelector((state: RootState) => state.userGroups);
  const { user, token } = useAppSelector((state: RootState) => state.auth);
  const prayerSubjects = useAppSelector(selectPrayerSubjects);
  const unreadCount = useAppSelector((state: RootState) => state.notifications.unreadCount);

  // Create a lookup map for custom display names from contact cards
  // Maps linked userProfileId -> user's custom display name
  const displayNamesLookup = useMemo(() => {
    const lookup: { [userProfileId: number]: string } = {};
    if (prayerSubjects) {
      prayerSubjects.forEach(subject => {
        // Only include linked subjects (where userProfileId is set)
        if (subject.userProfileId && subject.linkStatus === 'linked') {
          lookup[subject.userProfileId] = subject.prayerSubjectDisplayName;
        }
      });
    }
    return lookup;
  }, [prayerSubjects]);

  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState<{ [groupId: number]: User[] }>({});
  const [sourceSelectionVisible, setSourceSelectionVisible] = useState(false);
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);
  const [sessionPrayers, setSessionPrayers] = useState<Prayer[]>([]);
  const [sessionContextTitle, setSessionContextTitle] = useState('Prayer Session');
  const previousGroupsRef = useRef<Group[] | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const fetchGroupMembers = useCallback(async (groupId: number) => {
    if (!token) return;

    try {
      const users = await groupUsersCache.fetchGroupUsers(token, groupId);
      if (users.length > 0) {
        setGroupMembers(prev => ({
          ...prev,
          [groupId]: users
        }));
      }
    } catch (error) {
      console.error('Failed to fetch group members:', error);
    }
  }, [token]);

  const handleCircleAction = useCallback((value: string) => {
    if (value === 'create') {
      router.push('/groups/GroupModal');
    } else if (value === 'join') {
      router.push('/groups/JoinGroupModal');
    }
  }, []);

  const fetchData = useCallback(() => {
    // Debounce fetches to prevent duplicate calls within 500ms
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 500) {
      return;
    }
    lastFetchTimeRef.current = now;

    dispatch(clearGroupPrayers());
    dispatch(fetchUserGroups());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Register tab bar add button handler when this screen is focused
  // Tab bar + always adds a prayer (no group context from the groups list)
  useFocusEffect(
    useCallback(() => {
      global.tabBarAddVisible = true;
      global.tabBarAddHandler = () => {
        navigation.navigate('PrayerModal', { mode: 'add' });
      };
      return () => {
        // Cleanup when screen loses focus
        global.tabBarAddHandler = null;
      };
    }, [navigation])
  );

  // Restore header when this screen gains focus
  useFocusEffect(
    useCallback(() => {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: () => (
            <HeaderTitleActionDropdown
              title="Prayer Circles"
              options={CIRCLE_ACTION_OPTIONS}
              onSelect={handleCircleAction}
            />
          ),
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <ProfileButtonWithBadge
                firstName={user?.firstName || ''}
                lastName={user?.lastName || ''}
                onPress={() => router.navigate('/userProfile')}
              />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <Pressable
                onPress={() => setSearchVisible((prev) => !prev)}
                style={({ pressed }) => [
                  styles.headerButton,
                  (pressed || searchVisible) && styles.headerButtonPressed,
                  searchVisible && styles.headerButtonActive,
                ]}
              >
                <Ionicons name='search' size={18} color={searchVisible ? '#FFFFFF' : '#2d3e31'} />
              </Pressable>
            </View>
          ),
        });
      }
    }, [navigation, user, handleCircleAction, searchVisible, unreadCount])
  );

  // Expose functions to global for tab layout to access
  useLayoutEffect(() => {
    (global as any).groupsToggleSearch = () => setSearchVisible((prev) => !prev);
    (global as any).groupsSetPrayerSessionVisible = setSourceSelectionVisible;
    return () => {
      (global as any).groupsToggleSearch = null;
      (global as any).groupsSetPrayerSessionVisible = null;
    };
  }, []);

  // Handle starting session from source selection
  const handleStartSession = (prayers: Prayer[], contextTitle: string) => {
    setSessionPrayers(prayers);
    setSessionContextTitle(contextTitle);
    setPrayerSessionVisible(true);
  };

  useEffect(() => {
    if (groups && Array.isArray(groups) && token) {
      // Create a stable string representation of group IDs for comparison
      const groupIds = groups.map(g => g.groupId).sort().join(',');
      const prevGroupIds = previousGroupsRef.current?.map(g => g.groupId).sort().join(',');

      const groupsChanged = groupIds !== prevGroupIds;

      if (groupsChanged) {
        previousGroupsRef.current = groups;
        groups.forEach(group => {
          fetchGroupMembers(group.groupId);
        });
      }
    }
  }, [groups, token, fetchGroupMembers]);

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      // Clear cache to allow re-fetching
      groupUsersCache.clear();
      setGroupMembers({});
      await dispatch(fetchUserGroups());
    } catch (error) {
      console.error('Failed to refresh groups:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGroupPress = (group: Group) => {
    router.push({
      pathname: '/groups/CircleDetail',
      params: { group: JSON.stringify(group) },
    });
  };

  const handleGroupLongPress = (group: Group) => {
    // TODO: Show action sheet for edit/delete
    console.log('Group long pressed:', group.groupName);
  };

  const handleReorder = useCallback((data: Group[]) => {
    dispatch(reorderGroups(data));
  }, [dispatch]);

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <LoadingModal
        visible={status === 'loading'}
        message='Loading prayer circles...'
        onClose={() => {}}
      />
      <PrayerSourceSelectionModal
        visible={sourceSelectionVisible}
        onClose={() => setSourceSelectionVisible(false)}
        onStartSession={handleStartSession}
      />
      <PrayerSessionModal
        visible={prayerSessionVisible}
        prayers={sessionPrayers}
        currentUserId={user?.userProfileId || 0}
        onClose={() => {
          setPrayerSessionVisible(false);
          setSessionPrayers([]);
        }}
        contextTitle={sessionContextTitle}
      />
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        {/* Prayer Circle List */}
        <PrayerCircleCardList
          groups={groups || []}
          groupMembers={groupMembers}
          displayNamesLookup={displayNamesLookup}
          onGroupPress={handleGroupPress}
          onGroupLongPress={handleGroupLongPress}
          onRefresh={onRefresh}
          refreshing={refreshing}
          searchVisible={searchVisible}
          emptyMessage="No prayer circles yet. Tap the title above to create or join a prayer circle!"
          enableReorder={true}
          onReorder={handleReorder}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: '#ccf0ccff',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 36,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  headerButtonActive: {
    backgroundColor: '#2E7D32',
  },
  headerLeftContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
    marginRight: 16,
  },
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 16,
  },
});
