import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect, useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import ContextMenuButton from '@/components/ui/ContextMenuButton';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserPrayers, setFilters, selectFilters } from '@/store/userPrayersSlice';
import {
  fetchPrayerSubjects,
  selectPrayerSubjects,
  selectPrayerSubjectsState,
} from '@/store/prayerSubjectsSlice';
import { RootState } from '@/store/store';

import LoadingModal from '@/components/ui/LoadingModal';
import PrayerSessionModal from '@/components/PrayerSession/PrayerSessionModal';
import FilterModal, { FilterOptions } from '@/components/Search/FilterModal';
import { ContactCardList } from '@/components/Contacts';

import type { PrayerSubject } from '@/util/shared.types';

type RootStackParamList = {
  PrayerModal: { mode: string; prayerSubjectId?: number };
  AddPrayerCardModal: undefined;
  ContactDetail: { contact: string }; // Serialized PrayerSubject
};

export default function Cards() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state: RootState) => state.auth);

  const prayerSubjects = useAppSelector(selectPrayerSubjects);
  const { status: subjectsStatus, error: subjectsError } = useAppSelector(
    selectPrayerSubjectsState
  );

  const filters = useAppSelector(selectFilters);

  const [refreshing, setRefreshing] = useState(false);
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const fetchData = useCallback(() => {
    dispatch(fetchPrayerSubjects());
    dispatch(fetchUserPrayers());
  }, [dispatch]);

  useFocusEffect(fetchData);

  // Register tab bar add button handler when this screen is focused
  useFocusEffect(
    useCallback(() => {
      global.tabBarAddVisible = true;
      global.tabBarAddHandler = () => {
        navigation.navigate('PrayerModal', { mode: 'add' });
      };
      return () => {
        // Cleanup when screen loses focus
        global.tabBarAddHandler = null;
      };
    }, [navigation])
  );

  // Restore header when this screen gains focus (after navigating back from ContactDetail)
  useFocusEffect(
    useCallback(() => {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: 'Prayer Cards',
          headerLeft: null,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <Pressable
                onPress={() => setSearchVisible((prev) => !prev)}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <Ionicons name='search' size={20} color='#2d3e31' />
              </Pressable>
              <ContextMenuButton
                type='cards'
                prayerCount={prayerSubjects?.flatMap(s => s.prayers).length || 0}
                iconSize={20}
              />
            </View>
          ),
        });
      }
    }, [navigation, prayerSubjects])
  );

  // Expose functions to global for tab layout to access
  useLayoutEffect(() => {
    (global as any).cardsSetPrayerSessionVisible = setPrayerSessionVisible;
    (global as any).cardsToggleSearch = () => setSearchVisible((prev) => !prev);
    return () => {
      (global as any).cardsToggleSearch = null;
    };
  }, []);

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await dispatch(fetchPrayerSubjects());
      await dispatch(fetchUserPrayers());
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleContactPress = (contact: PrayerSubject) => {
    navigation.navigate('ContactDetail', { contact: JSON.stringify(contact) });
  };

  const handleContactLongPress = (contact: PrayerSubject) => {
    // TODO: Show action sheet for edit/delete
    console.log('Contact long pressed:', contact.prayerSubjectDisplayName);
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    dispatch(setFilters(newFilters));
  };

  // Collect all prayers from subjects for prayer session
  const allPrayers = prayerSubjects?.flatMap((subject) => subject.prayers) || [];

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <LoadingModal
        visible={subjectsStatus === 'loading'}
        message='Loading contacts...'
        onClose={() => {}}
      />
      <PrayerSessionModal
        visible={prayerSessionVisible}
        prayers={allPrayers}
        currentUserId={user?.userProfileId || 0}
        onClose={() => setPrayerSessionVisible(false)}
        contextTitle="Personal Prayers"
      />
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        availableUsers={[]}
      />
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
        {subjectsError && <Text style={styles.text}>Error: {subjectsError}</Text>}
        <ContactCardList
          contacts={prayerSubjects || []}
          currentUserId={user?.userProfileId}
          onContactPress={handleContactPress}
          onContactLongPress={handleContactLongPress}
          onRefresh={onRefresh}
          refreshing={refreshing}
          searchVisible={searchVisible}
          showFilters={true}
          emptyMessage="No prayer contacts yet. Tap + to add someone you're praying for!"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: '#ccf0ccff',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 50,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  text: {
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
});
