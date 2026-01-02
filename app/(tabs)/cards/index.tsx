import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect, useNavigation, router } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import ContextMenuButton from '@/components/ui/ContextMenuButton';
import ProfileButton from '@/components/ui/ProfileButton';
import HeaderDropdown from '@/components/ui/HeaderDropdown';
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
import PrayerSourceSelectionModal from '@/components/PrayerSession/PrayerSourceSelectionModal';
import FilterModal, { FilterOptions } from '@/components/Search/FilterModal';
import { ContactCardList } from '@/components/Contacts';
import { PrayerList } from '@/components/PrayerCards';

import type { PrayerSubject } from '@/util/shared.types';

type ViewMode = 'contact' | 'prayer';

const VIEW_MODE_OPTIONS = [
  { value: 'prayer', label: 'Prayer Cards' },
  { value: 'contact', label: 'Contact Cards' },
];

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
  const [sourceSelectionVisible, setSourceSelectionVisible] = useState(false);
  const [sessionPrayers, setSessionPrayers] = useState<any[]>([]);
  const [sessionContextTitle, setSessionContextTitle] = useState('Personal Prayers');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('prayer');

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
          headerTitle: () => (
            <HeaderDropdown
              options={VIEW_MODE_OPTIONS}
              selectedValue={viewMode}
              onSelect={(value) => setViewMode(value as ViewMode)}
            />
          ),
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
                onPress={() => {
                  // Header button starts directly with all personal prayers
                  setSessionPrayers(allPrayers);
                  setSessionContextTitle('Personal Prayers');
                  setPrayerSessionVisible(true);
                }}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <Text style={{ fontSize: 18 }}>🙏</Text>
              </Pressable>
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
    }, [navigation, prayerSubjects, user, viewMode])
  );

  // Expose functions to global for tab layout to access
  useLayoutEffect(() => {
    // Context menu uses source selection modal
    (global as any).cardsSetPrayerSessionVisible = setSourceSelectionVisible;
    (global as any).cardsToggleSearch = () => setSearchVisible((prev) => !prev);
    return () => {
      (global as any).cardsSetPrayerSessionVisible = null;
      (global as any).cardsToggleSearch = null;
    };
  }, []);

  // Handle starting session from source selection
  const handleStartSession = (prayers: any[], contextTitle: string) => {
    setSessionPrayers(prayers);
    setSessionContextTitle(contextTitle);
    setPrayerSessionVisible(true);
  };

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
      <PrayerSourceSelectionModal
        visible={sourceSelectionVisible}
        onClose={() => setSourceSelectionVisible(false)}
        onStartSession={handleStartSession}
      />
      <PrayerSessionModal
        visible={prayerSessionVisible}
        prayers={sessionPrayers.length > 0 ? sessionPrayers : allPrayers}
        currentUserId={user?.userProfileId || 0}
        onClose={() => {
          setPrayerSessionVisible(false);
          setSessionPrayers([]);
        }}
        contextTitle={sessionContextTitle}
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
  text: {
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
});
