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
import { FontAwesome } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchGroupUsers } from '@/store/groupUsersSlice';
import { removeUserFromGroup, fetchUserGroups, deleteGroupById } from '@/store/groupsSlice';
import { router } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import { RootState } from '@/store/store';

import { User } from '@/util/shared.types';
import { createGroupInvite } from '@/util/createGroupInvite';
import { generateGroupInviteLink } from '@/util/deepLinks';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';

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
    params: { groupProfileId: number; groupName?: string; groupCreatorId?: string };
  }>();
  const navigation = useNavigation();

  const { users, status, error } = useAppSelector(
    (state: RootState) => state.groupUsers
  );
  const { token, user } = useAppSelector((state: RootState) => state.auth);

  // Determine if current user is the group creator
  const groupCreatorId = route.params.groupCreatorId
    ? parseInt(route.params.groupCreatorId, 10)
    : undefined;
  const isCreator = user && groupCreatorId && user.userProfileId === groupCreatorId;
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [leaveGroupLoading, setLeaveGroupLoading] = useState(false);
  const [deleteGroupLoading, setDeleteGroupLoading] = useState(false);
  const flatListRef = useRef<FlatList<User>>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedGroupRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);
  const isDeletingRef = useRef(false);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  // Adjust gradient start if it should begin from the very top (0)
  // const headerGradientEnd = headerHeight / screenHeight;
  const gradientStartPoint = 0; // Example: Start gradient from the top

  const fetchData = useCallback(() => {
    const groupId = route.params.groupProfileId;

    // Don't fetch if we're in the process of deleting or leaving the group
    if (isDeletingRef.current) {
      return;
    }

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
      const result = await createGroupInvite(
        token,
        route.params.groupProfileId
      );

      if (result.success && result.data?.inviteCode) {
        const groupName = route.params.groupName || 'this group';
        const deepLink = generateGroupInviteLink(result.data.inviteCode);
        const inviteMessage = `You're invited to join "${groupName}" on PrayerLoop!\n\nTap this link to join:\n${deepLink}\n\nOr enter this code manually:\n${result.data.inviteCode}`;

        try {
          await Share.share({
            message: inviteMessage,
            title: 'PrayerLoop Group Invite',
          });
        } catch (shareError) {
          console.error('Share error:', shareError);
          // If sharing fails, show the code in an alert
          Alert.alert(
            'Invite Generated',
            `Deep link:\n${deepLink}\n\nInvite code: ${result.data.inviteCode}\n\nShare either with someone to invite them to ${groupName}`,
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
  }, [
    token,
    route.params.groupProfileId,
    route.params.groupName,
    inviteLoading,
  ]);

  const handleLeaveGroup = useCallback(() => {
    const groupName = route.params.groupName || 'this group';

    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${groupName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeaveGroupLoading(true);
            isDeletingRef.current = true; // Prevent any further data fetches
            try {
              const result: any = await dispatch(
                removeUserFromGroup(route.params.groupProfileId)
              );

              if (result?.success) {
                // First close this modal
                navigation.goBack();

                // Then navigate back from the group detail screen to groups list
                // Use a timeout to ensure the modal is closed first
                setTimeout(() => {
                  navigation.goBack();

                  // Refresh the groups list
                  dispatch(fetchUserGroups());

                  // Show success message
                  Alert.alert(
                    'Success',
                    `You have left "${groupName}"`,
                    [{ text: 'OK' }]
                  );
                }, 100);
              } else {
                isDeletingRef.current = false; // Reset flag if leave failed
                Alert.alert(
                  'Error',
                  result?.error || 'Failed to leave group. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              isDeletingRef.current = false; // Reset flag on error
              console.error('Leave group error:', error);
              Alert.alert(
                'Error',
                'Failed to leave group. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setLeaveGroupLoading(false);
            }
          },
        },
      ]
    );
  }, [dispatch, route.params.groupProfileId, route.params.groupName, navigation]);

  const handleDeleteGroup = useCallback(() => {
    const groupName = route.params.groupName || 'this group';

    Alert.alert(
      'Delete Group',
      `This will permanently delete "${groupName}" and all its prayers. This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteGroupLoading(true);
            isDeletingRef.current = true; // Prevent any further data fetches
            try {
              const result: any = await dispatch(
                deleteGroupById(route.params.groupProfileId)
              );

              if (result?.success) {
                // Use CommonActions to reset navigation stack and go directly to groups list
                // This prevents the GroupPrayers screen from trying to fetch deleted group data
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'index' }],
                  })
                );

                // Refresh the groups list and show success message
                setTimeout(() => {
                  dispatch(fetchUserGroups());

                  Alert.alert(
                    'Success',
                    `"${groupName}" has been deleted`,
                    [{ text: 'OK' }]
                  );
                }, 100);
              } else {
                isDeletingRef.current = false; // Reset flag if delete failed
                Alert.alert(
                  'Error',
                  result?.error || 'Failed to delete group. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              isDeletingRef.current = false; // Reset flag on error
              console.error('Delete group error:', error);
              Alert.alert(
                'Error',
                'Failed to delete group. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setDeleteGroupLoading(false);
            }
          },
        },
      ]
    );
  }, [dispatch, route.params.groupProfileId, route.params.groupName, navigation]);

  const handleRemoveUser = useCallback((userId: number, userName: string) => {
    Alert.alert(
      'Remove User',
      `Do you want to remove ${userName} from this group?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              `${userName} will be removed from "${route.params.groupName || 'this group'}" and will no longer have access to its prayers.`,
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: async () => {
                    if (!token) return;

                    try {
                      const result: any = await dispatch(
                        removeUserFromGroup(route.params.groupProfileId, userId)
                      );

                      if (result?.success) {
                        // Refresh the user list
                        dispatch(fetchGroupUsers(route.params.groupProfileId));

                        Alert.alert(
                          'Success',
                          `${userName} has been removed from the group`,
                          [{ text: 'OK' }]
                        );
                      } else {
                        Alert.alert(
                          'Error',
                          result?.error || 'Failed to remove user. Please try again.',
                          [{ text: 'OK' }]
                        );
                      }
                    } catch (error) {
                      console.error('Remove user error:', error);
                      Alert.alert(
                        'Error',
                        'Failed to remove user. Please try again.',
                        [{ text: 'OK' }]
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [dispatch, token, route.params.groupProfileId, route.params.groupName]);

  const renderUserItem = ({ item }: { item: User }) => {
    const isUserGroupCreator = groupCreatorId && item.userProfileId === groupCreatorId;
    const canRemoveUser = isCreator && !isUserGroupCreator; // Can't remove the creator themselves

    const userItem = (
      <View style={styles.userItemContainer}>
        <Text style={styles.userNameText}>
          {item.firstName || 'Unknown'} {item.lastName || 'User'}
        </Text>
        {isUserGroupCreator && (
          <FontAwesome name="star" size={16} color="#FFD700" style={styles.crownIcon} />
        )}
      </View>
    );

    if (canRemoveUser) {
      return (
        <Pressable
          onLongPress={() => handleRemoveUser(item.userProfileId, `${item.firstName} ${item.lastName}`)}
          delayLongPress={500}
        >
          {userItem}
        </Pressable>
      );
    }

    return userItem;
  };

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: gradientStartPoint }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <CustomModalHeader title='Manage Group' />
        <View style={styles.contentContainer}>
          {status === 'loading' && !loadingTimeout && (
            <View style={styles.centeredMessageContainer}>
              <ActivityIndicator size='large' color='#007AFF' />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          )}

          {status === 'loading' && loadingTimeout && (
            <View style={styles.centeredMessageContainer}>
              <Text style={styles.errorText}>
                Loading is taking longer than expected. The request may have
                timed out.
              </Text>
              <Pressable onPress={fetchData} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
              <Pressable
                onPress={handleClose}
                style={[
                  styles.retryButton,
                  { backgroundColor: '#6c757d', marginTop: 10 },
                ]}
              >
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

        {/* Leave/Delete Group Button - Show Delete for creator, Leave for others */}
        {isCreator ? (
          <TouchableOpacity
            style={styles.deleteGroupButtonContainer}
            onPress={handleDeleteGroup}
            disabled={deleteGroupLoading}
          >
            <Text style={styles.deleteGroupButtonText}>
              {deleteGroupLoading ? 'Deleting Group...' : 'Delete Group'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.leaveGroupButtonContainer}
            onPress={handleLeaveGroup}
            disabled={leaveGroupLoading}
          >
            <Text style={styles.leaveGroupButtonText}>
              {leaveGroupLoading ? 'Leaving Group...' : 'Leave Group'}
            </Text>
          </TouchableOpacity>
        )}

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
  centeredMessageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  closeButtonContainer: {
    backgroundColor: '#008000',
    borderRadius: 10,
    elevation: 3,
    marginBottom: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1, // Takes remaining space below the header
  },
  crownIcon: {
    marginLeft: 8,
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
  deleteGroupButtonContainer: {
    backgroundColor: '#D9534F',
    borderRadius: 10,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deleteGroupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#D9534F', // Error color
    textAlign: 'center',
    marginBottom: 15,
  },
  inviteButtonContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inviteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  leaveGroupButtonContainer: {
    backgroundColor: '#D9534F',
    borderRadius: 10,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leaveGroupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 10, // Padding at the bottom of the scrollable content
  },
  listStyle: {
    flex: 1, // Ensure list takes available space in the container
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    marginTop: 10,
    paddingHorizontal: 25,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  safeArea: {
    flex: 1,
  },
  userItemContainer: {
    alignItems: 'center',
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
