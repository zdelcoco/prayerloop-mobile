import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Prayer } from '../../util/shared.types';
import PrayerSessionModal from '../PrayerSession/PrayerSessionModal';
import PrayerSourceSelectionModal from '../PrayerSession/PrayerSourceSelectionModal';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const StartPrayerSessionCard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [showSourceSelection, setShowSourceSelection] = useState(false);
  const [showPrayerSession, setShowPrayerSession] = useState(false);
  const [sessionPrayers, setSessionPrayers] = useState<Prayer[]>([]);
  const [contextTitle, setContextTitle] = useState('Prayer Session');

  const handleStartSession = (prayers: Prayer[], title: string) => {
    setSessionPrayers(prayers);
    setContextTitle(title);
    setShowPrayerSession(true);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.cardContainer,
          pressed && styles.cardPressed,
        ]}
        onPress={() => setShowSourceSelection(true)}
      >
        <Text style={styles.title}>Start Prayer Session</Text>
        <Text style={styles.description}>
          Choose from your personal prayers and group prayers to create a custom prayer session.
        </Text>

        <View style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Praying!</Text>
        </View>
      </Pressable>

      <PrayerSourceSelectionModal
        visible={showSourceSelection}
        onClose={() => setShowSourceSelection(false)}
        onStartSession={handleStartSession}
      />

      <PrayerSessionModal
        visible={showPrayerSession}
        prayers={sessionPrayers}
        currentUserId={user?.userProfileId || 0}
        onClose={() => {
          setShowPrayerSession(false);
          setSessionPrayers([]);
        }}
        contextTitle={contextTitle}
      />
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  cardPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
  },
  description: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  startButtonText: {
    color: '#fff',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  title: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
    marginBottom: 8,
  },
});

export default StartPrayerSessionCard;
