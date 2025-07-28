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
} from 'react-native';
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
        Alert.alert('Success', 'Prayer deleted successfully.');
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

  const renderDetailView = () => (
    <TouchableOpacity style={styles.overlay} onPress={onClose}>
      <Card prayer={prayer} style={{ width: '100%', padding: 20 }} currentUserId={userId} usersLookup={usersLookup}>
        <Text style={styles.text}>{prayer.prayerDescription}</Text>
      </Card>
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
    </TouchableOpacity>
  );

  const renderShareView = () => (
    <TouchableOpacity style={styles.overlay} onPress={() => setModalMode('detail')}>
      <View style={styles.shareModalContainer}>
        <Text style={styles.shareTitle}>Share Prayer</Text>
        <Text style={styles.shareSubtitle}>How would you like to share this prayer?</Text>
        
        <View style={styles.shareOptionsContainer}>
          <Pressable
            style={styles.shareOptionButton}
            onPress={() => setModalMode('groupSelection')}
          >
            <Text style={styles.shareOptionTitle}>Share with Group</Text>
            <Text style={styles.shareOptionDescription}>
              Share privately with members of your prayer groups
            </Text>
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
      </View>
    </TouchableOpacity>
  );

  const renderGroupSelectionView = () => (
    <TouchableOpacity style={styles.overlay} onPress={() => setModalMode('share')}>
      <View style={styles.shareModalContainer}>
        <Text style={styles.shareTitle}>Share with Group</Text>
        <Text style={styles.shareSubtitle}>Select a group to share this prayer with:</Text>
        
        {groupsStatus === 'loading' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008000" />
            <Text style={styles.loadingText}>Loading your groups...</Text>
          </View>
        ) : !groups || groups.length === 0 ? (
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
      </View>
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
  text: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
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
