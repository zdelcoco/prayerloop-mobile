import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { selectPrayerSubjects } from '@/store/prayerSubjectsSlice';
import { getUserGroups } from '@/util/getUserGroups';
import { getGroupPrayers } from '@/util/getGroupPrayers';
import type { Group, Prayer } from '@/util/shared.types';

interface PrayerSource {
  id: string;
  name: string;
  type: 'personal' | 'group';
  groupId?: number;
  selected: boolean;
}

interface PrayerSourceSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onStartSession: (prayers: Prayer[], contextTitle: string) => void;
}

// Design colors
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PrayerSourceSelectionModal({
  visible,
  onClose,
  onStartSession,
}: PrayerSourceSelectionModalProps) {
  const { user, token } = useAppSelector((state: RootState) => state.auth);
  const prayerSubjects = useAppSelector(selectPrayerSubjects);
  const [sources, setSources] = useState<PrayerSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Animation for slide up
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Animate slide up when visible changes
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible, slideAnim]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [slideAnim, onClose]);

  const loadPrayerSources = useCallback(async () => {
    if (!user || !token) return;

    try {
      setInitialLoading(true);

      const prayerSources: PrayerSource[] = [
        {
          id: 'personal',
          name: 'Personal Prayers',
          type: 'personal',
          selected: true,
        },
      ];

      const groupsResult = await getUserGroups(token, user.userProfileId);

      if (groupsResult.success && groupsResult.data && Array.isArray(groupsResult.data)) {
        const groups: Group[] = groupsResult.data;
        groups.forEach(group => {
          prayerSources.push({
            id: `group-${group.groupId}`,
            name: group.groupName,
            type: 'group',
            groupId: group.groupId,
            selected: false,
          });
        });
      }

      setSources(prayerSources);
    } catch (error) {
      console.log('Error loading prayer sources:', error);
      setSources([
        {
          id: 'personal',
          name: 'Personal Prayers',
          type: 'personal',
          selected: true,
        },
      ]);
    } finally {
      setInitialLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (visible && user && token) {
      loadPrayerSources();
    }
  }, [visible, user, token, loadPrayerSources]);

  const toggleSource = (sourceId: string) => {
    setSources(prev =>
      prev.map(source =>
        source.id === sourceId
          ? { ...source, selected: !source.selected }
          : source
      )
    );
  };

  const getContextTitle = () => {
    const selectedSources = sources.filter(source => source.selected);
    if (selectedSources.length === 1) {
      return selectedSources[0].name;
    }
    return 'Mixed Prayer Session';
  };

  const startPrayerSession = async () => {
    if (!user || !token) return;

    const selectedSources = sources.filter(source => source.selected);

    if (selectedSources.length === 0) {
      Alert.alert('No Selection', 'Please select at least one prayer source');
      return;
    }

    try {
      setLoading(true);
      const allPrayers: Prayer[] = [];

      for (const source of selectedSources) {
        try {
          if (source.type === 'personal') {
            // Use prayerSubjects from Redux to get prayers with subject display names
            if (prayerSubjects && prayerSubjects.length > 0) {
              const enrichedPrayers = prayerSubjects.flatMap(subject =>
                subject.prayers.map(prayer => ({
                  ...prayer,
                  prayerSubjectDisplayName: prayer.prayerSubjectDisplayName || subject.prayerSubjectDisplayName,
                }))
              );
              allPrayers.push(...enrichedPrayers);
            }
          } else if (source.type === 'group' && source.groupId) {
            const result = await getGroupPrayers(token, source.groupId);
            if (result.success && result.data?.prayers) {
              allPrayers.push(...result.data.prayers);
            }
          }
        } catch (error) {
          console.log(`Error loading ${source.name}:`, error);
        }
      }

      if (allPrayers.length === 0) {
        Alert.alert(
          'No Prayers Yet',
          'No prayers found in the selected sources. Add some prayers to get started!'
        );
        return;
      }

      const contextTitle = getContextTitle();
      onClose();
      // Small delay to let the modal close animation finish
      setTimeout(() => {
        onStartSession(allPrayers, contextTitle);
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to load prayers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Select Prayer Sources</Text>
              <Pressable
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={DARK_TEXT} />
              </Pressable>
            </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Choose which prayers to include in your session
          </Text>

          {/* Sources List */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {initialLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ACTIVE_GREEN} />
                <Text style={styles.loadingText}>Loading sources...</Text>
              </View>
            ) : (
              sources.map((source, index) => (
                <Pressable
                  key={source.id}
                  onPress={() => toggleSource(source.id)}
                  style={({ pressed }) => [
                    styles.sourceCard,
                    source.selected && styles.sourceCardSelected,
                    pressed && styles.sourceCardPressed,
                    index === sources.length - 1 && styles.sourceCardLast,
                  ]}
                >
                  <View style={styles.sourceInfo}>
                    <View style={[
                      styles.sourceIconContainer,
                      source.selected && styles.sourceIconContainerSelected,
                    ]}>
                      <FontAwesome
                        name={source.type === 'personal' ? 'user' : 'users'}
                        size={16}
                        color={source.selected ? '#FFFFFF' : SUBTLE_TEXT}
                      />
                    </View>
                    <View style={styles.sourceTextContainer}>
                      <Text style={[
                        styles.sourceName,
                        source.selected && styles.sourceNameSelected,
                      ]}>
                        {source.name}
                      </Text>
                      <Text style={styles.sourceType}>
                        {source.type === 'personal' ? 'Personal' : 'Prayer Circle'}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    source.selected && styles.checkboxSelected,
                  ]}>
                    {source.selected && (
                      <FontAwesome name="check" size={14} color="#fff" />
                    )}
                  </View>
                </Pressable>
              ))
            )}

            {/* Bottom padding */}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <Pressable
              onPress={startPrayerSession}
              disabled={loading || sources.filter(s => s.selected).length === 0}
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startButtonPressed,
                (loading || sources.filter(s => s.selected).length === 0) && styles.startButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome name="play" size={14} color="#fff" />
                  <Text style={styles.startButtonText}>Start Session</Text>
                </>
              )}
            </Pressable>
          </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderColor: SUBTLE_TEXT,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxSelected: {
    backgroundColor: ACTIVE_GREEN,
    borderColor: ACTIVE_GREEN,
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
  footer: {
    borderTopColor: 'rgba(45, 62, 49, 0.1)',
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  modalContainer: {
    backgroundColor: '#F6EDD9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollContainer: {
    maxHeight: 350,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  sourceCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sourceCardLast: {
    marginBottom: 0,
  },
  sourceCardPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
  },
  sourceCardSelected: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
    borderColor: ACTIVE_GREEN,
    borderWidth: 1,
  },
  sourceIconContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  sourceIconContainerSelected: {
    backgroundColor: ACTIVE_GREEN,
  },
  sourceInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  sourceName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  sourceNameSelected: {
    color: ACTIVE_GREEN,
  },
  sourceTextContainer: {
    flex: 1,
  },
  sourceType: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  startButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  startButtonPressed: {
    backgroundColor: '#1B5E20',
  },
  startButtonText: {
    color: '#fff',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  subtitle: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 18,
  },
});
