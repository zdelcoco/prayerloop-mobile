import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { selectPrayerSubjects, fetchPrayerSubjects } from '@/store/prayerSubjectsSlice';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  reorderPrayerSubjectPrayers,
  ReorderPrayerSubjectPrayersRequest,
} from '@/util/reorderPrayerSubjectPrayers';

import PrayerDetailModal from '@/components/PrayerCards/PrayerDetailModal';
import PrayerSessionModal from '@/components/PrayerSession/PrayerSessionModal';
import { getPrayerSubjectMembers, getPrayerSubjectParentGroups, ParentGroup } from '@/util/prayerSubjects';

import type {
  PrayerSubject,
  PrayerSubjectMember,
  Prayer,
} from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

type RootStackParamList = {
  ContactDetail: { contact: string }; // Serialized contact as string
  EditPrayerCardModal: { contact: string };
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = 120;
const HEADER_HEIGHT = 100;

// Type for active prayers only (used in DraggableFlatList)
type ActivePrayerItem = {
  prayer: Prayer;
  isFirst: boolean;
  isLast: boolean;
  key: string;
};

// Generate initials from display name
const getInitials = (displayName: string): string => {
  const words = displayName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return displayName.substring(0, 2).toUpperCase();
};

// Generate a consistent color based on the name
const getAvatarColor = (displayName: string): string => {
  const colors = [
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#00BCD4', // Cyan
    '#E91E63', // Pink
    '#607D8B', // Blue Grey
    '#795548', // Brown
  ];

  let hash = 0;
  for (let i = 0; i < displayName.length; i++) {
    hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Get icon for subject type
const getTypeIcon = (
  type: PrayerSubject['prayerSubjectType']
): 'home' | 'users' | 'user' => {
  switch (type) {
    case 'family':
      return 'home';
    case 'group':
      return 'users';
    default:
      return 'user';
  }
};

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function ContactDetail() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ContactDetail'>>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Auth state for prayer modal
  const { user, token } = useAppSelector((state: RootState) => state.auth);
  // Get fresh prayer subjects from Redux to reflect any updates
  const prayerSubjects = useAppSelector(selectPrayerSubjects);

  // Prayer detail modal state
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);

  // Prayer session modal state
  const [prayerSessionVisible, setPrayerSessionVisible] = useState(false);

  // Members state
  const [members, setMembers] = useState<PrayerSubjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Parent groups state (for individual types)
  const [parentGroups, setParentGroups] = useState<ParentGroup[]>([]);
  const [parentGroupsLoading, setParentGroupsLoading] = useState(false);

  // Local prayers state for reordering
  const [localPrayers, setLocalPrayers] = useState<Prayer[]>([]);
  const isReorderingRef = useRef(false);

  // Get prayerSubjectId from route params, then find fresh data from Redux
  const routeContact: PrayerSubject = JSON.parse(route.params.contact);
  const contact: PrayerSubject = prayerSubjects?.find(
    (s) => s.prayerSubjectId === routeContact.prayerSubjectId
  ) || routeContact;

  // Smart navigation: go back if contact exists in stack, otherwise push new screen
  const navigateToContact = useCallback((targetContact: PrayerSubject) => {
    const state = navigation.getState();
    const currentIndex = state.index;

    // Search backwards through the stack for this contact
    for (let i = currentIndex - 1; i >= 0; i--) {
      const stackRoute = state.routes[i];
      if (stackRoute.name === 'ContactDetail' && stackRoute.params) {
        try {
          const stackContact = JSON.parse((stackRoute.params as { contact: string }).contact);
          if (stackContact.prayerSubjectId === targetContact.prayerSubjectId) {
            // Found the contact in the stack - pop back to it
            const popCount = currentIndex - i;
            navigation.pop(popCount);
            return;
          }
        } catch {
          // Skip if params can't be parsed
        }
      }
    }

    // Contact not in stack - push new screen
    navigation.push('ContactDetail', {
      contact: JSON.stringify(targetContact),
    });
  }, [navigation]);

  const initials = getInitials(contact.prayerSubjectDisplayName);
  const avatarColor = getAvatarColor(contact.prayerSubjectDisplayName);
  const hasPhoto = contact.photoS3Key !== null;

  // Sync local prayers when contact changes (for reordering)
  // Combine active and answered, sorted: active first by sequence, then answered by sequence
  // Skip sync if we're in the middle of a reorder operation
  useEffect(() => {
    if (isReorderingRef.current) {
      return;
    }
    const prayers = contact.prayers || [];
    const sorted = [...prayers].sort((a, b) => {
      // Active prayers come before answered
      // Treat only explicitly true as "answered" - null/false/undefined are all "active"
      const aAnswered = a.isAnswered === true;
      const bAnswered = b.isAnswered === true;
      if (aAnswered !== bAnswered) {
        return aAnswered ? 1 : -1;
      }
      // Within same category, sort by subjectDisplaySequence
      return (a.subjectDisplaySequence ?? 0) - (b.subjectDisplaySequence ?? 0);
    });
    setLocalPrayers(sorted);
  }, [contact.prayers]);

  // Build list items including section headers and all prayers
  // Treat only explicitly true as "answered" - null/false/undefined are all "active"
  const activePrayers = useMemo(() => localPrayers.filter(p => p.isAnswered !== true), [localPrayers]);
  const answeredPrayers = useMemo(() => localPrayers.filter(p => p.isAnswered === true), [localPrayers]);

  // Only active prayers go in the DraggableFlatList - no headers mixed in
  const activePrayerItems = useMemo(() =>
    activePrayers.map((prayer, index) => ({
      prayer,
      isFirst: index === 0,
      isLast: index === activePrayers.length - 1,
      key: `prayer-${prayer.prayerId}`,
    })),
    [activePrayers]
  );

  // Stable key for DraggableFlatList based on prayer subject ID
  // This prevents unnecessary remounts that cause scroll position to reset
  const listKey = `prayers-${contact.prayerSubjectId}`;

  // Calculate gradient end point based on header height
  const headerGradientEnd = headerHeight / SCREEN_HEIGHT;

  // Fetch members for family/group types - refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      const fetchMembers = async () => {
        if (contact.prayerSubjectType === 'individual' || !token) {
          return;
        }

        setMembersLoading(true);
        try {
          const result = await getPrayerSubjectMembers(
            token,
            contact.prayerSubjectId
          );
          if (result.success && result.data) {
            setMembers(result.data.members);
          }
        } catch (error) {
          console.error('Failed to fetch members:', error);
        } finally {
          setMembersLoading(false);
        }
      };

      fetchMembers();
    }, [contact.prayerSubjectId, contact.prayerSubjectType, token])
  );

  // Fetch parent groups for individual types - refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      const fetchParentGroups = async () => {
        if (contact.prayerSubjectType !== 'individual' || !token) {
          return;
        }

        setParentGroupsLoading(true);
        try {
          const result = await getPrayerSubjectParentGroups(
            token,
            contact.prayerSubjectId
          );
          if (result.success && result.data) {
            setParentGroups(result.data.parents);
          }
        } catch (error) {
          console.error('Failed to fetch parent groups:', error);
        } finally {
          setParentGroupsLoading(false);
        }
      };

      fetchParentGroups();
    }, [contact.prayerSubjectId, contact.prayerSubjectType, token])
  );

  // Hide tab bar completely when this screen is focused
  // Also reset reordering ref so fresh data can load
  useFocusEffect(
    useCallback(() => {
      global.tabBarHidden = true;
      global.tabBarAddVisible = false;
      // Reset reordering flag when screen gains focus so fresh data can be synced
      isReorderingRef.current = false;
      return () => {
        global.tabBarHidden = false;
        global.tabBarAddVisible = true;
      };
    }, [])
  );

  // Set up custom header - use useFocusEffect so it re-runs when navigating back
  useFocusEffect(
    useCallback(() => {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: '',
          headerLeft: () => (
            <Pressable
              style={({ pressed }) => [
                [styles.headerButton, { paddingRight: 2, marginHorizontal: 12 }],
                pressed && styles.headerButtonPressed,
              ]}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome name='angle-left' size={28} color={DARK_TEXT} />
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
                  pressed && styles.headerButtonPressed,
                ]}
                onPress={() => {
                  navigation.navigate('EditPrayerCardModal', {
                    contact: JSON.stringify(contact),
                  });
                }}
              >
                <Text style={{ fontSize: 20 }}>✏️</Text>
              </Pressable>
            </View>
          ),
        });
      }
      // No cleanup needed - each screen sets up its own header when focused
    }, [navigation, contact, activePrayers])
  );

  // Avatar opacity - fades out as user scrolls
  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Handle prayer press - show detail modal
  const handlePrayerPress = useCallback((prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setPrayerModalVisible(true);
  }, []);

  // Handle modal close
  const handleModalClose = () => {
    setPrayerModalVisible(false);
    setSelectedPrayer(null);
  };

  // Handle action complete (after edit/delete)
  const handleActionComplete = () => {
    // Refresh prayer subjects to get updated data
    dispatch(fetchPrayerSubjects());
  };

  // Handle reorder completion - simple now that we only have active prayers
  const handleDragEnd = async (reorderedActivePrayers: Prayer[]) => {
    // Mark that we're reordering to prevent useEffect from overriding
    isReorderingRef.current = true;

    // Combine reordered active prayers with answered prayers (answered stay at end)
    const allPrayers = [...reorderedActivePrayers, ...answeredPrayers];

    // Update local state immediately for responsive UI
    setLocalPrayers(allPrayers);

    // Call API to persist the new order
    if (!token) {
      isReorderingRef.current = false;
      return;
    }

    try {
      const reorderData: ReorderPrayerSubjectPrayersRequest = {
        prayers: allPrayers.map((prayer, index) => ({
          prayerId: prayer.prayerId,
          displaySequence: index,
        })),
      };

      const result = await reorderPrayerSubjectPrayers(
        token,
        contact.prayerSubjectId,
        reorderData
      );

      if (!result.success) {
        // On failure, revert by fetching fresh data
        isReorderingRef.current = false;
        dispatch(fetchPrayerSubjects());
      } else {
        // On success, refresh Redux so the new order persists when navigating away
        dispatch(fetchPrayerSubjects());
        // Reset flag after a brief delay to allow Redux to update
        setTimeout(() => {
          isReorderingRef.current = false;
        }, 500);
      }
    } catch {
      // On error, revert by fetching fresh data
      isReorderingRef.current = false;
      dispatch(fetchPrayerSubjects());
    }
  };

  // Render active prayer item (only active prayers are in the DraggableFlatList)
  const renderActivePrayerItem = useCallback(({ item, drag, isActive: isDragging }: RenderItemParams<ActivePrayerItem>) => {
    const { prayer, isFirst, isLast } = item;
    return (
      <ScaleDecorator>
        <Pressable
          onPress={() => handlePrayerPress(prayer)}
          onLongPress={drag}
          disabled={isDragging}
          style={[
            styles.prayerItem,
            isFirst && styles.prayerItemFirst,
            isLast && styles.prayerItemLast,
            !isLast && styles.prayerItemBorder,
            isDragging && styles.prayerItemDragging,
          ]}
        >
          <View style={styles.prayerHeader}>
            <Text style={styles.prayerTitle} numberOfLines={1}>
              {prayer.title}
            </Text>
            <FontAwesome
              name='chevron-right'
              size={12}
              color={SUBTLE_TEXT}
              style={styles.prayerChevron}
            />
          </View>
          {prayer.prayerSubjectDisplayName && (
            <View style={styles.prayerSubjectRow}>
              <Text style={styles.prayerSubjectLabel}>Pray for</Text>
              <Text style={styles.prayerSubjectName}>{prayer.prayerSubjectDisplayName}</Text>
            </View>
          )}
          <Text style={styles.prayerDescription} numberOfLines={3}>
            {prayer.prayerDescription}
          </Text>
          <Text style={styles.prayerDate}>
            {formatDate(prayer.datetimeCreate)}
          </Text>
        </Pressable>
      </ScaleDecorator>
    );
  }, [handlePrayerPress]);

  // Render an answered prayer (non-draggable, used in footer)
  const renderAnsweredPrayer = useCallback((prayer: Prayer, isFirst: boolean, isLast: boolean) => (
    <Pressable
      key={prayer.prayerId}
      onPress={() => handlePrayerPress(prayer)}
      style={[
        styles.prayerItem,
        isFirst && styles.prayerItemFirst,
        isLast && styles.prayerItemLast,
        !isLast && styles.prayerItemBorder,
      ]}
    >
      <View style={styles.prayerHeader}>
        <Text style={styles.prayerTitle} numberOfLines={1}>
          {prayer.title}
        </Text>
        <View style={styles.answeredBadge}>
          <FontAwesome name="check" size={10} color="#FFFFFF" />
        </View>
        <FontAwesome
          name='chevron-right'
          size={12}
          color={SUBTLE_TEXT}
          style={styles.prayerChevron}
        />
      </View>
      {prayer.prayerSubjectDisplayName && (
        <View style={styles.prayerSubjectRow}>
          <Text style={styles.prayerSubjectLabel}>Pray for</Text>
          <Text style={styles.prayerSubjectName}>{prayer.prayerSubjectDisplayName}</Text>
        </View>
      )}
      <Text style={styles.prayerDescription} numberOfLines={3}>
        {prayer.prayerDescription}
      </Text>
      <Text style={styles.answeredDate}>
        Answered {prayer.datetimeAnswered ? formatDate(prayer.datetimeAnswered) : 'N/A'}
      </Text>
    </Pressable>
  ), [handlePrayerPress]);

  // List header (avatar, name, notes, and Prayer Requests section header)
  const ListHeader = useMemo(() => (
    <View style={[styles.listHeader, { paddingTop: insets.top + HEADER_HEIGHT }]}>
      {/* Spacer for avatar */}
      <View style={styles.avatarSpacer} />

      {/* Display Name */}
      <Text style={styles.displayName}>
        {contact.prayerSubjectDisplayName}
      </Text>

      {/* Notes - displayed below name */}
      {contact.notes && (
        <Text style={styles.notesSubtitle}>{contact.notes}</Text>
      )}

      {/* Spacer before content */}
      <View style={styles.contentSpacer} />

      {/* Prayer Requests section header */}
      <View style={styles.sectionLabelContainer}>
        <Text style={styles.sectionLabel}>Prayer Requests</Text>
        <View style={styles.sectionLabelLine} />
      </View>

      {/* Empty state if no active prayers */}
      {activePrayers.length === 0 && (
        <View style={styles.sectionCardSingle}>
          <Text style={styles.emptyText}>No active prayer requests.</Text>
        </View>
      )}
    </View>
  ), [contact.prayerSubjectDisplayName, contact.notes, insets.top, activePrayers.length]);

  // List footer (answered prayers, members section, link status, padding)
  const ListFooter = useMemo(() => (
    <View style={styles.listFooter}>
      {/* Answered Prayers Section */}
      {answeredPrayers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>Answered Prayers</Text>
            <View style={styles.sectionLabelLine} />
          </View>
          <View style={styles.sectionCard}>
            {answeredPrayers.map((prayer, index) =>
              renderAnsweredPrayer(prayer, index === 0, index === answeredPrayers.length - 1)
            )}
          </View>
        </View>
      )}

      {/* Member Of Section (for individual types with parent groups) */}
      {contact.prayerSubjectType === 'individual' && (parentGroupsLoading || parentGroups.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>Member Of</Text>
            <View style={styles.sectionLabelLine} />
          </View>
          <View style={styles.sectionCard}>
            {parentGroupsLoading ? (
              <Text style={styles.emptyText}>Loading groups...</Text>
            ) : (
              parentGroups.map((parent, index) => {
                const parentSubject = prayerSubjects?.find(
                  (s) => s.prayerSubjectId === parent.groupPrayerSubjectId
                );
                const isFirst = index === 0;
                const isLast = index === parentGroups.length - 1;
                return (
                  <Pressable
                    key={parent.prayerSubjectMembershipId}
                    style={({ pressed }) => [
                      styles.memberItem,
                      isFirst && styles.memberItemFirst,
                      isLast && styles.memberItemLast,
                      !isLast && styles.memberItemBorder,
                      pressed && styles.memberItemPressed,
                    ]}
                    onPress={() => {
                      if (parentSubject) {
                        navigateToContact(parentSubject);
                      }
                    }}
                    disabled={!parentSubject}
                  >
                    <View
                      style={[
                        styles.memberAvatar,
                        {
                          backgroundColor: getAvatarColor(parent.groupDisplayName),
                        },
                      ]}
                    >
                      <FontAwesome
                        name={parent.groupType === 'family' ? 'home' : 'users'}
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {parent.groupDisplayName}
                      </Text>
                      <Text style={styles.memberRole}>
                        {parent.groupType === 'family' ? 'Family' : 'Group'}
                        {parent.membershipRole === 'leader' ? ' · Leader' : ''}
                      </Text>
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
            )}
          </View>
        </View>
      )}

      {/* Members Section (for family/group types) */}
      {contact.prayerSubjectType !== 'individual' && (
        <View style={styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>Members</Text>
            <View style={styles.sectionLabelLine} />
          </View>
          <View style={styles.sectionCard}>
            {membersLoading ? (
              <View style={styles.sectionCardSingle}>
                <Text style={styles.emptyText}>Loading members...</Text>
              </View>
            ) : members.length > 0 ? (
              members.map((member, index) => {
                const memberSubject = prayerSubjects?.find(
                  (s) => s.prayerSubjectId === member.memberPrayerSubjectId
                );
                const isFirst = index === 0;
                const isLast = index === members.length - 1;
                return (
                  <Pressable
                    key={member.prayerSubjectMembershipId}
                    style={({ pressed }) => [
                      styles.memberItem,
                      isFirst && styles.memberItemFirst,
                      isLast && styles.memberItemLast,
                      !isLast && styles.memberItemBorder,
                      pressed && styles.memberItemPressed,
                    ]}
                    onPress={() => {
                      if (memberSubject) {
                        navigateToContact(memberSubject);
                      }
                    }}
                    disabled={!memberSubject}
                  >
                    <View
                      style={[
                        styles.memberAvatar,
                        {
                          backgroundColor: getAvatarColor(
                            member.memberDisplayName
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.memberInitials}>
                        {getInitials(member.memberDisplayName)}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {member.memberDisplayName}
                      </Text>
                      <Text style={styles.memberRole}>
                        {member.membershipRole === 'leader'
                          ? 'Leader'
                          : 'Member'}
                      </Text>
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
                <Text style={styles.emptyText}>No members added yet.</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Link Status */}
      {contact.linkStatus !== 'unlinked' && (
        <View style={styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>
              {contact.linkStatus === 'linked'
                ? 'Linked Account'
                : 'Link Pending'}
            </Text>
            <View style={styles.sectionLabelLine} />
          </View>
          <View style={styles.sectionCardSingle}>
            <Text style={styles.linkStatusText}>
              {contact.linkStatus === 'linked'
                ? 'This contact is linked to a Prayerloop user.'
                : 'A link request has been sent to this user.'}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom padding for scroll */}
      <View style={styles.bottomPadding} />
    </View>
  ), [contact, parentGroups, parentGroupsLoading, members, membersLoading, navigation, prayerSubjects, answeredPrayers, renderAnsweredPrayer]);

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      {/* Static Avatar at top - stays in place, fades out and goes behind content */}
      <Animated.View
        style={[
          styles.avatarWrapper,
          {
            top: insets.top + HEADER_HEIGHT,
            opacity: avatarOpacity,
          },
        ]}
      >
        {hasPhoto ? (
          <Image source={{ uri: contact.photoS3Key! }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarInitials,
              { backgroundColor: avatarColor },
            ]}
          >
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
        )}

        {/* Type badge */}
        {contact.prayerSubjectType !== 'individual' && (
          <View style={styles.typeBadge}>
            <FontAwesome
              name={getTypeIcon(contact.prayerSubjectType)}
              size={14}
              color='#FFFFFF'
            />
          </View>
        )}
      </Animated.View>

      {/* DraggableFlatList for active prayers only */}
      <GestureHandlerRootView style={styles.gestureContainer}>
        <DraggableFlatList
          key={listKey}
          data={activePrayerItems}
          keyExtractor={(item) => item.key}
          renderItem={renderActivePrayerItem}
          onDragEnd={({ data, from, to }) => {
            if (from !== to) {
              // Extract just the prayers from the reordered items
              const reorderedPrayers = data.map(item => item.prayer);
              handleDragEnd(reorderedPrayers);
            }
          }}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          onScrollOffsetChange={(offset) => scrollY.setValue(offset)}
        />
      </GestureHandlerRootView>

      {/* Prayer Detail Modal */}
      {selectedPrayer && (
        <PrayerDetailModal
          visible={prayerModalVisible}
          userId={user?.userProfileId || 0}
          userToken={token || ''}
          prayer={selectedPrayer}
          prayerSubjectId={contact.prayerSubjectId}
          subjectDisplayName={contact.prayerSubjectDisplayName}
          onClose={handleModalClose}
          onActionComplete={handleActionComplete}
          onShare={() => {}}
          context='cards'
        />
      )}

      {/* Prayer Session Modal */}
      <PrayerSessionModal
        visible={prayerSessionVisible}
        prayers={localPrayers.filter(p => !p.isAnswered)}
        currentUserId={user?.userProfileId || 0}
        onClose={() => setPrayerSessionVisible(false)}
        contextTitle={contact.prayerSubjectDisplayName}
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
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
  },
  avatar: {
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarInitials: {
    alignItems: 'center',
    elevation: 4,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  avatarSpacer: {
    height: AVATAR_SIZE + 20,
  },
  avatarWrapper: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  bottomPadding: {
    height: 150,
  },
  contentSpacer: {
    height: 20,
  },
  displayName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 28,
    textAlign: 'center',
  },
  emptyText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'center',
  },
  gestureContainer: {
    flex: 1,
    zIndex: 2,
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
  headerRightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 16,
  },
  initialsText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 42,
    letterSpacing: 2,
  },
  linkStatusText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  listFooter: {
    marginTop: 8,
  },
  listHeader: {
    alignItems: 'center',
  },
  memberAvatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
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
    paddingVertical: 10,
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
    backgroundColor: 'rgba(144, 197, 144, 0.15)',
  },
  memberName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 15,
  },
  memberRole: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
  },
  notesSubtitle: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  prayerChevron: {
    marginLeft: 8,
  },
  prayerDate: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    marginTop: 8,
  },
  prayerDescription: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
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
  prayerItemDragging: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  prayerItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  prayerItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  prayerSubjectLabel: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
  },
  prayerSubjectName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 13,
    marginLeft: 4,
  },
  prayerSubjectRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  prayerTitle: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  section: {
    marginTop: 24,
  },
  sectionCard: {
    overflow: 'hidden',
  },
  sectionCardSingle: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  sectionLabelLine: {
    backgroundColor: 'rgba(45, 62, 49, 0.2)',
    flex: 1,
    height: StyleSheet.hairlineWidth,
    marginLeft: 12,
  },
  typeBadge: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderColor: '#F6EDD9',
    borderRadius: 16,
    borderWidth: 3,
    bottom: 0,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: '50%',
    transform: [{ translateX: 45 }],
    width: 32,
  },
});
