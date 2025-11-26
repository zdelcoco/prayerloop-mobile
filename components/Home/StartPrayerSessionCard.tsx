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
      
      // Always start with personal prayers
      const prayerSources: PrayerSource[] = [
        {
          id: 'personal',
          name: 'Personal Prayers',
          type: 'personal',
          selected: true, // Default selected
        },
      ];

      // Try to load user groups
      const groupsResult = await getUserGroups(token, user.userProfileId);
      
      if (groupsResult.success) {
        // Success - check if we have groups data
        if (groupsResult.data && Array.isArray(groupsResult.data)) {
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
        // If groupsResult.data is null/undefined/empty array, user just has no groups - not an error
      } else {
        // Only show error for actual API failures (network, auth, etc.), not "no groups found"
        console.log('Failed to load groups, but continuing with personal prayers only:', groupsResult.error);
      }

      setSources(prayerSources);
    } catch (error) {
      // Only catch unexpected errors here - still continue with personal prayers
      console.log('Unexpected error loading groups, continuing with personal prayers:', error);
      setSources([
        {
          id: 'personal',
          name: 'Personal Prayers',
          type: 'personal',
          selected: true,
        },
      ]);
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
            if (result.success) {
              // If prayers is undefined, it means user has no prayers yet (not an error)
              if (result.data?.prayers) {
                allPrayers.push(...result.data.prayers);
              }
              // No error when prayers is undefined - user just has no prayers yet
            } else {
              errors.push(`Failed to load ${source.name}`);
            }
          } else if (source.type === 'group' && source.groupId) {
            const result = await getGroupPrayers(token, source.groupId);
            if (result.success) {
              // If prayers is undefined, it means group has no prayers yet (not an error)
              if (result.data?.prayers) {
                allPrayers.push(...result.data.prayers);
              }
              // No error when prayers is undefined - group just has no prayers yet
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
        Alert.alert(
          'No Prayers Yet', 
          'You haven\'t created any prayers yet. Add some prayers to your personal collection or join groups with shared prayers to get started!'
        );
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
          <Text style={styles.startButtonText}>Start Praying!</Text>
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
  cancelButton: {
    color: '#999',
    fontSize: 16,
  },
  cardContainer: {
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#ccc',
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
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
  description: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectionSummary: {
    color: '#008000',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  sourceNameSelected: {
    color: '#008000',
  },
  sourceRow: {
    alignItems: 'center',
    borderColor: '#eee',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sourceRowSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#008000',
  },
  sourceType: {
    color: '#666',
    fontSize: 14,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: '#008000',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  startSessionButton: {
    color: '#008000',
    fontSize: 16,
    fontWeight: '600',
  },
  startSessionButtonDisabled: {
    color: '#ccc',
  },
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default StartPrayerSessionCard;