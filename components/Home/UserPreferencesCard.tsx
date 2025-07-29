import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { getUserPreferences, updateUserPreference } from '../../util/userPreferences';
import { UserPreference } from '../../util/userPreferences.types';

const UserPreferencesCard = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
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
      const result = await getUserPreferences(token, user.userProfileId);
      
      if (result.success) {
        // Handle the API response structure - data.preferences contains the array
        const preferencesArray = result.data?.preferences || result.data || [];
        setPreferences(preferencesArray);
      } else {
        Alert.alert('Error', 'Failed to load preferences');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (preference: UserPreference, newValue: string) => {
    if (!user || !token) return;

    try {
      const result = await updateUserPreference(
        token,
        user.userProfileId,
        preference.userPreferenceId,
        {
          preferenceKey: preference.preferenceKey,
          preferenceValue: newValue,
          isActive: preference.isActive,
        }
      );

      if (result.success) {
        setPreferences(prev =>
          prev.map(p =>
            p.userPreferenceId === preference.userPreferenceId
              ? { ...p, preferenceValue: newValue }
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

  const getPreferenceDisplay = (key: string) => {
    switch (key) {
      case 'theme':
        return 'Dark Theme';
      case 'notifications':
        return 'Push Notifications';
      default:
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  const renderPreference = (preference: UserPreference) => {
    const displayName = getPreferenceDisplay(preference.preferenceKey);
    
    if (preference.preferenceKey === 'theme') {
      return (
        <View key={preference.userPreferenceId} style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>{displayName}</Text>
          <Switch
            value={preference.preferenceValue === 'dark'}
            onValueChange={(value) => 
              updatePreference(preference, value ? 'dark' : 'light')
            }
            thumbColor={preference.preferenceValue === 'dark' ? '#white' : 'white'}
            trackColor={{ false: '#ccc', true: '#008000' }}
          />
        </View>
      );
    }
    
    if (preference.preferenceKey === 'notifications') {
      return (
        <View key={preference.userPreferenceId} style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>{displayName}</Text>
          <Switch
            value={preference.preferenceValue === 'true'}
            onValueChange={(value) => 
              updatePreference(preference, value ? 'true' : 'false')
            }
            thumbColor={preference.preferenceValue === 'true' ? '#white' : 'white'}
            trackColor={{ false: '#ccc', true: '#008000' }}
          />
        </View>
      );
    }

    return null;
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
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