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
import { FontAwesome, Ionicons } from '@expo/vector-icons';
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

  const headerTitle = contextTitle || 'Prayer Session';

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
            <Text style={styles.title}>{headerTitle}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              onPress={handleClose}
            >
              <Ionicons name='close' size={22} color='#2d3e31' />
            </Pressable>
          </View>

          {/* Card Container - Center 1/2 */}
          <View style={styles.cardContainer}>
            {/* Praying for subject name */}
            {currentPrayer.prayerSubjectDisplayName && (
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectLabel}>Praying for</Text>
                <Text style={styles.subjectName}>{currentPrayer.prayerSubjectDisplayName}</Text>
              </View>
            )}
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
                style={({ pressed }) => [
                  styles.navButton,
                  isFirstPrayer && styles.navButtonDisabled,
                  pressed && !isFirstPrayer && styles.navButtonPressed,
                ]}
                onPress={goToPrevious}
                disabled={isFirstPrayer}
              >
                <Ionicons
                  name='chevron-back'
                  size={28}
                  color={isFirstPrayer ? '#a0a0a0' : '#2d3e31'}
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
                style={({ pressed }) => [
                  styles.navButton,
                  isLastPrayer && styles.navButtonDisabled,
                  pressed && !isLastPrayer && styles.navButtonPressed,
                ]}
                onPress={goToNext}
                disabled={isLastPrayer}
              >
                <Ionicons
                  name='chevron-forward'
                  size={28}
                  color={isLastPrayer ? '#a0a0a0' : '#2d3e31'}
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
  cardContainer: {
    height: screenHeight * 0.5, // Center 1/2 of screen
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#ccf0ccff',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    top: 60,
    width: 44,
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.7)',
  },
  container: {
    flex: 1,
  },
  footer: {
    height: screenHeight * 0.25, // Bottom 1/4 of screen
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  navButton: {
    alignItems: 'center',
    backgroundColor: '#ccf0ccff',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 30,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 60,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(204, 240, 204, 0.4)',
    shadowOpacity: 0.1,
  },
  navButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.7)',
  },
  navigationContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overlay: {
    backgroundColor: 'rgba(20, 40, 25, 0.95)',
    flex: 1,
  },
  prayerCard: {
    backgroundColor: '#F1FDED',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    justifyContent: 'flex-start',
  },
  prayerText: {
    color: '#5a6b5e',
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'left',
  },
  prayerTextContainer: {
    flex: 1, // Take remaining space in card
  },
  prayerTitle: {
    color: '#2d3e31',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  progressBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 24,
  },
  progressFill: {
    backgroundColor: '#90c590',
    borderRadius: 3,
    height: '100%',
  },
  progressText: {
    color: '#fff',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    marginBottom: 12,
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
  title: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 22,
    textAlign: 'center',
  },
});

export default PrayerSessionModal;