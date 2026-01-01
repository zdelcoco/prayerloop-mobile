import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  Dimensions,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { fetchGroupPrayers } from '@/store/groupPrayersSlice';
import { fetchPrayerSubjects, selectPrayerSubjects } from '@/store/prayerSubjectsSlice';
import { selectUserGroups } from '@/store/groupsSlice';
import { BlurView } from 'expo-blur';

import PrayerDetailModal from '@/components/PrayerCards/PrayerDetailModal';
import PrayerSessionModal from '@/components/PrayerSession/PrayerSessionModal';
import { groupUsersCache } from '@/util/groupUsersCache';
import { createPrayerSubject as createPrayerSubjectAPI } from '@/util/prayerSubjects';

import type { Group, Prayer, User, PrayerSubject } from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

type RootStackParamList = {
  CircleDetail: { group: string };
  EditCircle: { group: string };
  PrayerModal: { mode: string; groupProfileId: number; groupName: string };
  UsersModal: { groupProfileId: number; groupName: string; groupCreatorId: string };
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Section type for grouping prayers by prayer subject (who the prayer is FOR)
interface PrayerSection {
  subjectId: number;
  subjectName: string;
  submitter: User | null; // Who submitted the prayers (for avatar/display)
  prayers: Prayer[];
}

// Generate initials from name
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return (first + last).toUpperCase() || '??';
};

