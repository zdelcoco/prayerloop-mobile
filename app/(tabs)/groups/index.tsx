import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, View, StyleSheet, FlatList } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { fetchUserGroups } from '@/store/groupsSlice';

import type { Group, User } from '@/util/shared.types';
import { getGroupUsers } from '@/util/getGroupUsers';
import { formatGroupMembersString } from '@/util/formatGroupMembers';

import GroupCard from '@/components/Groups/GroupCard';
import LoadingModal from '@/components/ui/LoadingModal';
import { router, useFocusEffect } from 'expo-router';
import { clearGroupPrayers } from '@/store/groupPrayersSlice';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AddButton from '@/components/ui/AddButton';

type GroupPrayersRouteParams = {
  group: string; // Serialized group
};

export default function Groups() {
  const navigation = useNavigation();
  const route =
    useRoute<
      RouteProp<{ GroupPrayers: GroupPrayersRouteParams }, 'GroupPrayers'>
    >();
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList<Group>>(null);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const dispatch = useAppDispatch();
  const { groups, status, error } = useAppSelector(
    (state: RootState) => state.userGroups
  );
  const { user, isAuthenticated, token } = useAppSelector(
    (state: RootState) => state.auth
  );

  const [loading, setLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<{ [groupId: number]: User[] }>({});

  const [loadingModalVisible, setLoadingModalVisible] = useState(
    status === 'loading' || loading
  );

  const toggleLoadingModal = () => setLoadingModalVisible(!loadingModalVisible);

  const fetchGroupMembers = useCallback(async (groupId: number) => {
    if (!token || groupMembers[groupId]) return;
    
    try {
      const result = await getGroupUsers(token, groupId);
      if (result.success && result.data) {
        setGroupMembers(prev => ({
          ...prev,
          [groupId]: result.data as User[]
        }));
      }
    } catch (error) {
      console.error('Failed to fetch group members:', error);
    }
  }, [token, groupMembers]);

  const fetchData = useCallback(() => {
    dispatch(clearGroupPrayers());
    dispatch(fetchUserGroups());
  }, [route, navigation]);

  useFocusEffect(fetchData);

  useEffect(() => {
    if (groups && Array.isArray(groups) && token) {
      groups.forEach(group => {
        fetchGroupMembers(group.groupId);
      });
    }
  }, [groups, token, fetchGroupMembers]);

  const onAddPressHandler = () => {
    router.push({ pathname: '/groups/ActionSelection' });
  };

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await dispatch(fetchUserGroups());
    } catch (error) {
      console.error('Failed to refresh groups:', error);
    } finally {
      setRefreshing(false);
      // Use a timeout to ensure that scrollToOffset doesn't conflict with FlatList's internal logic
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100); // 100ms delay to avoid conflicts
    }
  };

  const onPressHandler = (groupId: number) => {
    if (!groups || !Array.isArray(groups)) return;
    
    const group = groups.find((g) => g.groupId === groupId);

    if (group) {
      router.push({
        pathname: '/groups/GroupPrayers',
        params: { group: JSON.stringify(group) }, // Serialize group object
      });
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
      <LoadingModal
        visible={status === 'loading' || statusOverride}
        message='Loading groups...'
        onClose={toggleLoadingModal}
      />
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        <FlatList
          ref={flatListRef}
          data={groups || []}
          keyExtractor={(item) => item.groupId.toString()}
          renderItem={({ item }) => {
            const members = groupMembers[item.groupId];
            const membersText = members ? formatGroupMembersString(members) : 'Loading members...';
            
            return (
              <GroupCard
                title={item.groupName}
                description={item.groupDescription}
                members={membersText}
                onPress={() => onPressHandler(item.groupId)}
              />
            );
          }}
          ListEmptyComponent={() => 
            status !== 'loading' ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
                <Text style={styles.emptyStateText}>
                  You haven't joined any groups yet. Create a new group or join an existing one to get started!
                </Text>
              </View>
            ) : null
          }
          initialNumToRender={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshing={refreshing}
          onRefresh={onRefresh}
          progressViewOffset={50}
        />
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
    justifyContent: 'center',
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
