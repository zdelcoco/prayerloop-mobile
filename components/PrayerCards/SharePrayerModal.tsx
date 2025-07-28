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
    position: 'absolute',
    top: -100,
    left: 0,
    right: 0,
    bottom: -100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    height: Dimensions.get('window').height + 200,
    width: Dimensions.get('window').width,
  },
  dismissArea: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 300,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#F1FDED',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  optionDescription: {
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SharePrayerModal;