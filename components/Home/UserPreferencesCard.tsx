import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { getUserPreferencesWithDefaults, updateUserPreference } from '../../util/userPreferences';
import { PreferenceWithDefault, UserPreferencesWithDefaultsResponse } from '../../util/userPreferences.types';

const UserPreferencesCard = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [preferences, setPreferences] = useState<PreferenceWithDefault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      loadPreferences();
    }
  }, [user, token]);

  const loadPreferences = async () => {
    if (!user || !token) return;

    try {
      setLoading(true);
      const result = await getUserPreferencesWithDefaults(token, user.userProfileId);
      
      if (result.success) {
        const response = result.data as UserPreferencesWithDefaultsResponse;
        setPreferences(response.preferences || []);
      } else {
        Alert.alert('Error', 'Failed to load preferences');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (preference: PreferenceWithDefault, newValue: string) => {
    if (!user || !token) return;

    try {
      const result = await updateUserPreference(
        token,
        user.userProfileId,
        preference.preferenceId,
        {
          preferenceKey: preference.key,
          preferenceValue: newValue,
          isActive: true, // Always set to active when user changes it
        }
      );

      if (result.success) {
        // Update the local state with the new value
        setPreferences(prev =>
          prev.map(p =>
            p.preferenceId === preference.preferenceId
              ? { ...p, value: newValue, isDefault: false }
              : p
          )
        );
      } else {
        Alert.alert('Error', 'Failed to update preference');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update preference');
    }
  };

  const getPreferenceDisplay = (preference: PreferenceWithDefault) => {
    // Use the description from the backend if available, otherwise format the key
    if (preference.description) {
      return preference.description;
    }
    
    if (!preference.key || typeof preference.key !== 'string') {
      return 'Unknown Preference';
    }
    
    // Fallback to formatting the key name
    return preference.key.charAt(0).toUpperCase() + preference.key.slice(1);
  };

  const renderPreference = (preference: PreferenceWithDefault) => {
    const displayName = getPreferenceDisplay(preference);
    const isComingSoon = true; // All preferences are coming soon for now

    // Handle boolean preferences (theme, notifications, etc.)
    if (preference.valueType === 'boolean') {
      const boolValue = preference.value === 'true';

      return (
        <View key={preference.key} style={styles.preferenceRow}>
          <Text style={[styles.preferenceLabel, isComingSoon && styles.comingSoonLabel]}>
            {displayName}
          </Text>
          <View style={styles.switchContainer}>
            <Switch
              value={boolValue}
              onValueChange={isComingSoon ? undefined : (value) =>
                updatePreference(preference, value ? 'true' : 'false')
              }
              disabled={isComingSoon}
              thumbColor={boolValue ? '#white' : 'white'}
              trackColor={{ false: '#ddd', true: '#ccc' }}
            />
          </View>
        </View>
      );
    }

    // Handle string preferences that have specific options (like theme with light/dark)
    if (preference.key === 'theme' && preference.valueType === 'string') {
      // theming is low on priority, don't want to highlight to users yet
      //const isDark = preference.value === 'dark';

      return;
    }

    // For other preference types, just show the value (could add more UI types later)
    return (
      <View key={preference.key} style={styles.preferenceRow}>
        <Text style={[styles.preferenceLabel, isComingSoon && styles.comingSoonLabel]}>
          {displayName}
        </Text>
        <Text style={styles.preferenceValue}>{preference.value}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.cardContainer}>
        <Text style={styles.title}>User Preferences</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      {/* Construction tape overlay */}
      <View style={styles.tapeOverlay} pointerEvents="none">
        <View style={styles.tapeBanner}>
          <Text style={styles.tapeText}>COMING SOON</Text>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>User Preferences</Text>
      </View>
      {!Array.isArray(preferences) || preferences.length === 0 ? (
        <Text style={styles.emptyText}>No preferences found</Text>
      ) : (
        preferences.map(renderPreference)
      )}
    </View>
  );
};

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    padding: 16,
  },
  comingSoonLabel: {
    color: SUBTLE_TEXT,
    fontStyle: 'italic',
  },
  emptyText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  preferenceLabel: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    lineHeight: 22,
    marginRight: 16,
  },
  preferenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 40,
    paddingVertical: 8,
  },
  preferenceValue: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  switchContainer: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  tapeBanner: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'absolute',
    //right: 60,
    top: 85,
    //transform: [{ rotate: '-30deg' }],
    width: '100%',
  },
  tapeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  tapeText: {
    color: '#ffffff',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
});

export default UserPreferencesCard;