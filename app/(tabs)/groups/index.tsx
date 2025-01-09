import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const { user, isAuthenticated } = useAppSelector(
    (state: RootState) => state.auth
  );

  const [loading, setLoading] = useState(false);

  const [loadingModalVisible, setLoadingModalVisible] = useState(
    status === 'loading' || loading
  );

  const toggleLoadingModal = () => setLoadingModalVisible(!loadingModalVisible);

  const fetchData = useCallback(() => {
    dispatch(clearGroupPrayers());
    dispatch(fetchUserGroups());
  }, [route, navigation]);

  useFocusEffect(fetchData);

  const onAddPressHandler = () => {
    console.log('Add group pressed');
    router.push({ pathname: '/groups/GroupModal' });
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
    const group = groups!.find((g) => g.groupId === groupId);

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
          data={groups}
          keyExtractor={(item) => item.groupId.toString()}
          renderItem={({ item }) => (
            <GroupCard
              title={item.groupName}
              description={item.groupDescription}
              members={'render group members here'}
              onPress={() => onPressHandler(item.groupId)}
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
