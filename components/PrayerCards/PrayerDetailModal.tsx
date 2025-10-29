import { Prayer, Group, User } from '@/util/shared.types';
import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Card from './PrayerCard';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { removePrayerAccess } from '@/util/removePrayerAccess';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserPrayers } from '@/store/userPrayersSlice';
import { fetchUserGroups } from '@/store/groupsSlice';
import { addPrayerAccess } from '@/util/addPrayerAccess';
import { RootState } from '@/store/store';

type RootStackParamList = {
  PrayerModal: { mode: string; prayer: Prayer };
};

interface PrayerDetailModalProps {
  visible: boolean;
  userId: number;
  userToken: string;
  prayer: Prayer;
  onClose: () => void;
  onActionComplete: () => void;
  onShare: () => void;
  usersLookup?: { [userProfileId: number]: User };
  context?: 'cards' | 'groups'; // Add context to distinguish between Cards and Groups tabs
}

const PrayerDetailModal: React.FC<PrayerDetailModalProps> = ({
  visible,
  userId,
  userToken,
  prayer,
  onClose,
  onActionComplete,
  onShare,
  usersLookup,
  context = 'cards', // Default to 'cards' for backward compatibility
}) => {
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState<'detail' | 'share' | 'groupSelection'>('detail');
  const [sharing, setSharing] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { groups, status: groupsStatus } = useAppSelector((state: RootState) => state.userGroups);

  const canEditAndDelete = () => userId === prayer.createdBy;
  const canShare = () => !prayer.isPrivate;

  // Fetch user's groups when modal opens
  useEffect(() => {
    if (visible && (!groups || groups.length === 0)) {
      dispatch(fetchUserGroups());
    }
  }, [visible, groups, dispatch]);

  // Reset modal mode when closed
  useEffect(() => {
    if (!visible) {
      setModalMode('detail');
    }
  }, [visible]);

  const onEditHandler = () => {
    onClose();
    navigation.navigate('PrayerModal', { mode: 'edit', prayer });
  };

  const onDeleteHandler = async () => {
    // Show different confirmation alerts based on context
    const isCardsTab = context === 'cards';
    const confirmationTitle = 'Delete Prayer';
    const confirmationMessage = isCardsTab
      ? 'This will permanently delete the prayer from everywhere it has been shared. This action cannot be undone.\n\nAre you sure you want to continue?'
      : 'This will remove the prayer from this group only. If you shared this prayer from your personal prayers, it will remain in your personal prayer cards.\n\nAre you sure you want to continue?';

    Alert.alert(
      confirmationTitle,
      confirmationMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting prayer:', prayer);
              setLoading(true);
              const result = await removePrayerAccess(
                userToken,
                prayer.prayerId,
                prayer.prayerAccessId
              );
              if (result.success) {
                onActionComplete();
                const successMessage = isCardsTab
                  ? 'Prayer deleted successfully from everywhere.'
                  : 'Prayer removed from group successfully.';
                Alert.alert('Success', successMessage);
              } else {
                Alert.alert(
                  'Error',
                  result.error?.message || 'Failed to delete prayer.'
                );
              }
            } catch (error) {
              console.error('Error deleting prayer:', error);
              Alert.alert('Error', 'An unknown error occurred.\n');
              setLoading(false);
              onClose();
            } finally {
              setLoading(false);
              onClose();
            }
          }
        }
      ]
    );
  };

  const handleShareWithGroup = useCallback(async (group: Group) => {
    setSharing(true);
    try {
      const result = await addPrayerAccess(
        userToken,
        prayer.prayerId,
        'group',
        group.groupId
      );

      if (result.success) {
        Alert.alert(
          'Success!',
          `Prayer has been shared with "${group.groupName}"`,
          [{ 
            text: 'OK', 
            onPress: () => {
              onActionComplete();
              onClose();
            }
          }]
        );
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to share prayer with group'
        );
      }
    } catch (error) {
      console.error('Error sharing prayer with group:', error);
      Alert.alert('Error', 'Failed to share prayer. Please try again.');
    } finally {
      setSharing(false);
    }
  }, [userToken, prayer.prayerId, onActionComplete, onClose]);

  const handleNativeShare = useCallback(async () => {
    try {
      const shareMessage = `Prayer Request: ${prayer.title}\n\n${prayer.prayerDescription}`;
      
      await Share.share({
        message: shareMessage,
        title: 'Prayer Request',
      });
    } catch (error) {
      console.error('Native share error:', error);
      Alert.alert('Error', 'Failed to share prayer');
    }
  }, [prayer]);

  const onShareHandler = () => {
    console.log('PrayerDetailModal: Share button pressed');
    setModalMode('share');
  };

  const renderDetailView = () => {
    const screenHeight = Dimensions.get('window').height;
    const maxContentHeight = screenHeight * 0.6;
    const buttonRowHeight = 60;
    const scrollViewMaxHeight = maxContentHeight - buttonRowHeight;

    return (
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={[styles.detailContainer, { maxHeight: maxContentHeight }]}>
          <ScrollView
            style={[styles.scrollableContent, { maxHeight: scrollViewMaxHeight }]}
            contentContainerStyle={styles.scrollableContentContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.cardWrapper}>
              <Card prayer={prayer} style={styles.cardStyle} currentUserId={userId} usersLookup={usersLookup} isDetailView={true}>
                <Text style={styles.text}>{prayer.prayerDescription}</Text>
              </Card>
            </View>
          </ScrollView>
          <View style={styles.buttonRow}>
            {canShare() && (
              <Pressable
                style={[styles.button, styles.shareButton]}
                onPress={onShareHandler}
              >
                <Text style={styles.buttonText}>Share</Text>
              </Pressable>
            )}
            {canEditAndDelete() ? (
              <>
                <Pressable
                  style={styles.button}
                  onPress={() => {
                    onEditHandler();
                  }}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => {
                    onDeleteHandler();
                  }}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </Pressable>
              </>
            ) : (
              <>
                {!canShare() && <View style={styles.spacer} />}
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderShareView = () => (
    <TouchableOpacity style={styles.overlay} onPress={() => setModalMode('detail')} activeOpacity={1}>
      <TouchableOpacity style={styles.shareModalContainer} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.shareTitle}>Share Prayer</Text>
        <Text style={styles.shareSubtitle}>How would you like to share this prayer?</Text>
        
        <View style={styles.shareOptionsContainer}>
          <Pressable
            style={[
              styles.shareOptionButton,
              (!groups || !Array.isArray(groups) || groups.length === 0) && styles.disabledOptionButton
            ]}
            onPress={() => {
              if (groups && Array.isArray(groups) && groups.length > 0) {
                setModalMode('groupSelection');
              }
            }}
            disabled={!groups || !Array.isArray(groups) || groups.length === 0}
          >
            <View style={styles.shareOptionHeader}>
              <Text style={[
                styles.shareOptionTitle,
                (!groups || !Array.isArray(groups) || groups.length === 0) && styles.disabledOptionText
              ]}>
                Share with Group
              </Text>
              {(!groups || !Array.isArray(groups) || groups.length === 0) && (
                <View style={styles.disabledIndicator}>
                  <FontAwesome name="lock" size={16} color="#999" />
                </View>
              )}
            </View>
            <Text style={[
              styles.shareOptionDescription,
              (!groups || !Array.isArray(groups) || groups.length === 0) && styles.disabledOptionText
            ]}>
              {(!groups || !Array.isArray(groups) || groups.length === 0)
                ? "You need to join a group first to share prayers with groups"
                : "Share privately with members of your prayer groups"
              }
            </Text>
            {(!groups || !Array.isArray(groups) || groups.length === 0) && (
              <View style={styles.disabledBanner}>
                <FontAwesome name="info-circle" size={14} color="#666" />
                <Text style={styles.disabledBannerText}>
                  Not available - Join a group to enable this feature
                </Text>
              </View>
            )}
          </Pressable>
          
          <Pressable
            style={styles.shareOptionButton}
            onPress={handleNativeShare}
          >
            <Text style={styles.shareOptionTitle}>Share Externally</Text>
            <Text style={styles.shareOptionDescription}>
              Share via text, email, or other apps
            </Text>
          </Pressable>
        </View>
        
        <View style={styles.shareButtonRow}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={() => setModalMode('detail')}
          >
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderGroupSelectionView = () => (
    <TouchableOpacity style={styles.overlay} onPress={() => setModalMode('share')} activeOpacity={1}>
      <TouchableOpacity style={styles.shareModalContainer} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.shareTitle}>Share with Group</Text>
        <Text style={styles.shareSubtitle}>Select a group to share this prayer with:</Text>
        
        {groupsStatus === 'loading' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008000" />
            <Text style={styles.loadingText}>Loading your groups...</Text>
          </View>
        ) : !groups || !Array.isArray(groups) || groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You don't belong to any groups yet.</Text>
            <Text style={styles.emptySubtext}>Join a group to share prayers with others!</Text>
          </View>
        ) : (
          <ScrollView style={styles.groupsList} showsVerticalScrollIndicator={false}>
            {groups.map((group) => (
              <Pressable
                key={group.groupId}
                style={styles.groupItem}
                onPress={() => handleShareWithGroup(group)}
                disabled={sharing}
              >
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.groupName}</Text>
                  <Text style={styles.groupDescription} numberOfLines={2}>
                    {group.groupDescription}
                  </Text>
                </View>
                {sharing && (
                  <ActivityIndicator size="small" color="#008000" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
        
        <View style={styles.shareButtonRow}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={() => setModalMode('share')}
          >
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      {modalMode === 'detail' && renderDetailView()}
      {modalMode === 'share' && renderShareView()}
      {modalMode === 'groupSelection' && renderGroupSelectionView()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 70, 55, 0.9)',
  },
  detailContainer: {
    width: '90%',
    backgroundColor: 'transparent',
  },
  scrollableContent: {
    flexShrink: 0,
  },
  scrollableContentContainer: {
    flexGrow: 1,
  },
  cardWrapper: {
    flex: 1,
  },
  cardStyle: {
    marginVertical: 0,
    marginHorizontal: 0,
    width: '100%',
  },
  text: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  button: {
    padding: 10,
    backgroundColor: '#008000',
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: '#cc0000',
  },
  shareButton: {
    backgroundColor: '#007AFF',
  },
  spacer: {
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: '80%',
  },
  shareTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  shareSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  shareOptionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  shareOptionButton: {
    backgroundColor: '#F1FDED',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shareOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  shareOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  disabledOptionButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#d0d0d0',
    opacity: 0.6,
  },
  disabledOptionText: {
    color: '#999',
  },
  shareOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  disabledIndicator: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabledBannerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  groupsList: {
    maxHeight: 300,
    marginBottom: 24,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1FDED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  shareButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
});

export default PrayerDetailModal;
