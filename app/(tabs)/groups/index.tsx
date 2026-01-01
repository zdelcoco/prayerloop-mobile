import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  Text,
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
import ContextMenuButton from '@/components/ui/ContextMenuButton';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserGroups, reorderGroups } from '@/store/groupsSlice';
import { RootState } from '@/store/store';
import { clearGroupPrayers } from '@/store/groupPrayersSlice';

import LoadingModal from '@/components/ui/LoadingModal';
import { PrayerCircleCardList } from '@/components/Groups';

import type { Group, User } from '@/util/shared.types';
import { groupUsersCache } from '@/util/groupUsersCache';
import { useEffect, useRef } from 'react';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';

type RootStackParamList = {
  ActionSelection: undefined;
  CircleDetail: { group: string };
};

export default function Groups() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const { groups, status } = useAppSelector((state: RootState) => state.userGroups);
  const { token } = useAppSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState<{ [groupId: number]: User[] }>({});
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
  useFocusEffect(
    useCallback(() => {
      global.tabBarAddVisible = true;
      global.tabBarAddHandler = () => {
        router.push({ pathname: '/groups/ActionSelection' });
      };
      return () => {
        // Cleanup when screen loses focus
        global.tabBarAddHandler = null;
      };
    }, [])
  );

  // Restore header when this screen gains focus
  useFocusEffect(
    useCallback(() => {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: 'Prayer Circles',
          headerLeft: null,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <Pressable
                onPress={() => setSearchVisible((prev) => !prev)}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <Ionicons name='search' size={20} color='#2d3e31' />
              </Pressable>
              <ContextMenuButton
                type='groups'
                iconSize={20}
              />
            </View>
          ),
        });
      }
    }, [navigation])
  );

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
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        {/* Prayer Circle List */}
        <PrayerCircleCardList
          groups={groups || []}
          groupMembers={groupMembers}
          onGroupPress={handleGroupPress}
          onGroupLongPress={handleGroupLongPress}
          onRefresh={onRefresh}
          refreshing={refreshing}
          searchVisible={searchVisible}
          emptyMessage="No prayer circles yet. Tap + to create or join a prayer circle!"
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
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 50,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
});
