import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchGroupUsers } from '@/store/groupUsersSlice';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import { RootState } from '@/store/store';

import { User } from '@/util/shared.types';
import { LinearGradient } from 'expo-linear-gradient';

function ms(size: number): number {
  const scale = 1.2;
  return Math.round(size * scale);
}

const CustomModalHeader = ({ title }: { title: string }) => (
  <View style={styles.customHeader}>
    <Text style={styles.customHeaderTitle}>{title}</Text>
  </View>
);

export default function UsersModal() {
  const dispatch = useAppDispatch();
  const route = useRoute<{
    key: string;
    name: string;
    params: { groupProfileId: number };
  }>();
  const navigation = useNavigation();

  const { users, status, error } = useAppSelector(
    (state: RootState) => state.groupUsers
  );
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList<User>>(null);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  // Adjust gradient start if it should begin from the very top (0)
  // const headerGradientEnd = headerHeight / screenHeight;
  const gradientStartPoint = 0; // Example: Start gradient from the top

  const fetchData = useCallback(() => {
    dispatch(fetchGroupUsers(route.params.groupProfileId));
  }, [dispatch, route.params.groupProfileId]);

  useFocusEffect(fetchData);

  const onRefresh = useCallback(async () => {
    if (refreshing || status === 'loading') return;
    setRefreshing(true);
    try {
      await dispatch(fetchGroupUsers(route.params.groupProfileId));
    } catch (err) {
      console.error('Failed to refresh users:', err);
    } finally {
      setRefreshing(false);
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [dispatch, refreshing, route.params.groupProfileId, status]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleClose = () => {
    navigation.goBack();
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItemContainer}>
      <Text style={styles.userNameText}>
        {item.firstName || 'Unknown'} {item.lastName || 'User'}
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: gradientStartPoint }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <CustomModalHeader title='Group Members' />
        <View style={styles.contentContainer}>
          {status === 'loading' && !refreshing && (
            <View style={styles.centeredMessageContainer}>
              <ActivityIndicator size='large' color='#007AFF' />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          )}

          {status === 'failed' && (
            <View style={styles.centeredMessageContainer}>
              <Text style={styles.errorText}>
                Error: {error || 'Could not load users.'}
              </Text>
              <Pressable onPress={fetchData} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {status === 'succeeded' && (!users || users.length === 0) && (
            <View style={styles.centeredMessageContainer}>
              <Text style={styles.emptyText}>
                No users found in this group.
              </Text>
            </View>
          )}

          {status === 'succeeded' && users && users.length > 0 && (
            <FlatList
              ref={flatListRef}
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.userProfileId.toString()}
              contentContainerStyle={styles.listContentContainer}
              refreshing={refreshing}
              onRefresh={onRefresh}
              style={styles.listStyle}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  customHeader: {
    height: ms(60), 
  },
  customHeaderTitle: {
    flex: 1, // Allow title to take available space if using space-between
    textAlign: 'left', // Center title between spacers/buttons
    fontSize: ms(18),
    fontFamily: 'InstrumentSans-Bold', // Ensure this font is loaded
    fontWeight: 'bold', // Fallback font weight
    color: '#000',
    padding: ms(24),
  },
  contentContainer: {
    flex: 1, // Takes remaining space below the header
  },
  listStyle: {
    flex: 1, // Ensure list takes available space in the container
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20, // Padding at the bottom of the scrollable content
  },
  userItemContainer: {
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#D9534F', // Error color
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
