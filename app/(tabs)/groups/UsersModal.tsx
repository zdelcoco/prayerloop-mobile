import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchGroupUsers } from '@/store/groupUsersSlice';
import { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import { RootState } from '@/store/store';

import { User } from '@/util/shared.types';
import { createGroupInvite } from '@/util/createGroupInvite';
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
    params: { groupProfileId: number; groupName?: string };
  }>();
  const navigation = useNavigation();

  const { users, status, error } = useAppSelector(
    (state: RootState) => state.groupUsers
  );
  const { token } = useAppSelector((state: RootState) => state.auth);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const flatListRef = useRef<FlatList<User>>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedGroupRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  // Adjust gradient start if it should begin from the very top (0)
  // const headerGradientEnd = headerHeight / screenHeight;
  const gradientStartPoint = 0; // Example: Start gradient from the top

  const fetchData = useCallback(() => {
    const groupId = route.params.groupProfileId;
    
    // Prevent duplicate fetches using refs (no status dependency needed)
    if (isFetchingRef.current || lastFetchedGroupRef.current === groupId) {
      return;
    }
    
    isFetchingRef.current = true;
    lastFetchedGroupRef.current = groupId;
    setLoadingTimeout(false);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a timeout to detect stuck loading states
    timeoutRef.current = setTimeout(() => {
      setLoadingTimeout(true);
      isFetchingRef.current = false;
    }, 15000); // 15 second timeout
    
    dispatch(fetchGroupUsers(groupId));
  }, [dispatch, route.params.groupProfileId]);

  // Reset fetch state when group changes
  useEffect(() => {
    const groupId = route.params.groupProfileId;
    if (lastFetchedGroupRef.current !== groupId) {
      isFetchingRef.current = false;
      lastFetchedGroupRef.current = null;
    }
  }, [route.params.groupProfileId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Cleanup timeout on success/failure
  useEffect(() => {
    // Clear timeout and fetching flag when loading completes
    if (status === 'succeeded' || status === 'failed') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoadingTimeout(false);
      isFetchingRef.current = false;
    }
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);


  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleClose = useCallback(() => {
    try {
      navigation.goBack();
    } catch (error) {
      // Force navigation even if there's an error
      navigation.goBack();
    }
  }, [navigation]);

  const handleInviteToGroup = useCallback(async () => {
    if (!token || inviteLoading) return;
    
    setInviteLoading(true);
    
    try {
      const result = await createGroupInvite(token, route.params.groupProfileId);
      
      if (result.success && result.data?.inviteCode) {
        const groupName = route.params.groupName || 'this group';
        const inviteMessage = `You're invited to join "${groupName}" on PrayerLoop! Use invite code: ${result.data.inviteCode}`;
        
        try {
          await Share.share({
            message: inviteMessage,
            title: 'PrayerLoop Group Invite'
          });
        } catch (shareError) {
          console.error('Share error:', shareError);
          // If sharing fails, show the code in an alert
          Alert.alert(
            'Invite Code Generated',
            `Invite code: ${result.data.inviteCode}\n\nShare this code with someone to invite them to ${groupName}`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to generate invite code',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Invite error:', error);
      Alert.alert(
        'Error',
        'Failed to generate invite code. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setInviteLoading(false);
    }
  }, [token, route.params.groupProfileId, route.params.groupName, inviteLoading]);

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
          {status === 'loading' && !loadingTimeout && (
            <View style={styles.centeredMessageContainer}>
              <ActivityIndicator size='large' color='#007AFF' />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          )}

          {(status === 'loading' && loadingTimeout) && (
            <View style={styles.centeredMessageContainer}>
              <Text style={styles.errorText}>
                Loading is taking longer than expected. The request may have timed out.
              </Text>
              <Pressable onPress={fetchData} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
              <Pressable onPress={handleClose} style={[styles.retryButton, { backgroundColor: '#6c757d', marginTop: 10 }]}>
                <Text style={styles.retryButtonText}>Close Modal</Text>
              </Pressable>
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
              style={styles.listStyle}
            />
          )}
        </View>
        
        {/* Invite to Group Button */}
        <TouchableOpacity
          style={styles.inviteButtonContainer}
          onPress={handleInviteToGroup}
          disabled={inviteLoading}
        >
          <Text style={styles.inviteButtonText}>
            {inviteLoading ? 'Generating Invite...' : 'Invite to Group'}
          </Text>
        </TouchableOpacity>
        
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButtonContainer}
          onPress={handleClose}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
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
  inviteButtonContainer: {
    backgroundColor: '#007AFF',
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
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
  closeButtonContainer: {
    backgroundColor: '#008000',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
});
