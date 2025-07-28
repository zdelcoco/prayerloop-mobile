import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Prayer, User } from '@/util/shared.types';
import Card from '@/components/PrayerCards/PrayerCard';

interface PrayerSessionModalProps {
  visible: boolean;
  prayers: Prayer[];
  currentUserId: number;
  usersLookup?: { [userProfileId: number]: User };
  onClose: () => void;
  contextTitle?: string; // e.g., "Personal Prayers" or group name
}

const PrayerSessionModal: React.FC<PrayerSessionModalProps> = ({
  visible,
  prayers,
  currentUserId,
  usersLookup,
  onClose,
  contextTitle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPrayer = prayers[currentIndex];
  const isFirstPrayer = currentIndex === 0;
  const isLastPrayer = currentIndex === prayers.length - 1;

  const goToPrevious = useCallback(() => {
    if (!isFirstPrayer) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, isFirstPrayer]);

  const goToNext = useCallback(() => {
    if (!isLastPrayer) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, isLastPrayer]);

  const handleClose = useCallback(() => {
    setCurrentIndex(0); // Reset to first prayer when closing
    onClose();
  }, [onClose]);

  if (!visible || !currentPrayer) {
    return null;
  }

  const sessionTitle = contextTitle
    ? contextTitle === 'Personal Prayers'
      ? contextTitle
      : `Praying for ${contextTitle}`
    : 'Prayer Session';

  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={handleClose}>
        <View style={styles.sessionContainer}>
          <View style={styles.header}>
            <Text style={styles.sessionTitle}>{sessionTitle}</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <FontAwesome name='times' size={20} color='#fff' />
            </Pressable>
          </View>

          <View style={styles.cardContainer}>
            <Card
              prayer={currentPrayer}
              style={styles.prayerCard}
              currentUserId={currentUserId}
              usersLookup={usersLookup}
            >
              <Text style={styles.prayerText}>
                {currentPrayer.prayerDescription}
              </Text>
            </Card>
          </View>

          <View style={styles.navigationRow}>
            <Pressable
              style={[
                styles.navButton,
                isFirstPrayer && styles.navButtonDisabled,
              ]}
              onPress={goToPrevious}
              disabled={isFirstPrayer}
            >
              <FontAwesome
                name='chevron-left'
                size={20}
                color={isFirstPrayer ? '#ccc' : '#008000'}
              />
            </Pressable>

            <Text style={styles.counter}>
              {currentIndex + 1} of {prayers.length}
            </Text>

            <Pressable
              style={[
                styles.navButton,
                isLastPrayer && styles.navButtonDisabled,
              ]}
              onPress={goToNext}
              disabled={isLastPrayer}
            >
              <FontAwesome
                name='chevron-right'
                size={20}
                color={isLastPrayer ? '#ccc' : '#008000'}
              />
            </Pressable>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(50, 70, 55, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionContainer: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  prayerCard: {
    width: '100%',
  },
  prayerText: {
    fontSize: 16,
    lineHeight: 22,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 40,
  },
  navButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  counter: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'center',
  },
});

export default PrayerSessionModal;
