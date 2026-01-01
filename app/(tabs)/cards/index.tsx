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
import { useFocusEffect, useNavigation, router } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import ContextMenuButton from '@/components/ui/ContextMenuButton';
import ProfileButton from '@/components/ui/ProfileButton';
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
import { PrayerList } from '@/components/PrayerCards';

import type { PrayerSubject } from '@/util/shared.types';

type ViewMode = 'contact' | 'prayer';

type RootStackParamList = {
  PrayerModal: { mode: string; prayerSubjectId?: number };
  AddPrayerCardModal: undefined;
  ContactDetail: { contact: string }; // Serialized PrayerSubject
};

export default function Cards() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const { user, token } = useAppSelector((state: RootState) => state.auth);

  const prayerSubjects = useAppSelector(selectPrayerSubjects);
  const { status: subjectsStatus, error: subjectsError } = useAppSelector(
    selectPrayerSubjectsState
  );

  const filters = useAppSelector(selectFilters);

  const [refreshing, setRefreshing] = useState(false);
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('contact');

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
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <ContextMenuButton
                type='cards'
                prayerCount={prayerSubjects?.flatMap(s => s.prayers).length || 0}
                iconSize={18}
                buttonSize={36}
              />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <Pressable
                onPress={() => setSearchVisible((prev) => !prev)}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <Ionicons name='search' size={18} color='#2d3e31' />
              </Pressable>
              <ProfileButton
                firstName={user?.firstName || ''}
                lastName={user?.lastName || ''}
                onPress={() => router.navigate('/userProfile')}
              />
            </View>
          ),
        });
      }
    }, [navigation, prayerSubjects, user])
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

        {/* View Mode Segmented Control */}
        <View style={styles.segmentedControlContainer}>
          <View style={styles.segmentedControl}>
            <Pressable
              onPress={() => setViewMode('contact')}
              style={[
                styles.segmentButton,
                styles.segmentButtonLeft,
                viewMode === 'contact' && styles.segmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  viewMode === 'contact' && styles.segmentButtonTextActive,
                ]}
              >
                Contacts
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('prayer')}
              style={[
                styles.segmentButton,
                styles.segmentButtonRight,
                viewMode === 'prayer' && styles.segmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  viewMode === 'prayer' && styles.segmentButtonTextActive,
                ]}
              >
                Prayers
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Contact View */}
        {viewMode === 'contact' && (
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
        )}

        {/* Prayer View */}
        {viewMode === 'prayer' && (
          <PrayerList
            subjects={prayerSubjects || []}
            currentUserId={user?.userProfileId}
            userToken={token || undefined}
            onRefresh={onRefresh}
            refreshing={refreshing}
            searchVisible={searchVisible}
            showFilters={true}
            emptyMessage="No prayers yet. Tap + to add a prayer request!"
            onContactPress={handleContactPress}
          />
        )}
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
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 36,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  headerLeftContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
    marginRight: 12,
  },
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  segmentButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#2E7D32',
  },
  segmentButtonLeft: {
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
  },
  segmentButtonRight: {
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
  },
  segmentButtonText: {
    color: '#2d3e31',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  segmentedControl: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(46, 125, 50, 0.3)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segmentedControlContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
});
