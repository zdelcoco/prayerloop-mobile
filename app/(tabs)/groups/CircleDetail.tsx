import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
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
  Share,
  Keyboard,
  Modal,
  ScrollView,
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
import HeaderTitleActionDropdown, { ActionOption } from '@/components/ui/HeaderTitleActionDropdown';
import { groupUsersCache } from '@/util/groupUsersCache';
import { createPrayerSubject as createPrayerSubjectAPI, updatePrayerSubject } from '@/util/prayerSubjects';
import { createGroupInvite } from '@/util/createGroupInvite';

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

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Max width for header title (screen width minus back button, right buttons, and padding)
const HEADER_TITLE_MAX_WIDTH = SCREEN_WIDTH - 220;

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

  // Compute active prayers for session button state
  const activePrayers = useMemo(() => (prayers || []).filter(p => !p.isAnswered), [prayers]);

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

  // Contact picker modal state (for selecting existing or creating new contact)
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const [pendingMember, setPendingMember] = useState<User | null>(null);
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  // Track if navigating to a modal (to prevent tab bar flash)
  const isNavigatingToModal = useRef(false);

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

  // Create a lookup map for the current user's custom display names
  // Maps linked userProfileId -> user's custom display name from their contact cards
  const myDisplayNamesLookup = useMemo(() => {
    const lookup: { [userProfileId: number]: string } = {};
    if (prayerSubjects) {
      prayerSubjects.forEach(subject => {
        // Only include linked subjects (where userProfileId is set)
        if (subject.userProfileId && subject.linkStatus === 'linked') {
          lookup[subject.userProfileId] = subject.prayerSubjectDisplayName;
        }
      });
    }
    return lookup;
  }, [prayerSubjects]);

  // Create a modified members lookup that uses custom display names when available
  // This is passed to PrayerCard/PrayerDetailModal so "Created by X" shows custom names
  const membersLookupWithCustomNames = useMemo(() => {
    const lookup: { [id: number]: User } = {};
    members.forEach(m => {
      const customName = myDisplayNamesLookup[m.userProfileId];
      if (customName) {
        // Override with custom name (put full name in firstName, clear lastName)
        lookup[m.userProfileId] = { ...m, firstName: customName, lastName: '' };
      } else {
        lookup[m.userProfileId] = m;
      }
    });
    return lookup;
  }, [members, myDisplayNamesLookup]);

  // Group prayers by prayer subject (who the prayer is FOR)
  // When a prayer subject is linked to a Prayerloop user, group by that user's ID
  // This ensures prayers for the same person are grouped together even if created by different users
  const sections = useMemo<PrayerSection[]>(() => {
    if (!prayers || prayers.length === 0) return [];

    // Use string keys to handle different ID types, then convert to numbers for sections
    // Key format: "linked:{userId}" or "subject:{subjectId}" or "fallback:{createdBy}"
    const grouped: { [key: string]: { subjectName: string; prayers: Prayer[]; linkedUserId?: number } } = {};

    prayers.forEach(prayer => {
      if (prayer.prayerSubjectId && prayer.prayerSubjectDisplayName) {
        // If the prayer subject is linked to a Prayerloop user, group by linked user ID
        // This ensures all prayers for the same person are grouped together
        const linkedUserId = prayer.prayerSubjectUserProfileId;
        const groupKey = linkedUserId
          ? `linked:${linkedUserId}`
          : `subject:${prayer.prayerSubjectId}`;
        // Prefer the current user's custom display name for this person, fall back to prayer's subject name
        const subjectName = (linkedUserId && myDisplayNamesLookup[linkedUserId])
          ? myDisplayNamesLookup[linkedUserId]
          : prayer.prayerSubjectDisplayName;

        if (!grouped[groupKey]) {
          grouped[groupKey] = { subjectName, prayers: [], linkedUserId: linkedUserId || undefined };
        }
        grouped[groupKey].prayers.push(prayer);
      } else {
        // Fallback: no subject found, group by creator as "Unknown Subject"
        const fallbackKey = `fallback:${prayer.createdBy}`;
        // Prefer the current user's custom name for this creator
        const fallbackName = myDisplayNamesLookup[prayer.createdBy]
          || (membersLookup[prayer.createdBy]
            ? `${membersLookup[prayer.createdBy].firstName} ${membersLookup[prayer.createdBy].lastName}`
            : 'Unknown');

        if (!grouped[fallbackKey]) {
          grouped[fallbackKey] = { subjectName: fallbackName, prayers: [] };
        }
        grouped[fallbackKey].prayers.push(prayer);
      }
    });

    // Convert to sections array
    const result: PrayerSection[] = [];

    // Large offset to distinguish unlinked prayer subject IDs from linked user IDs
    const SUBJECT_ID_OFFSET = 1000000000;

    Object.entries(grouped).forEach(([groupKey, data]) => {
      // Parse the group key to get a numeric subjectId
      // Format: "linked:{userId}" | "subject:{subjectId}" | "fallback:{createdBy}"
      let subjectId: number;
      if (groupKey.startsWith('linked:')) {
        // Use linked user ID directly
        subjectId = parseInt(groupKey.substring(7), 10);
      } else if (groupKey.startsWith('subject:')) {
        // Use prayer subject ID with offset to avoid collision with user IDs
        subjectId = parseInt(groupKey.substring(8), 10) + SUBJECT_ID_OFFSET;
      } else {
        // Fallback: use negative creator ID
        subjectId = -parseInt(groupKey.substring(9), 10);
      }

      // Sort prayers: active first, then by date
      const sortedPrayers = [...data.prayers].sort((a, b) => {
        if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1;
        return new Date(b.datetimeCreate).getTime() - new Date(a.datetimeCreate).getTime();
      });

      // Get submitter info: prefer the linked user if available, otherwise use first prayer's creator
      let submitter: User | null = null;
      if (data.linkedUserId) {
        submitter = membersLookup[data.linkedUserId] || null;
      }
      if (!submitter) {
        const firstCreatorId = sortedPrayers[0]?.createdBy;
        submitter = firstCreatorId ? membersLookup[firstCreatorId] || null : null;
      }

      result.push({
        subjectId,
        subjectName: data.subjectName,
        submitter,
        prayers: sortedPrayers,
      });
    });

    // Sort sections by subject name, but keep current user's section at the bottom
    const currentUserId = user?.userProfileId;
    result.sort((a, b) => {
      // Current user's section always goes to the bottom
      const aIsCurrentUser = a.subjectId === currentUserId;
      const bIsCurrentUser = b.subjectId === currentUserId;

      if (aIsCurrentUser && !bIsCurrentUser) return 1;  // a goes after b
      if (!aIsCurrentUser && bIsCurrentUser) return -1; // a goes before b

      // Otherwise sort alphabetically
      return a.subjectName.toLowerCase().localeCompare(b.subjectName.toLowerCase());
    });

    return result;
  }, [prayers, membersLookup, myDisplayNamesLookup, user?.userProfileId]);

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

  // Handle add prayer - open new prayer modal (stay within groups tab)
  const handleAddPrayer = useCallback(() => {
    // Mark that we're navigating to a modal to prevent tab bar flash
    isNavigatingToModal.current = true;
    router.push({
      pathname: '/(tabs)/groups/PrayerModal',
      params: {
        mode: 'add',
        preselectedCircleId: group.groupId.toString(),
        preselectedCircleName: group.groupName,
      },
    });
  }, [group]);

  // Handle invite to circle - create invite link and share
  const handleInviteToCircle = useCallback(async () => {
    if (!token) return;

    try {
      const result = await createGroupInvite(token, group.groupId);
      if (result.success && result.data) {
        const inviteCode = result.data.inviteCode;
        const inviteLink = `prayerloop://join-group?code=${inviteCode}`;
        const message = `Join my prayer circle "${group.groupName}" on prayerloop!\n\nUse invite code: ${inviteCode}\n\nOr tap this link: ${inviteLink}`;

        await Share.share({
          message,
          title: `Join ${group.groupName} on prayerloop`,
        });
      } else {
        Alert.alert('Error', 'Failed to create invite link. Please try again.');
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      Alert.alert('Error', 'Failed to create invite link. Please try again.');
    }
  }, [token, group]);

  // Check if user can edit this circle
  const canEdit = user?.userProfileId === group.createdBy;

  // Build dropdown options dynamically based on permissions
  const circleActionOptions: ActionOption[] = useMemo(() => {
    const options: ActionOption[] = [];

    // Edit option (only if user is creator) - first in list
    if (canEdit) {
      options.push({ value: 'edit', label: 'Edit Circle', icon: 'pencil-outline' });
    }

    // Invite option - second
    options.push({ value: 'invite', label: 'Invite to Circle', icon: 'person-add-outline' });

    // Add prayer option - third
    options.push({ value: 'add_prayer', label: 'Add Prayer', icon: 'add-outline' });

    return options;
  }, [canEdit]);

  // Handle dropdown action selection
  const handleCircleAction = useCallback((value: string) => {
    if (value === 'edit') {
      navigation.navigate('EditCircle', {
        group: JSON.stringify(group),
      });
    } else if (value === 'add_prayer') {
      handleAddPrayer();
    } else if (value === 'invite') {
      handleInviteToCircle();
    }
  }, [handleAddPrayer, handleInviteToCircle, navigation, group]);

  // Hide tab bar when focused
  useFocusEffect(
    useCallback(() => {
      // Reset the modal navigation flag when we regain focus
      isNavigatingToModal.current = false;
      global.tabBarHidden = true;
      global.tabBarAddVisible = false;
      return () => {
        // Don't show tab bar if navigating to a modal (prevents flash)
        if (!isNavigatingToModal.current) {
          global.tabBarHidden = false;
          global.tabBarAddVisible = true;
        }
      };
    }, [])
  );

  // Set up custom header with dropdown
  useFocusEffect(
    useCallback(() => {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: () => (
            <HeaderTitleActionDropdown
              title={group.groupName}
              options={circleActionOptions}
              onSelect={handleCircleAction}
              maxWidth={HEADER_TITLE_MAX_WIDTH}
            />
          ),
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
                  pressed && activePrayers.length > 0 && styles.headerButtonPressed,
                  activePrayers.length === 0 && styles.headerButtonDisabled,
                ]}
                disabled={activePrayers.length === 0}
                onPress={() => {
                  if (activePrayers.length === 0) return;
                  setPrayerSessionVisible(true);
                }}
              >
                <Text style={{ fontSize: 18, opacity: activePrayers.length === 0 ? 0.4 : 1 }}>🙏</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.headerButton,
                  (pressed || searchVisible) && styles.headerButtonPressed,
                  searchVisible && styles.headerButtonActive,
                ]}
                onPress={() => setSearchVisible(prev => !prev)}
              >
                <Ionicons name='search' size={18} color={searchVisible ? '#FFFFFF' : DARK_TEXT} />
              </Pressable>
            </View>
          ),
        });
      }
    }, [navigation, group, searchVisible, handleCircleAction, activePrayers, circleActionOptions])
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

  // Handle member press - navigate to contact detail or show picker
  const handleMemberPress = useCallback((member: User) => {
    if (!token || !user) return;

    // Check if a prayer_subject already exists linked to this user's profile
    const linkedSubject = prayerSubjects?.find(
      s => s.userProfileId === member.userProfileId
    );

    if (linkedSubject) {
      // Navigate directly to existing linked contact
      router.push({
        pathname: '/(tabs)/groups/ContactDetail',
        params: { contact: JSON.stringify(linkedSubject) },
      });
    } else {
      // No linked contact - show picker to select existing or create new
      setPendingMember(member);
      setContactPickerVisible(true);
    }
  }, [token, user, prayerSubjects]);

  // Get contacts sorted with name matches first for the picker
  const sortedContactsForPicker = useMemo(() => {
    if (!prayerSubjects || !pendingMember) return [];

    const memberFullName = `${pendingMember.firstName} ${pendingMember.lastName}`.toLowerCase();
    // Filter to individual contacts that are NOT already linked to a user
    const individualContacts = prayerSubjects.filter(
      s => s.prayerSubjectType === 'individual' && !s.userProfileId
    );

    // Separate name matches from others
    const nameMatches: PrayerSubject[] = [];
    const others: PrayerSubject[] = [];

    individualContacts.forEach(contact => {
      const contactName = contact.prayerSubjectDisplayName.toLowerCase();
      // Check for exact or partial name match
      if (contactName === memberFullName ||
          contactName.includes(memberFullName) ||
          memberFullName.includes(contactName)) {
        nameMatches.push(contact);
      } else {
        others.push(contact);
      }
    });

    // Sort each group alphabetically
    nameMatches.sort((a, b) => a.prayerSubjectDisplayName.localeCompare(b.prayerSubjectDisplayName));
    others.sort((a, b) => a.prayerSubjectDisplayName.localeCompare(b.prayerSubjectDisplayName));

    return [...nameMatches, ...others];
  }, [prayerSubjects, pendingMember]);

  // Check if a contact is a name match for highlighting
  const isNameMatch = useCallback((contact: PrayerSubject) => {
    if (!pendingMember) return false;
    const memberFullName = `${pendingMember.firstName} ${pendingMember.lastName}`.toLowerCase();
    const contactName = contact.prayerSubjectDisplayName.toLowerCase();
    return contactName === memberFullName ||
           contactName.includes(memberFullName) ||
           memberFullName.includes(contactName);
  }, [pendingMember]);

  // Handle selecting an existing contact from the picker
  const handleSelectExistingContact = useCallback(async (contact: PrayerSubject) => {
    if (!token || !pendingMember) {
      setContactPickerVisible(false);
      setPendingMember(null);
      return;
    }

    setIsCreatingContact(true);
    try {
      // Link the existing contact to the pending member's user profile
      const result = await updatePrayerSubject(token, contact.prayerSubjectId, {
        userProfileId: pendingMember.userProfileId,
      });

      if (result.success) {
        // Refresh prayer subjects to get the updated link status
        await dispatch(fetchPrayerSubjects());

        // Update the contact object with the new linked user info
        const updatedContact: PrayerSubject = {
          ...contact,
          userProfileId: pendingMember.userProfileId,
          linkStatus: 'linked',
        };

        setContactPickerVisible(false);
        setPendingMember(null);

        router.push({
          pathname: '/(tabs)/groups/ContactDetail',
          params: { contact: JSON.stringify(updatedContact) },
        });
      } else {
        Alert.alert('Error', 'Failed to link contact to this member.');
      }
    } catch (error) {
      console.error('Error linking contact:', error);
      Alert.alert('Error', 'Failed to link contact to this member.');
    } finally {
      setIsCreatingContact(false);
    }
  }, [token, pendingMember, dispatch]);

  // Handle creating a new linked contact
  const handleCreateNewContact = useCallback(async () => {
    if (!token || !user || !pendingMember) return;

    setIsCreatingContact(true);
    try {
      const result = await createPrayerSubjectAPI(token, user.userProfileId, {
        prayerSubjectType: 'individual',
        prayerSubjectDisplayName: `${pendingMember.firstName} ${pendingMember.lastName}`,
        userProfileId: pendingMember.userProfileId,
      });

      if (result.success && result.data) {
        // Refresh prayer subjects to get the new one
        await dispatch(fetchPrayerSubjects());

        setContactPickerVisible(false);
        setPendingMember(null);

        // Navigate to the new contact detail
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
    } finally {
      setIsCreatingContact(false);
    }
  }, [token, user, pendingMember, dispatch]);

  // Handle closing the contact picker
  const handleCloseContactPicker = useCallback(() => {
    setContactPickerVisible(false);
    setPendingMember(null);
  }, []);

  // Render section header (prayer subject info - who the prayer is FOR)
  const renderSectionHeader = useCallback((subjectName: string, prayerCount: number, subjectId: number) => {
    // Check if this section is for the logged-in user
    const isCurrentUser = subjectId === user?.userProfileId;
    const headerText = isCurrentUser ? 'My Prayer Requests' : `Pray for ${subjectName}`;

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
          {headerText}
        </Text>
        <Text style={styles.prayerCount}>
          {prayerCount} prayer{prayerCount !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  }, [user?.userProfileId]);

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
        {renderSectionHeader(item.subjectName, item.prayers.length, item.subjectId)}

        {/* Prayer List */}
        <View>
          {item.prayers.map((prayer, index) => {
            // Get the creator for this specific prayer (for footer display)
            // Use membersLookupWithCustomNames to show user's custom names
            const creator = membersLookupWithCustomNames[prayer.createdBy] || {
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
  }, [renderSectionHeader, renderPrayerItem, membersLookupWithCustomNames]);

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
              // Use custom display name if user has a linked contact for this member
              const customName = myDisplayNamesLookup[member.userProfileId];
              const displayName = customName || `${member.firstName} ${member.lastName}`;
              const nameParts = displayName.split(' ');
              const initials = getInitials(nameParts[0], nameParts[nameParts.length - 1]);
              const avatarColor = getAvatarColor(displayName);

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
                      {displayName}
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
  ), [members, group.createdBy, handleMemberPress, myDisplayNamesLookup]);

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
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
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
          usersLookup={membersLookupWithCustomNames}
          context='groups'
        />
      )}

      {/* Prayer Session Modal */}
      <PrayerSessionModal
        visible={prayerSessionVisible}
        prayers={(prayers || []).filter(p => !p.isAnswered)}
        currentUserId={user?.userProfileId || 0}
        usersLookup={membersLookupWithCustomNames}
        onClose={() => setPrayerSessionVisible(false)}
        contextTitle={group.groupName}
      />

      {/* Contact Picker Modal */}
      <Modal
        visible={contactPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseContactPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.contactPickerContainer}>
            {/* Header */}
            <View style={styles.contactPickerHeader}>
              <Text style={styles.contactPickerTitle}>
                Select Contact for {pendingMember?.firstName} {pendingMember?.lastName}
              </Text>
              <Pressable
                onPress={handleCloseContactPicker}
                style={styles.contactPickerCloseButton}
              >
                <Ionicons name="close" size={24} color={DARK_TEXT} />
              </Pressable>
            </View>

            {/* Subtitle */}
            <Text style={styles.contactPickerSubtitle}>
              Choose an existing contact or create a new one
            </Text>

            {/* Contact List */}
            <ScrollView
              style={styles.contactPickerList}
              showsVerticalScrollIndicator={false}
            >
              {/* Create New Contact Option */}
              <Pressable
                onPress={handleCreateNewContact}
                disabled={isCreatingContact}
                style={({ pressed }) => [
                  styles.contactPickerItem,
                  styles.createNewItem,
                  pressed && styles.contactPickerItemPressed,
                ]}
              >
                <View style={styles.createNewIcon}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.contactPickerItemInfo}>
                  <Text style={styles.createNewText}>
                    {isCreatingContact ? 'Creating...' : 'Create New Contact'}
                  </Text>
                  <Text style={styles.contactPickerItemSubtext}>
                    {pendingMember?.firstName} {pendingMember?.lastName} (linked)
                  </Text>
                </View>
              </Pressable>

              {/* Divider */}
              {sortedContactsForPicker.length > 0 && (
                <View style={styles.contactPickerDivider}>
                  <View style={styles.contactPickerDividerLine} />
                  <Text style={styles.contactPickerDividerText}>or select existing</Text>
                  <View style={styles.contactPickerDividerLine} />
                </View>
              )}

              {/* Existing Contacts */}
              {sortedContactsForPicker.map((contact, index) => {
                const matched = isNameMatch(contact);
                const initials = getInitials(
                  contact.prayerSubjectDisplayName.split(' ')[0],
                  contact.prayerSubjectDisplayName.split(' ').slice(-1)[0]
                );
                const avatarColor = getAvatarColor(contact.prayerSubjectDisplayName);

                return (
                  <Pressable
                    key={contact.prayerSubjectId}
                    onPress={() => handleSelectExistingContact(contact)}
                    style={({ pressed }) => [
                      styles.contactPickerItem,
                      matched && styles.contactPickerItemMatched,
                      pressed && styles.contactPickerItemPressed,
                      index === sortedContactsForPicker.length - 1 && styles.contactPickerItemLast,
                    ]}
                  >
                    <View style={[styles.contactPickerAvatar, { backgroundColor: avatarColor }]}>
                      <Text style={styles.contactPickerAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.contactPickerItemInfo}>
                      <Text style={styles.contactPickerItemName}>
                        {contact.prayerSubjectDisplayName}
                      </Text>
                      {matched && (
                        <Text style={styles.contactPickerMatchBadge}>Name matches</Text>
                      )}
                      {contact.notes && (
                        <Text style={styles.contactPickerItemSubtext} numberOfLines={1}>
                          {contact.notes}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={SUBTLE_TEXT} />
                  </Pressable>
                );
              })}

              {/* Empty State */}
              {sortedContactsForPicker.length === 0 && (
                <View style={styles.contactPickerEmpty}>
                  <Text style={styles.contactPickerEmptyText}>
                    No existing contacts. Create a new one above.
                  </Text>
                </View>
              )}

              {/* Bottom padding */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerButtonDisabled: {
    backgroundColor: 'rgba(200, 200, 200, 0.5)',
    shadowOpacity: 0.1,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  headerButtonActive: {
    backgroundColor: ACTIVE_GREEN,
  },
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 16,
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
    letterSpacing: 0,
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
  // Contact Picker Modal Styles
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  contactPickerContainer: {
    backgroundColor: '#F6EDD9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  contactPickerHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  contactPickerTitle: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 18,
  },
  contactPickerCloseButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginLeft: 12,
    width: 32,
  },
  contactPickerSubtitle: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  contactPickerList: {
    paddingHorizontal: 16,
  },
  contactPickerItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contactPickerItemMatched: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
    borderColor: ACTIVE_GREEN,
    borderWidth: 1,
  },
  contactPickerItemPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
  },
  contactPickerItemLast: {
    marginBottom: 0,
  },
  contactPickerAvatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  contactPickerAvatarText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  contactPickerItemInfo: {
    flex: 1,
  },
  contactPickerItemName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  contactPickerItemSubtext: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  contactPickerMatchBadge: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 12,
    marginTop: 2,
  },
  contactPickerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  contactPickerDividerLine: {
    backgroundColor: 'rgba(45, 62, 49, 0.2)',
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  contactPickerDividerText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    marginHorizontal: 12,
  },
  contactPickerEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  contactPickerEmptyText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  createNewItem: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderColor: ACTIVE_GREEN,
    borderWidth: 1,
  },
  createNewIcon: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  createNewText: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
});
