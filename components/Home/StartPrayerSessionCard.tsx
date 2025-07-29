import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { getUserGroups } from '../../util/getUserGroups';
import { getUserPrayers } from '../../util/getUserPrayers';
import { getGroupPrayers } from '../../util/getGroupPrayers';
import { Group, Prayer, User } from '../../util/shared.types';
import PrayerSessionModal from '../PrayerSession/PrayerSessionModal';

interface PrayerSource {
  id: string;
  name: string;
  type: 'personal' | 'group';
  groupId?: number;
  selected: boolean;
}

const StartPrayerSessionCard = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [showSelection, setShowSelection] = useState(false);
  const [sources, setSources] = useState<PrayerSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [aggregatedPrayers, setAggregatedPrayers] = useState<Prayer[]>([]);
  const [usersLookup, setUsersLookup] = useState<{ [userProfileId: number]: User }>({});
  const [showPrayerSession, setShowPrayerSession] = useState(false);

  useEffect(() => {
    if (user && token) {
      loadPrayerSources();
    }
  }, [user, token]);

  const loadPrayerSources = async () => {
    if (!user || !token) return;

    try {
      setLoading(true);
      
      // Load user groups
      const groupsResult = await getUserGroups(token, user.userProfileId);
      
      const prayerSources: PrayerSource[] = [
        {
          id: 'personal',
          name: 'Personal Prayers',
          type: 'personal',
          selected: true, // Default selected
        },
      ];

      if (groupsResult.success && groupsResult.data) {
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
      Alert.alert('Error', 'Failed to load prayer sources');
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (sourceId: string) => {
    setSources(prev =>
      prev.map(source =>
        source.id === sourceId
          ? { ...source, selected: !source.selected }
          : source
      )
    );
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
      const errors: string[] = [];

      // Load prayers from each selected source
      for (const source of selectedSources) {
        try {
          if (source.type === 'personal') {
            const result = await getUserPrayers(token, user.userProfileId);
            if (result.success && result.data?.prayers) {
              allPrayers.push(...result.data.prayers);
            } else {
              errors.push(`Failed to load ${source.name}`);
            }
          } else if (source.type === 'group' && source.groupId) {
            const result = await getGroupPrayers(token, source.groupId);
            if (result.success && result.data?.prayers) {
              allPrayers.push(...result.data.prayers);
            } else {
              errors.push(`Failed to load prayers from ${source.name}`);
            }
          }
        } catch (error) {
          errors.push(`Error loading ${source.name}`);
        }
      }

      if (errors.length > 0) {
        Alert.alert(
          'Loading Errors',
          `Some prayer sources failed to load:\n${errors.join('\n')}\n\nWould you like to continue with the available prayers or adjust your selection?`,
          [
            {
              text: 'Adjust Selection',
              style: 'cancel',
            },
            {
              text: 'Continue',
              onPress: () => {
                if (allPrayers.length > 0) {
                  setAggregatedPrayers(allPrayers);
                  setShowSelection(false);
                  setShowPrayerSession(true);
                } else {
                  Alert.alert('No Prayers', 'No prayers were loaded successfully');
                }
              },
            },
          ]
        );
        return;
      }

      if (allPrayers.length === 0) {
        Alert.alert('No Prayers', 'No prayers found in the selected sources');
        return;
      }

      setAggregatedPrayers(allPrayers);
      setShowSelection(false);
      setShowPrayerSession(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load prayers');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSourcesText = () => {
    const selectedSources = sources.filter(source => source.selected);
    if (selectedSources.length === 0) return 'No sources selected';
    if (selectedSources.length === 1) return selectedSources[0].name;
    return `${selectedSources.length} sources selected`;
  };

  const getContextTitle = () => {
    const selectedSources = sources.filter(source => source.selected);
    if (selectedSources.length === 1) {
      return selectedSources[0].name;
    }
    return 'Mixed Prayer Session';
  };

  return (
    <>
      <View style={styles.cardContainer}>
        <Text style={styles.title}>Start Prayer Session</Text>
        <Text style={styles.description}>
          Choose from your personal prayers and group prayers to create a custom prayer session.
        </Text>
        
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setShowSelection(true)}
        >
          <Text style={styles.startButtonText}>Choose Prayer Sources</Text>
        </TouchableOpacity>
      </View>

      {/* Source Selection Modal */}
      <Modal
        visible={showSelection}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSelection(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Prayer Sources</Text>
            <TouchableOpacity
              onPress={startPrayerSession}
              disabled={loading}
            >
              <Text style={[
                styles.startSessionButton,
                loading && styles.startSessionButtonDisabled
              ]}>
                Start
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.selectionSummary}>
              {getSelectedSourcesText()}
            </Text>

            {sources.map(source => (
              <TouchableOpacity
                key={source.id}
                style={[
                  styles.sourceRow,
                  source.selected && styles.sourceRowSelected,
                ]}
                onPress={() => toggleSource(source.id)}
              >
                <View style={styles.sourceInfo}>
                  <Text style={[
                    styles.sourceName,
                    source.selected && styles.sourceNameSelected,
                  ]}>
                    {source.name}
                  </Text>
                  <Text style={styles.sourceType}>
                    {source.type === 'personal' ? 'Personal' : 'Group'}
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  source.selected && styles.checkboxSelected,
                ]}>
                  {source.selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#008000" />
                <Text style={styles.loadingText}>Loading prayers...</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Prayer Session Modal */}
      <PrayerSessionModal
        visible={showPrayerSession}
        prayers={aggregatedPrayers}
        currentUserId={user?.userProfileId || 0}
        usersLookup={usersLookup}
        onClose={() => setShowPrayerSession(false)}
        contextTitle={getContextTitle()}
      />
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#008000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    color: '#999',
    fontSize: 16,
  },
  startSessionButton: {
    color: '#008000',
    fontSize: 16,
    fontWeight: '600',
  },
  startSessionButtonDisabled: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  selectionSummary: {
    fontSize: 16,
    color: '#008000',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sourceRowSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#008000',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  sourceNameSelected: {
    color: '#008000',
  },
  sourceType: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#008000',
    borderColor: '#008000',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default StartPrayerSessionCard;