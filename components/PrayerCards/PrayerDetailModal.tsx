import { Prayer } from '@/util/shared.types';
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert
} from 'react-native';
import Card from './PrayerCard';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { removePrayerAccess } from '@/util/removePrayerAccess';
import { useAppDispatch } from '@/hooks/redux';
import { fetchUserPrayers } from '@/store/userPrayersSlice';

type RootStackParamList = {
  PrayerModal: { mode: string; prayer: Prayer };
};

interface PrayerDetailModalProps {
  visible: boolean;
  userId: number;
  userToken: string;
  prayer: Prayer;
  onClose: () => void;
}

const PrayerDetailModal: React.FC<PrayerDetailModalProps> = ({
  visible,
  userId,
  userToken,
  prayer,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const canEditAndDelete = () => userId === prayer.userProfileId;

  console.log('description in PrayerDetailModal:', prayer.prayerDescription);

  const onEditHandler = () => {
    onClose();
    navigation.navigate('PrayerModal', { mode: 'edit', prayer });
  };

  const onDeleteHandler = async () => {    
    try {
      setLoading(true);
      const result = await removePrayerAccess(
        userToken,
        prayer.prayerId,
        prayer.prayerAccessId
      );
      if (result.success) {
        dispatch(fetchUserPrayers());
        Alert.alert('Success', 'Prayer deleted successfully.');
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to delete prayer.');
      }
    } catch (error) {
      console.error('Error deleting prayer:', error);
      Alert.alert('Error', 'An unknown error occurred.');
      setLoading(false);      
      onClose();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <Card
          prayer={prayer}
          style={{ width: '100%', padding: 20 }} 
        >
          <Text style={styles.text}>{prayer.prayerDescription}</Text>
        </Card>
        <View style={styles.buttonRow}>
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
            <Text>Prayer can only be edited/deleted by the prayer's creator.</Text>
          )}
        </View>
      </TouchableOpacity>
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrayerDetailModal;
