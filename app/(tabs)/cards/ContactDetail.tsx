import React, {
  useLayoutEffect,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';

import ContextMenuButton from '@/components/ui/ContextMenuButton';
import PrayerDetailModal from '@/components/PrayerCards/PrayerDetailModal';
import { getPrayerSubjectMembers } from '@/util/prayerSubjects';

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
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = 120;
const HEADER_HEIGHT = 100;

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
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Auth state for prayer modal
  const { user, token } = useAppSelector((state: RootState) => state.auth);
  const { prayers: allUserPrayers } = useAppSelector(
    (state: RootState) => state.userPrayers
  );

  // Prayer detail modal state
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);

  // Members state
  const [members, setMembers] = useState<PrayerSubjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Deserialize the contact parameter
  const contact: PrayerSubject = JSON.parse(route.params.contact);

  const initials = getInitials(contact.prayerSubjectDisplayName);
  const avatarColor = getAvatarColor(contact.prayerSubjectDisplayName);
  const hasPhoto = contact.photoS3Key !== null;

  // Filter prayers into active and answered
  const activePrayers = contact.prayers?.filter((p) => !p.isAnswered) || [];
  const answeredPrayers = contact.prayers?.filter((p) => p.isAnswered) || [];

  // Calculate gradient end point based on header height
  const headerGradientEnd = headerHeight / SCREEN_HEIGHT;

  // Fetch members for family/group types
  useEffect(() => {
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
  }, [contact.prayerSubjectId, contact.prayerSubjectType, token]);

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
  useLayoutEffect(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.setOptions({
        headerTitle: '',
        headerLeft: () => (
          <Pressable
            style={({ pressed }) => [
              [styles.headerButton, { paddingRight: 2}],
              pressed && styles.headerButtonPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name='angle-left' size={28} color={DARK_TEXT} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.headerButtonPressed,
            ]}
            onPress={() => {
              console.log(
                'Edit contact pressed:',
                contact.prayerSubjectDisplayName
              );
            }}
          >
            <FontAwesome name='pencil' size={20} color={DARK_TEXT} />
          </Pressable>
        ),
      });
    }

    return () => {
      // Restore header when leaving - must restore all header options
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: 'Prayer Cards',
          headerLeft: null,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <Pressable
                onPress={() => {
                  if ((global as any).cardsToggleSearch) {
                    (global as any).cardsToggleSearch();
                  }
                }}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <Ionicons name='search' size={20} color={DARK_TEXT} />
              </Pressable>
              <ContextMenuButton
                type='cards'
                prayerCount={allUserPrayers?.length || 0}
                iconSize={20}
              />
            </View>
          ),
        });
      }
    };
  }, [navigation, contact, allUserPrayers]);

  // Avatar opacity - fades out as user scrolls
  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Handle prayer press - show detail modal
  const handlePrayerPress = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setPrayerModalVisible(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setPrayerModalVisible(false);
    setSelectedPrayer(null);
  };

  // Handle action complete (after edit/delete)
  const handleActionComplete = () => {
    // Could refresh data here if needed
  };

  // Render a prayer card within the section
  const renderPrayerItem = (prayer: Prayer, index: number, list: Prayer[]) => (
    <Pressable
      key={prayer.prayerId}
      onPress={() => handlePrayerPress(prayer)}
      style={({ pressed }) => [
        styles.prayerItem,
        index < list.length - 1 && styles.prayerItemBorder,
        pressed && styles.prayerItemPressed,
      ]}
    >
      <View style={styles.prayerHeader}>
        <Text style={styles.prayerTitle} numberOfLines={1}>
          {prayer.title}
        </Text>
        {prayer.isAnswered && (
          <View style={styles.answeredBadge}>
            <FontAwesome name='check' size={10} color='#FFFFFF' />
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
      <Text style={styles.prayerDate}>
        {formatDate(prayer.datetimeCreate)}
        {prayer.isAnswered && prayer.datetimeAnswered && (
          <Text style={styles.answeredDate}>
            {' '}
            · Answered {formatDate(prayer.datetimeAnswered)}
          </Text>
        )}
      </Text>
    </Pressable>
  );

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

      {/* Scrollable content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + HEADER_HEIGHT },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer for avatar */}
        <View style={{ height: AVATAR_SIZE + 20 }} />

        {/* Display Name */}
        <Text style={styles.displayName}>
          {contact.prayerSubjectDisplayName}
        </Text>

        {/* Notes - displayed below name */}
        {contact.notes && (
          <Text style={styles.notesSubtitle}>{contact.notes}</Text>
        )}

        {/* Spacer before content */}
        <View style={{ height: 20 }} />

        {/* Active Prayers Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>Prayer Requests</Text>
            <View style={styles.sectionLabelLine} />
          </View>
          <BlurView intensity={8} tint='regular' style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              {activePrayers.length > 0 ? (
                activePrayers.map((prayer, index) =>
                  renderPrayerItem(prayer, index, activePrayers)
                )
              ) : (
                <Text style={styles.emptyText}>No active prayer requests.</Text>
              )}
            </View>
          </BlurView>
        </View>

        {/* Answered Prayers Section - only show if there are answered prayers */}
        {answeredPrayers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelContainer}>
              <Text style={styles.sectionLabel}>Answered Prayers</Text>
              <View style={styles.sectionLabelLine} />
            </View>
            <BlurView intensity={8} tint='regular' style={styles.sectionBlur}>
              <View style={styles.sectionContent}>
                {answeredPrayers.map((prayer, index) =>
                  renderPrayerItem(prayer, index, answeredPrayers)
                )}
              </View>
            </BlurView>
          </View>
        )}

        {/* Members Section (for family/group types) */}
        {contact.prayerSubjectType !== 'individual' && (
          <View style={styles.section}>
            <View style={styles.sectionLabelContainer}>
              <Text style={styles.sectionLabel}>Members</Text>
              <View style={styles.sectionLabelLine} />
            </View>
            <BlurView intensity={8} tint='regular' style={styles.sectionBlur}>
              <View style={styles.sectionContent}>
                {membersLoading ? (
                  <Text style={styles.emptyText}>Loading members...</Text>
                ) : members.length > 0 ? (
                  members.map((member, index) => (
                    <View
                      key={member.prayerSubjectMembershipId}
                      style={[
                        styles.memberItem,
                        index < members.length - 1 && styles.memberItemBorder,
                      ]}
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
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No members added yet.</Text>
                )}
              </View>
            </BlurView>
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
            <BlurView intensity={8} tint='regular' style={styles.sectionBlur}>
              <View style={styles.sectionContent}>
                <Text style={styles.linkStatusText}>
                  {contact.linkStatus === 'linked'
                    ? 'This contact is linked to a Prayerloop user.'
                    : 'A link request has been sent to this user.'}
                </Text>
              </View>
            </BlurView>
          </View>
        )}

        {/* Bottom padding for scroll */}
        <View style={{ height: 150 }} />
      </Animated.ScrollView>

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
          context='cards'
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
  avatarWrapper: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1,
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
    paddingVertical: 12,
    textAlign: 'center',
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
    marginRight: 8,
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
  },
  memberAvatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
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
    flexDirection: 'row',
    paddingVertical: 10,
  },
  memberItemBorder: {
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontSize: 12,
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
    paddingVertical: 12,
  },
  prayerItemBorder: {
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  prayerItemPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
  },
  prayerTitle: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  section: {
    marginBottom: 24 ,
  },  
  sectionBlur: {
    borderColor: 'rgba(252, 251, 231, 0.58)',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sectionContent: {
    backgroundColor: 'rgba(192, 181, 106, 0.09)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionLabel: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
    marginLeft: 12,
    marginRight: 12,    
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
  },
  typeBadge: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 3,
    bottom: 0,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: SCREEN_WIDTH / 2 - AVATAR_SIZE / 2 - 4,
    width: 32,
  },
});
