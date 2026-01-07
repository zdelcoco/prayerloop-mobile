import { Prayer, Group, User, PrayerSubject } from '@/util/shared.types';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  Animated,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Card from './PrayerCard';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { removePrayerAccess } from '@/util/removePrayerAccess';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserPrayers } from '@/store/userPrayersSlice';
import { fetchUserGroups } from '@/store/groupsSlice';
import { fetchPrayerSubjects, selectPrayerSubjects } from '@/store/prayerSubjectsSlice';
import { addPrayerAccess } from '@/util/addPrayerAccess';
import { RootState } from '@/store/store';

// Design colors
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  PrayerModal: { mode: string; prayer: Prayer; prayerSubjectId?: number };
};

interface PrayerDetailModalProps {
  visible: boolean;
  userId: number;
  userToken: string;
  prayer: Prayer;
  prayerSubjectId?: number; // Optional - used to prepopulate "who is this prayer for?" when editing
  subjectDisplayName?: string; // Optional - used when prayer.prayerSubjectDisplayName is not populated
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
  subjectDisplayName,
  onClose,
  onActionComplete,
  onShare,
  usersLookup,
  context = 'cards', // Default to 'cards' for backward compatibility
}) => {
  // Use prayer's subject display name, or the one passed as prop
  const displaySubjectName = prayer.prayerSubjectDisplayName || subjectDisplayName;
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState<'detail' | 'share' | 'groupSelection'>('detail');
  const [sharing, setSharing] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { groups, status: groupsStatus } = useAppSelector((state: RootState) => state.userGroups);
  const prayerSubjects = useAppSelector(selectPrayerSubjects);

  // Animation for share modal slide up
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const canEditAndDelete = () => userId === prayer.createdBy;
  const canShare = () => !prayer.isPrivate;

  // Find the linked contact for the prayer creator (for groups context)
  // This is the contact card that corresponds to the group member who created the prayer
  const linkedContact = useMemo(() => {
    if (!prayerSubjects || context !== 'groups') return null;
    return prayerSubjects.find(subject =>
      subject.userProfileId === prayer.createdBy &&
      subject.linkStatus === 'linked'
    ) || null;
  }, [prayerSubjects, prayer.createdBy, context]);

  // Check if prayer already exists on the linked contact
  const prayerExistsOnLinkedContact = useMemo(() => {
    if (!linkedContact) return false;
    return linkedContact.prayers?.some(p => p.prayerId === prayer.prayerId) || false;
  }, [linkedContact, prayer.prayerId]);

  // Animate share modal when entering share/selection modes
  useEffect(() => {
    if (modalMode === 'share' || modalMode === 'groupSelection') {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [modalMode, slideAnim]);

  // Fetch user's groups and prayer subjects when modal opens
  useEffect(() => {
    if (visible) {
      if (!groups || groups.length === 0) {
        dispatch(fetchUserGroups());
      }
      dispatch(fetchPrayerSubjects());
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

  const handleAddToLinkedContact = useCallback(async () => {
    if (!linkedContact) return;

    setSharing(true);
    try {
      const result = await addPrayerAccess(
        userToken,
        prayer.prayerId,
        'subject',
        linkedContact.prayerSubjectId
      );

      if (result.success) {
        dispatch(fetchPrayerSubjects());
        Alert.alert(
          'Success!',
          `Prayer has been added to "${linkedContact.prayerSubjectDisplayName}"`,
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
          result.error?.message || 'Failed to add prayer to contact'
        );
      }
    } catch (error) {
      console.error('Error adding prayer to contact:', error);
      Alert.alert('Error', 'Failed to add prayer. Please try again.');
    } finally {
      setSharing(false);
    }
  }, [userToken, prayer.prayerId, linkedContact, dispatch, onActionComplete, onClose]);

  const onShareHandler = () => {
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
          {displaySubjectName && (
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectLabel}>Pray for</Text>
              <Text style={styles.subjectName}>{displaySubjectName}</Text>
            </View>
          )}
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
                  <Text style={{ fontSize: 20 }}>✏️</Text>
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

  // Generate initials and color for contact avatars
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63', '#607D8B', '#795548'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const hasGroups = groups && Array.isArray(groups) && groups.length > 0;
  // Show "Add to Contact" option only if:
  // - We're in groups context
  // - There's a linked contact for the prayer creator
  // - The prayer isn't already on that contact
  // - The linked contact is not the current user (don't offer to add your own prayer to your own contact card)
  const showAddToContact = context === 'groups' && linkedContact && !prayerExistsOnLinkedContact && linkedContact.userProfileId !== userId;

  const renderShareView = () => (
    <Pressable style={styles.shareOverlay} onPress={() => setModalMode('detail')}>
      <Animated.View
        style={[
          styles.shareModalContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.shareHeader}>
            <Text style={styles.shareTitle}>Share Prayer</Text>
            <Pressable
              onPress={() => setModalMode('detail')}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={DARK_TEXT} />
            </Pressable>
          </View>

          {/* Subtitle */}
          <Text style={styles.shareSubtitle}>
            How would you like to share this prayer?
          </Text>

          {/* Options */}
          <ScrollView style={styles.shareOptionsScroll} showsVerticalScrollIndicator={false}>
            {/* Add to linked contact - only in groups context when linked contact exists */}
            {showAddToContact && linkedContact && (
              <Pressable
                style={({ pressed }) => [
                  styles.shareOptionButton,
                  pressed && styles.shareOptionButtonPressed,
                ]}
                onPress={handleAddToLinkedContact}
                disabled={sharing}
              >
                <View style={[styles.shareOptionIconContainer, { backgroundColor: getAvatarColor(linkedContact.prayerSubjectDisplayName) }]}>
                  <Text style={styles.avatarText}>
                    {getInitials(linkedContact.prayerSubjectDisplayName)}
                  </Text>
                </View>
                <View style={styles.shareOptionTextContainer}>
                  <Text style={styles.shareOptionTitle}>Add to {linkedContact.prayerSubjectDisplayName}</Text>
                  <Text style={styles.shareOptionDescription}>
                    Save this prayer to your contact card
                  </Text>
                </View>
                {sharing ? (
                  <ActivityIndicator size="small" color={ACTIVE_GREEN} />
                ) : (
                  <Ionicons name="add-circle" size={24} color={ACTIVE_GREEN} />
                )}
              </Pressable>
            )}

            {/* Share with Group */}
            <Pressable
              style={({ pressed }) => [
                styles.shareOptionButton,
                !hasGroups && styles.shareOptionButtonDisabled,
                pressed && hasGroups && styles.shareOptionButtonPressed,
              ]}
              onPress={() => hasGroups && setModalMode('groupSelection')}
              disabled={!hasGroups}
            >
              <View style={[styles.shareOptionIconContainerActive, !hasGroups && styles.shareOptionIconDisabled]}>
                <Ionicons name="people" size={18} color={hasGroups ? '#FFFFFF' : '#999'} />
              </View>
              <View style={styles.shareOptionTextContainer}>
                <Text style={[styles.shareOptionTitle, !hasGroups && styles.shareOptionTextDisabled]}>
                  Share with Group
                </Text>
                <Text style={[styles.shareOptionDescription, !hasGroups && styles.shareOptionTextDisabled]}>
                  {hasGroups
                    ? 'Share privately with members of your prayer groups'
                    : 'Join a group first to share prayers'
                  }
                </Text>
              </View>
              {hasGroups ? (
                <Ionicons name="chevron-forward" size={20} color={ACTIVE_GREEN} />
              ) : (
                <Ionicons name="lock-closed" size={16} color="#999" />
              )}
            </Pressable>

            {/* Share Externally */}
            <Pressable
              style={({ pressed }) => [
                styles.shareOptionButton,
                pressed && styles.shareOptionButtonPressed,
              ]}
              onPress={handleNativeShare}
            >
              <View style={styles.shareOptionIconContainerActive}>
                <Ionicons name="share-social" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.shareOptionTextContainer}>
                <Text style={styles.shareOptionTitle}>Share Externally</Text>
                <Text style={styles.shareOptionDescription}>
                  Share via text, email, or other apps
                </Text>
              </View>
              <Ionicons name="open-outline" size={20} color={ACTIVE_GREEN} />
            </Pressable>

            <View style={{ height: 20 }} />
          </ScrollView>
        </Pressable>
      </Animated.View>
    </Pressable>
  );

  const renderGroupSelectionView = () => (
    <Pressable style={styles.shareOverlay} onPress={() => setModalMode('share')}>
      <Animated.View
        style={[
          styles.shareModalContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.shareHeader}>
            <Text style={styles.shareTitle}>Share with Group</Text>
            <Pressable
              onPress={() => setModalMode('share')}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={DARK_TEXT} />
            </Pressable>
          </View>

          {/* Subtitle */}
          <Text style={styles.shareSubtitle}>
            Select a group to share this prayer with:
          </Text>

          {/* Groups List */}
          {groupsStatus === 'loading' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ACTIVE_GREEN} />
              <Text style={styles.loadingText}>Loading your groups...</Text>
            </View>
          ) : !hasGroups ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No groups available</Text>
            </View>
          ) : (
            <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={false}>
              {groups.map((group, index) => (
                <Pressable
                  key={group.groupId}
                  style={({ pressed }) => [
                    styles.selectionItem,
                    pressed && styles.selectionItemPressed,
                    index === groups.length - 1 && styles.selectionItemLast,
                  ]}
                  onPress={() => handleShareWithGroup(group)}
                  disabled={sharing}
                >
                  <View style={[styles.selectionAvatar, { backgroundColor: getAvatarColor(group.groupName) }]}>
                    <Ionicons name="people" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.selectionInfo}>
                    <Text style={styles.selectionName}>{group.groupName}</Text>
                    {group.groupDescription && (
                      <Text style={styles.selectionSubtext} numberOfLines={1}>
                        {group.groupDescription}
                      </Text>
                    )}
                  </View>
                  {sharing ? (
                    <ActivityIndicator size="small" color={ACTIVE_GREEN} />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={ACTIVE_GREEN} />
                  )}
                </Pressable>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </Pressable>
      </Animated.View>
    </Pressable>
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
  avatarText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  cardStyle: {
    marginHorizontal: 0,
    marginVertical: 0,
    width: '100%',
  },
  cardWrapper: {
    flex: 1,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginLeft: 12,
    width: 32,
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
  detailContainer: {
    backgroundColor: 'transparent',
    width: '90%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySubtext: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginTop: 12,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 40, 25, 0.95)',
    flex: 1,
    justifyContent: 'center',
  },
  scrollableContent: {
    flexShrink: 0,
  },
  scrollableContentContainer: {
    flexGrow: 1,
  },
  selectionAvatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  selectionAvatarText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectionItemLast: {
    marginBottom: 0,
  },
  selectionItemPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
  },
  selectionList: {
    maxHeight: 350,
    paddingHorizontal: 16,
  },
  selectionName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  selectionSubtext: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  shareHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  shareModalContainer: {
    backgroundColor: '#F6EDD9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  shareOptionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  shareOptionButtonDisabled: {
    opacity: 0.5,
  },
  shareOptionButtonPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
  },
  shareOptionDescription: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  shareOptionIconContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  shareOptionIconContainerActive: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  shareOptionIconDisabled: {
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  shareOptionsScroll: {
    maxHeight: 350,
    paddingHorizontal: 16,
  },
  shareOptionTextContainer: {
    flex: 1,
  },
  shareOptionTextDisabled: {
    color: '#999',
  },
  shareOptionTitle: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  shareOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  shareSubtitle: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  shareTitle: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 18,
  },
  subjectHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  subjectName: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 20,
  },
  text: {
    fontSize: 16,
  },
});

export default PrayerDetailModal;
