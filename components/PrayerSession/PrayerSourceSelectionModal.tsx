import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { getUserGroups } from '@/util/getUserGroups';
import { getUserPrayers } from '@/util/getUserPrayers';
import { getGroupPrayers } from '@/util/getGroupPrayers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
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
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

export default function PrayerSourceSelectionModal({
  visible,
  onClose,
  onStartSession,
}: PrayerSourceSelectionModalProps) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAppSelector((state: RootState) => state.auth);
  const [sources, setSources] = useState<PrayerSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
            const result = await getUserPrayers(token, user.userProfileId);
            if (result.success && result.data?.prayers) {
              allPrayers.push(...result.data.prayers);
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
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { marginTop: insets.top + 80 }]}>
              <LinearGradient
                colors={['#90C590', '#F6EDD9']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Select Prayer Sources</Text>
                  <Text style={styles.subtitle}>
                    Choose which prayers to include in your session
                  </Text>
                </View>

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
                    sources.map(source => (
                      <Pressable
                        key={source.id}
                        onPress={() => toggleSource(source.id)}
                        style={({ pressed }) => [
                          styles.sourceCard,
                          source.selected && styles.sourceCardSelected,
                          pressed && styles.sourceCardPressed,
                        ]}
                      >
                        <View style={styles.sourceInfo}>
                          <FontAwesome
                            name={source.type === 'personal' ? 'user' : 'users'}
                            size={16}
                            color={source.selected ? ACTIVE_GREEN : SUBTLE_TEXT}
                            style={styles.sourceIcon}
                          />
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
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [
                      styles.cancelButton,
                      pressed && styles.cancelButtonPressed,
                    ]}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
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
              </LinearGradient>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    alignItems: 'center',
    backgroundColor: MUTED_GREEN,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
    paddingVertical: 14,
  },
  cancelButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.7)',
  },
  cancelButtonText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 15,
  },
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
  footer: {
    borderTopColor: 'rgba(45, 62, 49, 0.1)',
    borderTopWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  gradient: {
    borderRadius: 20,
  },
  header: {
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: 1,
    paddingBottom: 16,
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
    borderRadius: 20,
    elevation: 10,
    marginHorizontal: 20,
    maxHeight: '70%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  scrollContainer: {
    maxHeight: 300,
  },
  scrollContent: {
    padding: 16,
  },
  sourceCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sourceCardPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
  },
  sourceCardSelected: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
    borderColor: ACTIVE_GREEN,
    borderWidth: 1,
  },
  sourceIcon: {
    marginRight: 12,
    width: 20,
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
    flex: 1.5,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginLeft: 8,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
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
    fontSize: 15,
  },
  subtitle: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  title: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 20,
    textAlign: 'center',
  },
});
