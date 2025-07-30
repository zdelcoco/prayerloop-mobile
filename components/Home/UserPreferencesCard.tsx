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
    
    // Handle boolean preferences (theme, notifications, etc.)
    if (preference.valueType === 'boolean') {
      const boolValue = preference.value === 'true';
      
      return (
        <View key={preference.key} style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>{displayName}</Text>
          <View style={styles.switchContainer}>
            <Switch
              value={boolValue}
              onValueChange={(value) => 
                updatePreference(preference, value ? 'true' : 'false')
              }
              thumbColor={boolValue ? '#white' : 'white'}
              trackColor={{ false: '#ccc', true: '#008000' }}
            />
          </View>
        </View>
      );
    }
    
    // Handle string preferences that have specific options (like theme with light/dark)
    if (preference.key === 'theme' && preference.valueType === 'string') {
      const isDark = preference.value === 'dark';
      
      return (
        <View key={preference.key} style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Dark Theme</Text>
          <View style={styles.switchContainer}>
            <Switch
              value={isDark}
              onValueChange={(value) => 
                updatePreference(preference, value ? 'dark' : 'light')
              }
              thumbColor={isDark ? '#white' : 'white'}
              trackColor={{ false: '#ccc', true: '#008000' }}
            />
          </View>
        </View>
      );
    }
    
    // For other preference types, just show the value (could add more UI types later)
    return (
      <View key={preference.key} style={styles.preferenceRow}>
        <Text style={styles.preferenceLabel}>{displayName}</Text>
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
      <Text style={styles.title}>User Preferences</Text>
      {!Array.isArray(preferences) || preferences.length === 0 ? (
        <Text style={styles.emptyText}>No preferences found</Text>
      ) : (
        preferences.map(renderPreference)
      )}
    </View>
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
    marginBottom: 16,
    color: '#333',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 40,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 16,
    lineHeight: 22,
  },
  switchContainer: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  preferenceValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default UserPreferencesCard;