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
import { FontAwesome, Ionicons } from '@expo/vector-icons';
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
  PrayerModal: { mode: string; prayer: Prayer; prayerSubjectId?: number };
};

interface PrayerDetailModalProps {
  visible: boolean;
  userId: number;
  userToken: string;
  prayer: Prayer;
  prayerSubjectId?: number; // Optional - used to prepopulate "who is this prayer for?" when editing
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
  prayerSubjectId,
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
    navigation.navigate('PrayerModal', { mode: 'edit', prayer, prayerSubjectId });
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
          <View style={styles.actionRow}>
            {canShare() && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={onShareHandler}
              >
                <Ionicons name="share-outline" size={20} color="#2E7D32" />
                <Text style={styles.actionButtonText}>Share</Text>
              </Pressable>
            )}
            {canEditAndDelete() && (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={onEditHandler}
                >
                  <Ionicons name="pencil-outline" size={20} color="#2E7D32" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteActionButton,
                    pressed && styles.deleteActionButtonPressed,
                  ]}
                  onPress={onDeleteHandler}
                >
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                  <Text style={styles.deleteActionButtonText}>Delete</Text>
                </Pressable>
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
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
  },
  actionButtonText: {
    color: '#2E7D32',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  deleteActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  deleteActionButtonPressed: {
    backgroundColor: 'rgba(211, 47, 47, 0.15)',
  },
  deleteActionButtonText: {
    color: '#D32F2F',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 15,
  },
  cardStyle: {
    marginHorizontal: 0,
    marginVertical: 0,
    width: '100%',
  },
  cardWrapper: {
    flex: 1,
  },
  detailContainer: {
    backgroundColor: 'transparent',
    width: '90%',
  },
  disabledBanner: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderColor: '#e0e0e0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  disabledBannerText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 6,
  },
  disabledIndicator: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  disabledOptionButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#d0d0d0',
    opacity: 0.6,
  },
  disabledOptionText: {
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  groupDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 18,
  },
  groupInfo: {
    flex: 1,
  },
  groupItem: {
    alignItems: 'center',
    backgroundColor: '#F1FDED',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
  },
  groupName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupsList: {
    marginBottom: 24,
    maxHeight: 300,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(50, 70, 55, 0.9)',
    flex: 1,
    justifyContent: 'center',
  },
  scrollableContent: {
    flexShrink: 0,
  },
  scrollableContentContainer: {
    flexGrow: 1,
  },
  shareButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  shareModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    maxHeight: '80%',
    padding: 20,
  },
  shareOptionButton: {
    backgroundColor: '#F1FDED',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  shareOptionDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  shareOptionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  shareOptionTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  shareOptionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  shareSubtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  shareTitle: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
  },
});

export default PrayerDetailModal;
