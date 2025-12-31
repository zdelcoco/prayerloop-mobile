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
  Animated,
  Dimensions,
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
import {
  fetchGroupPrayers,
  selectFilteredGroupPrayers,
} from '@/store/groupPrayersSlice';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import PrayerDetailModal from '@/components/PrayerCards/PrayerDetailModal';
import ContextMenuButton from '@/components/ui/ContextMenuButton';
import { groupUsersCache } from '@/util/groupUsersCache';

import type { Group, Prayer, User } from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

type RootStackParamList = {
  CircleDetail: { group: string };
  PrayerModal: { mode: string; groupProfileId: number; groupName: string };
  UsersModal: { groupProfileId: number; groupName: string; groupCreatorId: string };
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = 120;
const HEADER_HEIGHT = 100;

// Item types for the list
type SectionHeaderItem = {
  type: 'section-header';
  title: string;
  key: string;
};

type EmptyStateItem = {
  type: 'empty-state';
  message: string;
  key: string;
};

type PrayerItem = {
  type: 'prayer';
  prayer: Prayer;
  isFirst: boolean;
  isLast: boolean;
  isAnswered: boolean;
  key: string;
};

type ListItem = SectionHeaderItem | EmptyStateItem | PrayerItem;

// Generate initials from group name
const getInitials = (groupName: string): string => {
  const words = groupName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return groupName.substring(0, 2).toUpperCase();
};

// Generate a consistent color based on the name
const getAvatarColor = (groupName: string): string => {
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
  for (let i = 0; i < groupName.length; i++) {
    hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
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

export default function CircleDetail() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CircleDetail'>>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Auth state
  const { user, token } = useAppSelector((state: RootState) => state.auth);

  // Group prayers from Redux
  const { prayers, status } = useAppSelector((state: RootState) => state.groupPrayers);

  // Prayer detail modal state
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);

  // Members state
  const [members, setMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Local prayers state for display
  const [localPrayers, setLocalPrayers] = useState<Prayer[]>([]);

  // Parse group from route params
  const group: Group = JSON.parse(route.params.group);

  const initials = getInitials(group.groupName);
  const avatarColor = getAvatarColor(group.groupName);

  // Sync local prayers when prayers change
  useEffect(() => {
    if (prayers) {
      // Filter out duplicates (backend issue)
      const uniquePrayers = prayers.filter(
        (prayer, index, self) =>
          index === self.findIndex((p) => p.prayerId === prayer.prayerId)
      );

      const sorted = [...uniquePrayers].sort((a, b) => {
        // Active prayers come before answered
        if (a.isAnswered !== b.isAnswered) {
          return a.isAnswered ? 1 : -1;
        }
        // Within same category, sort by creation date (newest first)
        return new Date(b.datetimeCreate).getTime() - new Date(a.datetimeCreate).getTime();
      });
      setLocalPrayers(sorted);
    }
  }, [prayers]);

  // Build list items including section headers and all prayers
  const activePrayers = useMemo(() => localPrayers.filter(p => !p.isAnswered), [localPrayers]);
  const answeredPrayers = useMemo(() => localPrayers.filter(p => p.isAnswered), [localPrayers]);

  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];

    // Prayer Requests section header
    items.push({
      type: 'section-header',
      title: 'Prayer Requests',
      key: 'header-active',
    });

    // Active prayers or empty state
    if (activePrayers.length === 0) {
      items.push({
        type: 'empty-state',
        message: 'No active prayer requests.',
        key: 'empty-active',
      });
    } else {
      activePrayers.forEach((prayer, index) => {
        items.push({
          type: 'prayer',
          prayer,
          isFirst: index === 0,
          isLast: index === activePrayers.length - 1,
          isAnswered: false,
          key: `prayer-${prayer.prayerId}`,
        });
      });
    }

    // Answered Prayers section (only if there are answered prayers)
    if (answeredPrayers.length > 0) {
      items.push({
        type: 'section-header',
        title: 'Answered Prayers',
        key: 'header-answered',
      });

      answeredPrayers.forEach((prayer, index) => {
        items.push({
          type: 'prayer',
          prayer,
          isFirst: index === 0,
          isLast: index === answeredPrayers.length - 1,
          isAnswered: true,
          key: `prayer-${prayer.prayerId}`,
        });
      });
    }

    return items;
  }, [activePrayers, answeredPrayers]);

  // Calculate gradient end point based on header height
  const headerGradientEnd = headerHeight / SCREEN_HEIGHT;

  // Fetch members
  useFocusEffect(
    useCallback(() => {
      const fetchMembers = async () => {
        if (!token) return;

        setMembersLoading(true);
        try {
          const users = await groupUsersCache.fetchGroupUsers(token, group.groupId);
          setMembers(users);
        } catch (error) {
          console.error('Failed to fetch members:', error);
        } finally {
          setMembersLoading(false);
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

  // Hide tab bar completely when this screen is focused
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

  // Set up custom header
  useFocusEffect(
    useCallback(() => {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: '',
          headerLeft: () => (
            <Pressable
              style={({ pressed }) => [
                [styles.headerButton, { paddingRight: 2 }],
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
                  pressed && styles.headerButtonPressed,
                ]}
                onPress={() => {
                  navigation.navigate('PrayerModal', {
                    mode: 'add',
                    groupProfileId: group.groupId,
                    groupName: group.groupName,
                  });
                }}
              >
                <FontAwesome name='plus' size={20} color={DARK_TEXT} />
              </Pressable>
              <ContextMenuButton
                type='groupDetail'
                groupId={group.groupId}
                groupName={group.groupName}
                groupCreatorId={group.createdBy}
                prayerCount={localPrayers?.length || 0}
                iconSize={20}
              />
            </View>
          ),
        });
      }
    }, [navigation, group, localPrayers])
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
    dispatch(fetchGroupPrayers(group.groupId));
  };

  // Handle member press - navigate to UsersModal
  const handleMembersPress = () => {
    navigation.navigate('UsersModal', {
      groupProfileId: group.groupId,
      groupName: group.groupName,
      groupCreatorId: group.createdBy?.toString() || '',
    });
  };

  // Render list item (section header, empty state, or prayer)
  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    // Section header - NOT draggable
    if (item.type === 'section-header') {
      const isFirstHeader = item.key === 'header-active';
      return (
        <View style={isFirstHeader ? undefined : styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>{item.title}</Text>
            <View style={styles.sectionLabelLine} />
          </View>
        </View>
      );
    }

    // Empty state - NOT draggable
    if (item.type === 'empty-state') {
      return (
        <View style={styles.sectionCardSingle}>
          <Text style={styles.emptyText}>{item.message}</Text>
        </View>
      );
    }

    // Prayer item
    const { prayer, isFirst, isLast, isAnswered } = item;
    return (
      <ScaleDecorator>
        <Pressable
          onPress={() => handlePrayerPress(prayer)}
          disabled={isActive}
          style={[
            styles.prayerItem,
            isFirst && styles.prayerItemFirst,
            isLast && styles.prayerItemLast,
            !isLast && styles.prayerItemBorder,
            isActive && styles.prayerItemDragging,
          ]}
        >
          <View style={styles.prayerHeader}>
            <Text style={styles.prayerTitle} numberOfLines={1}>
              {prayer.title}
            </Text>
            {isAnswered && (
              <View style={styles.answeredBadge}>
                <FontAwesome name="check" size={10} color="#FFFFFF" />
              </View>
            )}
            <FontAwesome
              name='chevron-right'
              size={12}
              color={SUBTLE_TEXT}
              style={styles.prayerChevron}
            />
          </View>
          <Text style={styles.prayerDescription} numberOfLines={3}>
            {prayer.prayerDescription}
          </Text>
          {isAnswered && prayer.datetimeAnswered ? (
            <Text style={styles.answeredDate}>
              Answered {formatDate(prayer.datetimeAnswered)}
            </Text>
          ) : (
            <Text style={styles.prayerDate}>
              {formatDate(prayer.datetimeCreate)}
            </Text>
          )}
        </Pressable>
      </ScaleDecorator>
    );
  }, [handlePrayerPress]);

  // List header (avatar, name, description)
  const ListHeader = useMemo(() => (
    <View style={[styles.listHeader, { paddingTop: insets.top + HEADER_HEIGHT }]}>
      {/* Spacer for avatar */}
      <View style={styles.avatarSpacer} />

      {/* Display Name */}
      <Text style={styles.displayName}>
        {group.groupName}
      </Text>

      {/* Description - displayed below name */}
      {group.groupDescription && (
        <Text style={styles.notesSubtitle}>{group.groupDescription}</Text>
      )}

      {/* Spacer before content */}
      <View style={styles.contentSpacer} />
    </View>
  ), [group.groupName, group.groupDescription, insets.top]);

  // List footer (members section)
  const ListFooter = useMemo(() => (
    <View style={styles.listFooter}>
      {/* Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionLabelContainer}>
          <Text style={styles.sectionLabel}>Members</Text>
          <View style={styles.sectionLabelLine} />
        </View>
        <Pressable
          onPress={handleMembersPress}
          style={({ pressed }) => [
            styles.membersCard,
            pressed && styles.membersCardPressed,
          ]}
        >
          {membersLoading ? (
            <Text style={styles.emptyText}>Loading members...</Text>
          ) : members.length > 0 ? (
            <View style={styles.membersRow}>
              <View style={styles.memberAvatarsRow}>
                {members.slice(0, 4).map((member, index) => (
                  <View
                    key={member.userProfileId}
                    style={[
                      styles.memberAvatar,
                      {
                        backgroundColor: getAvatarColor(
                          `${member.firstName} ${member.lastName}`
                        ),
                        marginLeft: index > 0 ? -8 : 0,
                        zIndex: 10 - index,
                      },
                    ]}
                  >
                    <Text style={styles.memberInitials}>
                      {(member.firstName?.[0] || '') + (member.lastName?.[0] || '')}
                    </Text>
                  </View>
                ))}
                {members.length > 4 && (
                  <View
                    style={[
                      styles.memberAvatar,
                      styles.memberAvatarMore,
                      { marginLeft: -8 },
                    ]}
                  >
                    <Text style={styles.memberMoreText}>+{members.length - 4}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.membersCount}>
                {members.length} member{members.length !== 1 ? 's' : ''}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={SUBTLE_TEXT}
                style={styles.memberChevron}
              />
            </View>
          ) : (
            <View style={styles.membersRow}>
              <FontAwesome name="user-plus" size={16} color={SUBTLE_TEXT} />
              <Text style={styles.emptyText}>Tap to manage members</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={SUBTLE_TEXT}
                style={styles.memberChevron}
              />
            </View>
          )}
        </Pressable>
      </View>

      {/* Bottom padding for scroll */}
      <View style={styles.bottomPadding} />
    </View>
  ), [members, membersLoading, handleMembersPress]);

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
        <View
          style={[
            styles.avatar,
            styles.avatarInitials,
            { backgroundColor: avatarColor },
          ]}
        >
          <Text style={styles.initialsText}>{initials}</Text>
        </View>

        {/* Type badge */}
        <View style={styles.typeBadge}>
          <FontAwesome
            name="users"
            size={14}
            color='#FFFFFF'
          />
        </View>
      </Animated.View>

      {/* Single DraggableFlatList as the main scrollable container */}
      <GestureHandlerRootView style={styles.gestureContainer}>
        <DraggableFlatList
          data={listItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
          onClose={handleModalClose}
          onActionComplete={handleActionComplete}
          onShare={() => {}}
          context='groups'
        />
      )}
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
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    marginHorizontal: 12,
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
  },
  initialsText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 42,
    letterSpacing: 2,
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
    borderColor: '#F6EDD9',
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  memberAvatarMore: {
    backgroundColor: SUBTLE_TEXT,
  },
  memberAvatarsRow: {
    flexDirection: 'row',
  },
  memberChevron: {
    marginLeft: 'auto',
  },
  memberInitials: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 12,
  },
  memberMoreText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 11,
  },
  membersCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  membersCardPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
  },
  membersCount: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 15,
    marginLeft: 12,
  },
  membersRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
    marginTop: 4,
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
  prayerTitle: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  section: {
    marginTop: 24,
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
