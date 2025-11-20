import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Share,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { fetchUserGroups } from '@/store/groupsSlice';
import { addPrayerAccess } from '@/util/addPrayerAccess';
import type { Prayer, Group } from '@/util/shared.types';
import { RootState } from '@/store/store';

interface SharePrayerModalProps {
  visible: boolean;
  prayer: Prayer;
  userToken: string;
  onClose: () => void;
  onActionComplete: () => void;
}

const SharePrayerModal: React.FC<SharePrayerModalProps> = ({
  visible,
  prayer,
  userToken,
  onClose,
  onActionComplete,
}) => {
  console.log('SharePrayerModal render:', { visible, prayerId: prayer?.prayerId });
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { groups, status: groupsStatus } = useAppSelector((state: RootState) => state.userGroups);
  
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Fetch user's groups when modal opens
  useEffect(() => {
    if (visible && (!groups || groups.length === 0)) {
      dispatch(fetchUserGroups());
    }
  }, [visible, groups, dispatch]);

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

  const renderGroupSelection = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Share with Group</Text>
      <Text style={styles.subtitle}>Select a group to share this prayer with:</Text>
      
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
      
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={() => setShowGroupSelection(false)}
        >
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderMainOptions = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Share Prayer</Text>
      <Text style={styles.subtitle}>How would you like to share this prayer?</Text>
      
      <View style={styles.optionsContainer}>
        <Pressable
          style={styles.optionButton}
          onPress={() => setShowGroupSelection(true)}
        >
          <Text style={styles.optionTitle}>Share with Group</Text>
          <Text style={styles.optionDescription}>
            Share privately with members of your prayer groups
          </Text>
        </Pressable>
        
        <Pressable
          style={styles.optionButton}
          onPress={handleNativeShare}
        >
          <Text style={styles.optionTitle}>Share Externally</Text>
          <Text style={styles.optionDescription}>
            Share via text, email, or other apps
          </Text>
        </Pressable>
      </View>
      
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );

  if (!visible) {
    return null;
  }

  const overlayStyle = {
    ...styles.absoluteOverlay,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
  };

  return (
    <View style={overlayStyle}>
      <Pressable style={styles.dismissArea} onPress={onClose} />
      <View style={styles.modalContainer}>
        {showGroupSelection ? renderGroupSelection() : renderMainOptions()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: -100,
    height: Dimensions.get('window').height + 200,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: -100,
    width: Dimensions.get('window').width,
    zIndex: 9999,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  dismissArea: {
    flex: 1,
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
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 300,
  },
  optionButton: {
    backgroundColor: '#F1FDED',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  optionDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  optionTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  title: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default SharePrayerModal;