// Generate a consistent color based on the name
const getAvatarColor = (name: string): string => {
  const colors = [
    '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
    '#00BCD4', '#E91E63', '#607D8B', '#795548',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export default function CircleDetail() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CircleDetail'>>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  // Auth state
  const { user, token } = useAppSelector((state: RootState) => state.auth);

  // Group prayers from Redux
  const { prayers, status } = useAppSelector((state: RootState) => state.groupPrayers);

  // Prayer subjects from Redux
  const prayerSubjects = useAppSelector(selectPrayerSubjects);

  // Groups from Redux
  const groups = useAppSelector(selectUserGroups);

  // Prayer detail modal state
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);

  // Prayer session modal state
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);

  // Members state
  const [members, setMembers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Search state
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  type FilterType = 'all' | 'active' | 'answered';
  const [filter, setFilter] = useState<FilterType>('all');

  // Parse group from route params as fallback, but prefer Redux store data
  const routeGroup: Group = useMemo(() => JSON.parse(route.params.group), [route.params.group]);
  const group: Group = useMemo(() => {
    // Look up the current group data from Redux store (updated after edits)
    const storeGroup = groups?.find(g => g.groupId === routeGroup.groupId);
    return storeGroup || routeGroup;
  }, [groups, routeGroup]);

  // Calculate gradient end point based on header height
  const headerGradientEnd = headerHeight / SCREEN_HEIGHT;

  // Create a lookup map for members by userProfileId
  const membersLookup = useMemo(() => {
    const lookup: { [id: number]: User } = {};
    members.forEach(m => {
      lookup[m.userProfileId] = m;
    });
    return lookup;
  }, [members]);

  // Group prayers by prayer subject (who the prayer is FOR)
  const sections = useMemo<PrayerSection[]>(() => {
    if (!prayers || prayers.length === 0) return [];

    // Group prayers by prayer subject
    const grouped: { [subjectId: number]: { subjectName: string; prayers: Prayer[] } } = {};

    prayers.forEach(prayer => {
      // Use prayer subject info directly from the prayer object (returned by API)
      if (prayer.prayerSubjectId && prayer.prayerSubjectDisplayName) {
        const subjectId = prayer.prayerSubjectId;
        const subjectName = prayer.prayerSubjectDisplayName;
        if (!grouped[subjectId]) {
          grouped[subjectId] = { subjectName, prayers: [] };
        }
        grouped[subjectId].prayers.push(prayer);
      } else {
        // Fallback: no subject found, group by creator as "Unknown Subject"
        // Use negative createdBy to avoid collision with real subject IDs
        const fallbackId = -prayer.createdBy;
        const creator = membersLookup[prayer.createdBy];
        const fallbackName = creator
          ? `${creator.firstName} ${creator.lastName}`
          : 'Unknown';

        if (!grouped[fallbackId]) {
          grouped[fallbackId] = { subjectName: fallbackName, prayers: [] };
        }
        grouped[fallbackId].prayers.push(prayer);
      }
    });

    // Convert to sections array
    const result: PrayerSection[] = [];

    Object.entries(grouped).forEach(([subjectIdStr, data]) => {
      const subjectId = parseInt(subjectIdStr, 10);

      // Sort prayers: active first, then by date
      const sortedPrayers = [...data.prayers].sort((a, b) => {
        if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1;
        return new Date(b.datetimeCreate).getTime() - new Date(a.datetimeCreate).getTime();
      });

      // Get submitter info from the first prayer's creator
      const firstCreatorId = sortedPrayers[0]?.createdBy;
      const submitter = firstCreatorId ? membersLookup[firstCreatorId] || null : null;

      result.push({
        subjectId,
        subjectName: data.subjectName,
        submitter,
        prayers: sortedPrayers,
      });
    });

    // Sort sections by subject name
    result.sort((a, b) => a.subjectName.toLowerCase().localeCompare(b.subjectName.toLowerCase()));

    return result;
  }, [prayers, membersLookup]);

  // Filter sections by search query and active/answered filter
  const filteredSections = useMemo(() => {
    let result = sections;

    // Apply active/answered filter
    if (filter !== 'all') {
      result = result.map(section => {
        const filteredPrayers = section.prayers.filter(prayer =>
          filter === 'active' ? !prayer.isAnswered : prayer.isAnswered
        );
        return { ...section, prayers: filteredPrayers };
      }).filter(section => section.prayers.length > 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(section => {
        // Match on subject name
        if (section.subjectName.toLowerCase().includes(query)) return true;
        // Match on any prayer title or description
        return section.prayers.some(
          prayer =>
            prayer.title.toLowerCase().includes(query) ||
            prayer.prayerDescription.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [sections, searchQuery, filter]);

  // Fetch members
  useFocusEffect(
    useCallback(() => {
      const fetchMembers = async () => {
        if (!token) return;
        try {
          const users = await groupUsersCache.fetchGroupUsers(token, group.groupId);
          setMembers(users);
        } catch (error) {
          console.error('Failed to fetch members:', error);
        }
      };
      fetchMembers();
    }, [group.groupId, token])
  );

  // Fetch group prayers
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchGroupPrayers(group.groupId));
    }, [dispatch, group.groupId])
  );

  // Hide tab bar when focused
  useFocusEffect(
    useCallback(() => {
      global.tabBarHidden = true;
      global.tabBarAddVisible = false;
      return () => {
        global.tabBarHidden = false;
        global.tabBarAddVisible = true;
      };
    }, [])
  );

  // Set up custom header - edit button only, no add button
  useFocusEffect(
    useCallback(() => {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: group.groupName,
          headerLeft: () => (
            <Pressable
              style={({ pressed }) => [
                styles.headerButton,
                { paddingRight: 2, marginLeft: 16, marginRight: 12 },
                pressed && styles.headerButtonPressed,
              ]}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome name='angle-left' size={22} color={DARK_TEXT} />
            </Pressable>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
                onPress={() => setPrayerSessionVisible(true)}
              >
                <Text style={{ fontSize: 18 }}>🙏</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
                onPress={() => setSearchVisible(prev => !prev)}
              >
                <Ionicons name='search' size={18} color={DARK_TEXT} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
                onPress={() => {
                  navigation.navigate('EditCircle', {
                    group: JSON.stringify(group),
                  });
                }}
              >
                <FontAwesome name='pencil' size={18} color={DARK_TEXT} />
              </Pressable>
            </View>
          ),
        });
      }
    }, [navigation, group, searchVisible])
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      groupUsersCache.clear();
      const users = await groupUsersCache.fetchGroupUsers(token || '', group.groupId);
      setMembers(users);
      await dispatch(fetchGroupPrayers(group.groupId));
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, group.groupId, token]);

  // Handle prayer press
  const handlePrayerPress = useCallback((prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setPrayerModalVisible(true);
  }, []);

  // Handle modal close
  const handleModalClose = () => {
    setPrayerModalVisible(false);
    setSelectedPrayer(null);
  };

  // Handle action complete
  const handleActionComplete = () => {
    dispatch(fetchGroupPrayers(group.groupId));
  };

  // Handle member press - navigate to contact detail or create prayer_subject
  const handleMemberPress = useCallback(async (member: User) => {
    if (!token || !user) return;

    // Check if a prayer_subject already exists for this user
    const existingSubject = prayerSubjects?.find(
      s => s.userProfileId === member.userProfileId
    );

    if (existingSubject) {
      // Navigate to existing contact detail (stay within groups tab)
      router.push({
        pathname: '/(tabs)/groups/ContactDetail',
        params: { contact: JSON.stringify(existingSubject) },
      });
    } else {
      // Create a new prayer_subject linked to this user
      try {
        const result = await createPrayerSubjectAPI(token, user.userProfileId, {
          prayerSubjectType: 'individual',
          prayerSubjectDisplayName: `${member.firstName} ${member.lastName}`,
          userProfileId: member.userProfileId,
        });

        if (result.success && result.data) {
          // Refresh prayer subjects to get the new one
          await dispatch(fetchPrayerSubjects());

          // Navigate to the new contact detail (stay within groups tab)
          router.push({
            pathname: '/(tabs)/groups/ContactDetail',
            params: { contact: JSON.stringify(result.data) },
          });
        } else {
          Alert.alert('Error', 'Failed to create prayer card for this member.');
        }
      } catch (error) {
        console.error('Error creating prayer subject:', error);
        Alert.alert('Error', 'Failed to create prayer card for this member.');
      }
    }
  }, [token, user, prayerSubjects, dispatch]);

  // Handle FAB press - open new prayer modal (stay within groups tab)
  const handleAddPrayer = useCallback(() => {
    router.push({
      pathname: '/(tabs)/groups/PrayerModal',
      params: {
        mode: 'add',
        preselectedCircleId: group.groupId.toString(),
        preselectedCircleName: group.groupName,
      },
    });
  }, [group]);

  // Render section header (prayer subject info - who the prayer is FOR)
  const renderSectionHeader = useCallback((subjectName: string, prayerCount: number) => {
    // Parse subject name for initials (handle "First Last" format)
    const nameParts = subjectName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const initials = getInitials(firstName, lastName);
    const avatarColor = getAvatarColor(subjectName);

    return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAvatarContainer}>
          <View style={[styles.sectionAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.sectionAvatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.sectionHeaderText} numberOfLines={1}>
          Pray for {subjectName}
        </Text>
        <Text style={styles.prayerCount}>
          {prayerCount} prayer{prayerCount !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  }, []);

  // Render prayer item
  const renderPrayerItem = useCallback((
    prayer: Prayer,
    creator: User,
    index: number,
    totalCount: number
  ) => {
    const isFirst = index === 0;
    const isLast = index === totalCount - 1;
    const initials = getInitials(creator.firstName, creator.lastName);
    const avatarColor = getAvatarColor(`${creator.firstName} ${creator.lastName}`);

    return (
      <Pressable
        key={prayer.prayerId}
        onPress={() => handlePrayerPress(prayer)}
        style={({ pressed }) => [
          styles.prayerItem,
          isFirst && styles.prayerItemFirst,
          isLast && styles.prayerItemLast,
          !isLast && styles.prayerItemBorder,
          pressed && styles.prayerItemPressed,
        ]}
      >
        {/* Prayer Header */}
        <View style={styles.prayerHeader}>
          <Text style={styles.prayerTitle} numberOfLines={2}>
            {prayer.title}
          </Text>
          {prayer.isAnswered && (
            <View style={styles.answeredBadge}>
              <FontAwesome name="check" size={10} color="#FFFFFF" />
            </View>
          )}
          <FontAwesome
            name="chevron-right"
            size={12}
            color={SUBTLE_TEXT}
            style={styles.prayerChevron}
          />
        </View>

        {/* Prayer Description */}
        <Text style={styles.prayerDescription} numberOfLines={3}>
          {prayer.prayerDescription}
        </Text>

        {/* Footer: Submitter avatar + name + date */}
        <View style={styles.prayerFooter}>
          <View style={[styles.submitterAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.submitterAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.submitterName}>
            {creator.firstName} {creator.lastName?.[0]}.
          </Text>
          <Text style={styles.dateText}>
            · {formatDate(prayer.datetimeCreate)}
            {prayer.isAnswered && prayer.datetimeAnswered && (
              <Text style={styles.answeredDate}>
                {' · Answered '}{formatDate(prayer.datetimeAnswered)}
              </Text>
            )}
          </Text>
        </View>
      </Pressable>
    );
  }, [handlePrayerPress]);

  // Render a complete section
  const renderSection = useCallback(({ item }: { item: PrayerSection }) => {
    return (
      <View style={styles.sectionContainer}>
        {/* Section Header */}
        {renderSectionHeader(item.subjectName, item.prayers.length)}

        {/* Prayer List */}
        <View>
          {item.prayers.map((prayer, index) => {
            // Get the creator for this specific prayer (for footer display)
            const creator = membersLookup[prayer.createdBy] || {
              userProfileId: prayer.createdBy,
              firstName: 'Unknown',
              lastName: 'User',
              email: '',
            } as User;
            return renderPrayerItem(prayer, creator, index, item.prayers.length);
          })}
        </View>
      </View>
    );
  }, [renderSectionHeader, renderPrayerItem, membersLookup]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="comments-o" size={48} color={SUBTLE_TEXT} />
      <Text style={styles.emptyTitle}>No Prayers Yet</Text>
      <Text style={styles.emptyText}>
        Be the first to share a prayer request with your circle!
      </Text>
    </View>
  );

  // Render header component (description like notes style)
  const ListHeader = useMemo(() => (
    <View style={styles.listHeader}>
      {/* Search Bar */}
      {searchVisible && (
        <>
          <View style={styles.searchContainer}>
            <BlurView intensity={60} tint="light" style={styles.searchBlur}>
              <FontAwesome
                name="search"
                size={16}
                color={SUBTLE_TEXT}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search prayers..."
                placeholderTextColor={SUBTLE_TEXT}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <FontAwesome name="times-circle" size={16} color={SUBTLE_TEXT} />
                </Pressable>
              )}
            </BlurView>
          </View>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <Pressable
              onPress={() => setFilter('all')}
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            >
              <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
                All
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('active')}
              style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
            >
              <Text style={[styles.filterButtonText, filter === 'active' && styles.filterButtonTextActive]}>
                Active
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('answered')}
              style={[styles.filterButton, filter === 'answered' && styles.filterButtonActive]}
            >
              <Text style={[styles.filterButtonText, filter === 'answered' && styles.filterButtonTextActive]}>
                Answered
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Description - displayed like notes (not in a section card) */}
      {group.groupDescription && (
        <Text style={styles.notesSubtitle}>{group.groupDescription}</Text>
      )}

      {/* Section divider */}
      <View style={styles.sectionDivider}>
        <Text style={styles.sectionDividerText}>Prayer Requests</Text>
        <View style={styles.sectionDividerLine} />
      </View>
    </View>
  ), [group.groupDescription, searchVisible, searchQuery, filter]);

  // Render footer component (members section at bottom)
  const ListFooter = useMemo(() => (
    <View style={styles.listFooter}>
      {/* Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionLabelContainer}>
          <Text style={styles.sectionLabel}>Members</Text>
          <View style={styles.sectionLabelLine} />
        </View>
        <View style={styles.sectionCard}>
          {members.length > 0 ? (
            members.map((member, index) => {
              const isFirst = index === 0;
              const isLast = index === members.length - 1;
              const initials = getInitials(member.firstName, member.lastName);
              const avatarColor = getAvatarColor(`${member.firstName} ${member.lastName}`);

              return (
                <Pressable
                  key={member.userProfileId}
                  style={({ pressed }) => [
                    styles.memberItem,
                    isFirst && styles.memberItemFirst,
                    isLast && styles.memberItemLast,
                    !isLast && styles.memberItemBorder,
                    pressed && styles.memberItemPressed,
                  ]}
                  onPress={() => handleMemberPress(member)}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.memberInitials}>{initials}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.firstName} {member.lastName}
                    </Text>
                    {member.userProfileId === group.createdBy && (
                      <Text style={styles.memberRole}>Creator</Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={SUBTLE_TEXT}
                    style={styles.memberChevron}
                  />
                </Pressable>
              );
            })
          ) : (
            <View style={styles.sectionCardSingle}>
              <Text style={styles.emptyMemberText}>No members yet.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom padding for scroll */}
      <View style={styles.bottomPadding} />
    </View>
  ), [members, group.createdBy, handleMemberPress]);

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        {filteredSections.length === 0 && status !== 'loading' ? (
          <View style={styles.emptyWrapper}>
            {ListHeader}
            {renderEmptyState()}
            {ListFooter}
          </View>
        ) : (
          <FlatList
            data={filteredSections}
            keyExtractor={(item) => item.subjectId.toString()}
            renderItem={renderSection}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={ACTIVE_GREEN}
                colors={[ACTIVE_GREEN]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Action Button for adding prayers */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 20 },
          pressed && styles.fabPressed,
        ]}
        onPress={handleAddPrayer}
      >
        <FontAwesome name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      {/* Prayer Detail Modal */}
      {selectedPrayer && (
        <PrayerDetailModal
          visible={prayerModalVisible}
          userId={user?.userProfileId || 0}
          userToken={token || ''}
          prayer={selectedPrayer}
          prayerSubjectId={selectedPrayer.prayerSubjectId}
          onClose={handleModalClose}
          onActionComplete={handleActionComplete}
          onShare={() => {}}
          context='groups'
        />
      )}

      {/* Prayer Session Modal */}
      <PrayerSessionModal
        visible={prayerSessionVisible}
        prayers={(prayers || []).filter(p => !p.isAnswered)}
        currentUserId={user?.userProfileId || 0}
        usersLookup={membersLookup}
        onClose={() => setPrayerSessionVisible(false)}
        contextTitle={group.groupName}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  answeredBadge: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginLeft: 8,
    width: 20,
  },
  answeredDate: {
    color: ACTIVE_GREEN,
  },
  bottomPadding: {
    height: 100,
  },
  clearButton: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  dateText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyMemberText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    fontStyle: 'italic',
    paddingVertical: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 18,
    marginTop: 16,
  },
  emptyWrapper: {
    flex: 1,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 28,
    elevation: 6,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 56,
  },
  fabPressed: {
    backgroundColor: '#1B5E20',
    transform: [{ scale: 0.95 }],
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: ACTIVE_GREEN,
  },
  filterButtonText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: MUTED_GREEN,
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
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  listFooter: {
    marginTop: 16,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  memberAvatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  memberChevron: {
    marginLeft: 'auto',
  },
  memberInfo: {
    flex: 1,
  },
  memberInitials: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  memberItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  memberItemBorder: {
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  memberItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  memberItemPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
  },
  memberName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  memberRole: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  notesSubtitle: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  prayerChevron: {
    marginLeft: 8,
  },
  prayerCount: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginLeft: 'auto',
  },
  prayerDescription: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  prayerFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  prayerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  prayerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  prayerItemBorder: {
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  prayerItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  prayerItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  prayerItemPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
  },
  prayerTitle: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionAvatar: {
    alignItems: 'center',
    borderRadius: 22,
    elevation: 2,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 44,
  },
  sectionAvatarContainer: {
    marginRight: 12,
  },
  sectionAvatarText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    letterSpacing: 1,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionCardSingle: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBlur: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchContainer: {
    paddingBottom: 8,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    paddingVertical: 0,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
    marginTop: 8,
  },
  sectionDividerLine: {
    backgroundColor: 'rgba(45, 62, 49, 0.2)',
    flex: 1,
    height: StyleSheet.hairlineWidth,
    marginLeft: 12,
  },
  sectionDividerText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  sectionLabel: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionLabelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  sectionLabelLine: {
    backgroundColor: 'rgba(45, 62, 49, 0.2)',
    flex: 1,
    height: StyleSheet.hairlineWidth,
    marginLeft: 12,
  },
  submitterAvatar: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginRight: 6,
    width: 24,
  },
  submitterAvatarText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 10,
  },
  submitterName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 13,
    marginRight: 4,
  },
});
