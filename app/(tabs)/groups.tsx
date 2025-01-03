import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, FlatList } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { fetchUserGroups } from '@/store/groupsSlice';

import type { Group } from '@/util/getUserGroups.types';

import GroupCard from '@/components/Groups/GroupCard';
import LoadingModal from '@/components/ui/LoadingModal';

export default function Groups() {
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList<Group>>(null);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const dispatch = useAppDispatch();
  const { groups, status, error } = useAppSelector(
    (state: RootState) => state.userGroups
  );
  const { user, isAuthenticated } = useAppSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated && status === 'idle') {
      dispatch(fetchUserGroups());
    }
  }, [dispatch, user, isAuthenticated, status]);

  const onRefresh = async () => {
    if (refreshing) return; // Prevent duplicate refresh triggers
    setRefreshing(true);
    try {
      await dispatch(fetchUserGroups());
    } catch (error) {
      console.error("Failed to refresh groups:", error);
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
      <LoadingModal visible={status === 'loading' || statusOverride} message="Loading groups..." />
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        <FlatList
          ref={flatListRef}
          data={groups}
          keyExtractor={(item) => item.groupId.toString()} // Adjusted to use `groupId` if available
          renderItem={({ item }) => (
            <GroupCard
              title={item.groupName}
              description={item.groupDescription}
              members={'render group members here'}
              onPress={() => console.log(`Pressed: ${item.groupName}`)}
            />
          )}
          initialNumToRender={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshing={refreshing}
          onRefresh={onRefresh}
          progressViewOffset={50}
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
  text: {
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
  },
});
