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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchGroupPrayers } from '@/store/groupPrayersSlice';
import { RootState } from '../../../store/store';
import ContextMenuButton from '@/components/ui/ContextMenuButton';

import { Group } from '@/util/shared.types';
import LoadingModal from '@/components/ui/LoadingModal';
import PrayerCards from '@/components/PrayerCards/PrayerCards';
import { Prayer } from '@/util/shared.types';
import AddButton from '@/components/ui/AddButton';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from 'expo-router';
import PrayerSessionModal from '@/components/PrayerSession/PrayerSessionModal';

type RootStackParamList = {
  GroupPrayers: { group: string }; // Serialized group as a string
  PrayerModal: { mode: string; groupProfileId: number; groupName: string };
  UsersModal: {};
};

type GroupPrayersNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GroupPrayers'
>;

export default function GroupPrayers() {
  const navigation = useNavigation<GroupPrayersNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'GroupPrayers'>>();

  // Deserialize the group parameter
  const group: Group = JSON.parse(route.params.group);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);
  const flatListRef = useRef<FlatList<Prayer>>(null);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const dispatch = useAppDispatch();
  const { prayers, status, error } = useAppSelector(
    (state: RootState) => state.groupPrayers
  );
  const { user, token } = useAppSelector((state: RootState) => state.auth);

  const [loadingModalVisible, setLoadingModalVisible] = useState(
    status === 'loading' || loading
  );

  const toggleLoadingModal = () => setLoadingModalVisible(!loadingModalVisible);

  useLayoutEffect(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.setOptions({
        headerTitle: `${group.groupName}`,
        headerLeft: () => (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name='angle-left' size={28} color='#000' />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <ContextMenuButton 
            type="groupDetail" 
            groupId={group.groupId} 
            groupName={group.groupName}
            prayerCount={sanitizedPrayers?.length || 0}
            iconSize={24} 
          />
        ),
      });
    }

    return () => {
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: 'Groups',
          headerLeft: null,
          headerRight: () => (
            <ContextMenuButton type="groups" iconSize={24} />
          ),
        });
      }
    };
  }, [navigation, group, dispatch, prayers]);

  const fetchData = useCallback(() => {
    dispatch(fetchGroupPrayers(group.groupId));
  }, [dispatch, group.groupId]);

  useFocusEffect(fetchData);

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
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        {error && <Text style={styles.text}>Error: {error}</Text>}
        {!user || !sanitizedPrayers || sanitizedPrayers.length === 0 ? (
          status !== 'loading' ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Prayers Yet</Text>
              <Text style={styles.emptyStateText}>
                This group doesn't have any prayers yet. Tap the + button below to add the first prayer to share with your group!
              </Text>
            </View>
          ) : null
        ) : (
          <PrayerCards
            userId={user!.userProfileId}
            token={token ?? ''}
            prayers={sanitizedPrayers}
            refreshing={refreshing}
            onRefresh={onRefresh}
            flatListRef={flatListRef}
            onActionComplete={fetchData}
            context="groups"
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 18,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
