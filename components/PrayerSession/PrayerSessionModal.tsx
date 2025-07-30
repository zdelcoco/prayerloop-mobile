import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Prayer, User } from '@/util/shared.types';

const { height: screenHeight } = Dimensions.get('window');

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
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header - Top 1/4 */}
          <View style={styles.header}>
            <Text style={styles.title}>{sessionTitle}</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <FontAwesome name='times' size={28} color='#fff' />
            </Pressable>
          </View>

          {/* Card Container - Center 1/2 */}
          <View style={styles.cardContainer}>
            <View style={styles.prayerCard}>
              <Text style={styles.prayerTitle}>
                {currentPrayer.title}
              </Text>
              <ScrollView 
                style={styles.prayerTextContainer}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
              >
                <Text style={styles.prayerText}>
                  {currentPrayer.prayerDescription}
                </Text>
              </ScrollView>
            </View>
          </View>

          {/* Footer - Bottom 1/4 */}
          <View style={styles.footer}>
            <View style={styles.navigationContainer}>
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
                  size={24}
                  color={isFirstPrayer ? '#ccc' : '#fff'}
                />
              </Pressable>

              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {currentIndex + 1} of {prayers.length}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${((currentIndex + 1) / prayers.length) * 100}%` }
                    ]} 
                  />
                </View>
              </View>

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
                  size={24}
                  color={isLastPrayer ? '#ccc' : '#fff'}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 40, 25, 0.95)',
  },
  container: {
    flex: 1,
  },
  header: {
    height: screenHeight * 0.25, // Top 1/4 of screen
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Account for status bar
    position: 'relative',
  },
  title: {
    fontSize: 22, // One notch larger
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.46)',
    textAlign: 'center',
  },
  closeButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    position: 'absolute',
    right: 20,
    top: 60,
  },
  cardContainer: {
    height: screenHeight * 0.5, // Center 1/2 of screen
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  prayerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    height: '80%', // Consistent height regardless of content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    justifyContent: 'flex-start',
  },
  prayerTitle: {
    fontSize: 22, // One notch larger
    fontWeight: 'bold',
    color: '#333', // Dark text on white card background
    marginBottom: 24,
    textAlign: 'center',
  },
  prayerTextContainer: {
    flex: 1, // Take remaining space in card
  },
  prayerText: {
    fontSize: 18, // One notch larger
    color: '#666',
    lineHeight: 28,
    textAlign: 'left',
  },
  footer: {
    height: screenHeight * 0.25, // Bottom 1/4 of screen
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#90c590',
    borderRadius: 3,
  },
});

export default PrayerSessionModal;