import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { BlurView } from 'expo-blur';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserGroups, removeUserFromGroup } from '@/store/groupsSlice';
import { selectPrayerSubjects } from '@/store/prayerSubjectsSlice';
import { RootState } from '@/store/store';
import { updateGroup, UpdateGroupRequest } from '@/util/updateGroup';
import { deleteGroup } from '@/util/deleteGroup';
import { groupUsersCache } from '@/util/groupUsersCache';
import { createGroupInvite } from '@/util/createGroupInvite';
import { generateGroupInviteLink } from '@/util/deepLinks';
import PrayerSubjectPicker from '@/components/PrayerCards/PrayerSubjectPicker';
import type { Group, User, PrayerSubject } from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';
const DANGER_RED = '#D32F2F';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = 120;
const HEADER_HEIGHT = 56;

// Generate a preview color based on the name
const getAvatarColor = (displayName: string): string => {
  if (!displayName.trim()) {
    return '#9E9E9E';
  }
  const colors = [
    '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
    '#00BCD4', '#E91E63', '#607D8B', '#795548',
  ];

  let hash = 0;
  for (let i = 0; i < displayName.length; i++) {
    hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Generate initials from display name
const getInitials = (displayName: string): string => {
  if (!displayName.trim()) return '';
  const words = displayName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return displayName.substring(0, 2).toUpperCase();
};

type RootStackParamList = {
  EditCircle: { group: string };
  CircleDetail: { group: string };
};

export default function EditCircle() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditCircle'>>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const { token, user } = useAppSelector((state: RootState) => state.auth);
  const prayerSubjects = useAppSelector(selectPrayerSubjects);

  // Parse the group from route params
  const group: Group = JSON.parse(route.params.group);

  // Check if user is the creator
  const isCreator = group.createdBy === user?.userProfileId;

  // Form state
  const [groupName, setGroupName] = useState(group.groupName);
  const [groupDescription, setGroupDescription] = useState(group.groupDescription || '');
  const [members, setMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [memberDropdownVisible, setMemberDropdownVisible] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const totalHeaderHeight = HEADER_HEIGHT + 12;
  const headerGradientEnd = totalHeaderHeight / SCREEN_HEIGHT;

  const initials = getInitials(groupName);
  const avatarColor = getAvatarColor(groupName);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!token) return;
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
  }, [group.groupId, token]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    const nameChanged = groupName.trim() !== group.groupName;
    const descChanged = groupDescription.trim() !== (group.groupDescription || '');
    return nameChanged || descChanged;
  }, [groupName, groupDescription, group]);

  const handleSave = useCallback(async () => {
    if (!groupName.trim()) {
      Alert.alert('Required', 'Please enter a name for the prayer circle.');
      return;
    }

    if (!token || !user) {
      Alert.alert('Error', 'You must be logged in to edit a prayer circle.');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    try {
      if (hasChanges) {
        // Always send both fields since backend does a full update
        const updateData: UpdateGroupRequest = {
          groupName: groupName.trim(),
          groupDescription: groupDescription.trim(),
        };

        const result = await updateGroup(token, group.groupId, updateData);

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to update prayer circle');
        }
      }

      // Refresh groups data
      await dispatch(fetchUserGroups());

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error updating prayer circle:', error);
      Alert.alert('Error', 'Failed to update prayer circle. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [groupName, groupDescription, group, isSaving, token, user, dispatch, navigation]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  const handleDelete = useCallback(() => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to delete a prayer circle.');
      return;
    }

    if (!isCreator) {
      Alert.alert('Permission Denied', 'Only the creator can delete this prayer circle.');
      return;
    }

    const memberCount = members.length;
    const warningMessage = memberCount > 1
      ? `This will permanently delete "${group.groupName}" and remove all ${memberCount} members.`
      : `This will permanently delete "${group.groupName}".`;

    Alert.alert(
      'Delete Prayer Circle?',
      warningMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await deleteGroup(token, group.groupId);

              if (!result.success) {
                throw new Error(result.error?.message || 'Failed to delete prayer circle');
              }

              await dispatch(fetchUserGroups());
              navigation.popToTop();
            } catch (error) {
              console.error('Error deleting prayer circle:', error);
              Alert.alert('Error', 'Failed to delete prayer circle. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [token, isCreator, members.length, group, dispatch, navigation]);

  const handleAddPhoto = () => {
    Alert.alert('Coming Soon', 'Photo upload will be available in a future update.');
  };

  // Handle removing a member
  const handleRemoveMember = useCallback((member: User) => {
    if (!isCreator) {
      Alert.alert('Permission Denied', 'Only the creator can remove members.');
      return;
    }

    if (member.userProfileId === group.createdBy) {
      Alert.alert('Cannot Remove', 'The creator cannot be removed from the prayer circle.');
      return;
    }

    Alert.alert(
      'Remove Member?',
      `Remove ${member.firstName} ${member.lastName} from ${group.groupName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingMemberId(member.userProfileId);
            try {
              const result: any = await dispatch(
                removeUserFromGroup(group.groupId, member.userProfileId)
              );

              if (result?.success) {
                // Update local members list
                setMembers(prev => prev.filter(m => m.userProfileId !== member.userProfileId));
                // Invalidate the cache so it refreshes next time
                groupUsersCache.invalidate(group.groupId);
              } else {
                Alert.alert('Error', result?.error || 'Failed to remove member.');
              }
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            } finally {
              setRemovingMemberId(null);
            }
          },
        },
      ]
    );
  }, [isCreator, group, dispatch]);

  // Get prayer subjects that are linked to users not already in the group
  const availableSubjects = useMemo(() => {
    if (!prayerSubjects) return [];
    const memberUserIds = new Set(members.map(m => m.userProfileId));
    // Filter to individual prayer subjects that are linked to users not already in the group
    return prayerSubjects.filter(s =>
      s.prayerSubjectType === 'individual' &&
      s.userProfileId !== null &&
      s.linkStatus === 'linked' &&
      !memberUserIds.has(s.userProfileId)
    );
  }, [prayerSubjects, members]);

  // Handle selecting a prayer subject to invite (for linked users)
  const handleSelectSubject = useCallback(async (subject: PrayerSubject | null) => {
    if (!subject || !subject.userProfileId) return;

    // This would add the user to the group - but we need an API for this
    // For now, show a message that this is coming soon
    Alert.alert(
      'Coming Soon',
      `Adding ${subject.prayerSubjectDisplayName} directly to the group will be available in a future update. For now, use "Send Invite Link" to invite them.`
    );
    setShowMemberPicker(false);
    setMemberDropdownVisible(false);
  }, []);

  // Handle external invite via share sheet
  const handleExternalInvite = useCallback(async () => {
    if (!token || inviteLoading) return;

    setInviteLoading(true);

    try {
      const result = await createGroupInvite(token, group.groupId);

      if (result.success && result.data?.inviteCode) {
        const deepLink = generateGroupInviteLink(result.data.inviteCode);
        const inviteMessage = `You're invited to join "${group.groupName}" on PrayerLoop!\n\nTap this link to join:\n${deepLink}\n\nOr enter this code manually:\n${result.data.inviteCode}`;

        try {
          await Share.share({
            message: inviteMessage,
            title: 'PrayerLoop Group Invite',
          });
        } catch (shareError) {
          console.error('Share error:', shareError);
          Alert.alert(
            'Invite Generated',
            `Deep link:\n${deepLink}\n\nInvite code: ${result.data.inviteCode}\n\nShare either with someone to invite them to ${group.groupName}`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to generate invite code',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Invite error:', error);
      Alert.alert(
        'Error',
        'Failed to generate invite code. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setInviteLoading(false);
    }
  }, [token, group.groupId, group.groupName, inviteLoading]);

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      {/* Custom Header */}
      <View style={[styles.header, { height: HEADER_HEIGHT + 12, paddingTop: 12 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
          ]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color={DARK_TEXT} />
        </Pressable>

        <Text style={styles.headerTitle}>Edit Prayer Circle</Text>

        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
            !groupName.trim() && styles.headerButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!groupName.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={ACTIVE_GREEN} />
          ) : (
            <Ionicons
              name="checkmark"
              size={24}
              color={groupName.trim() ? ACTIVE_GREEN : SUBTLE_TEXT}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: avatarColor },
            ]}
          >
            {initials ? (
              <Text style={styles.initialsText}>{initials}</Text>
            ) : (
              <FontAwesome name="users" size={50} color="rgba(255,255,255,0.7)" />
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addPhotoButton,
              pressed && styles.addPhotoButtonPressed,
            ]}
            onPress={handleAddPhoto}
          >
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </Pressable>
        </View>

        {/* Name & Description Section */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Circle Name"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={groupName}
                  onChangeText={setGroupName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputRowBorder} />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Description"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </BlurView>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>Members</Text>
            <View style={styles.sectionLabelLine} />
          </View>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              {membersLoading ? (
                <View style={styles.memberLoadingRow}>
                  <ActivityIndicator size="small" color={ACTIVE_GREEN} />
                  <Text style={styles.memberLoadingText}>Loading members...</Text>
                </View>
              ) : (
                <>
                  {members.map((member, index) => {
                    const memberInitials = getInitials(`${member.firstName} ${member.lastName}`);
                    const memberColor = getAvatarColor(`${member.firstName} ${member.lastName}`);
                    const isGroupCreator = member.userProfileId === group.createdBy;
                    const canRemove = isCreator && !isGroupCreator;
                    const isRemoving = removingMemberId === member.userProfileId;

                    return (
                      <View key={member.userProfileId}>
                        {index > 0 && <View style={styles.inputRowBorder} />}
                        <View style={styles.memberRow}>
                          {/* Remove button - only show if can remove */}
                          {canRemove && (
                            <Pressable
                              style={({ pressed }) => [
                                styles.removeButton,
                                pressed && styles.removeButtonPressed,
                              ]}
                              onPress={() => handleRemoveMember(member)}
                              disabled={isRemoving}
                            >
                              {isRemoving ? (
                                <ActivityIndicator size="small" color={DANGER_RED} />
                              ) : (
                                <Ionicons name="remove-circle" size={24} color={DANGER_RED} />
                              )}
                            </Pressable>
                          )}
                          <View
                            style={[
                              styles.memberAvatar,
                              { backgroundColor: memberColor },
                            ]}
                          >
                            <Text style={styles.memberAvatarText}>{memberInitials}</Text>
                          </View>
                          <View style={styles.memberInfo}>
                            <Text style={styles.memberName}>
                              {member.firstName} {member.lastName}
                            </Text>
                            {isGroupCreator && (
                              <Text style={styles.memberRole}>Creator</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  {/* Add member row - shows picker when active */}
                  {!showMemberPicker && (
                    <>
                      <View style={styles.inputRowBorder} />
                      <Pressable
                        style={({ pressed }) => [
                          styles.addMemberRow,
                          pressed && styles.addMemberRowPressed,
                        ]}
                        onPress={() => setShowMemberPicker(true)}
                      >
                        <Ionicons
                          name="add-circle"
                          size={22}
                          color={ACTIVE_GREEN}
                          style={styles.addMemberIcon}
                        />
                        <Text style={styles.addMemberText}>add member</Text>
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </View>
          </BlurView>
          {/* Picker rendered outside BlurView to avoid overflow clipping */}
          {showMemberPicker && token && user && (
            <View style={[styles.pickerOutsideBlur, memberDropdownVisible && styles.pickerWithDropdown]}>
              {/* Only show picker if there are linked contacts available */}
              {availableSubjects.length > 0 && (
                <PrayerSubjectPicker
                  subjects={availableSubjects}
                  selectedSubjectId={null}
                  onSelectSubject={handleSelectSubject}
                  onDropdownVisibilityChange={setMemberDropdownVisible}
                  filterType="individual-only"
                  showQuickAdd={false}
                  showAddContactButton={false}
                  placeholder="Search for a linked contact..."
                  disabled={false}
                  token={token}
                  userProfileId={user.userProfileId}
                />
              )}
              {/* External invite option */}
              <Pressable
                style={({ pressed }) => [
                  styles.externalInviteRow,
                  pressed && styles.externalInviteRowPressed,
                ]}
                onPress={handleExternalInvite}
                disabled={inviteLoading}
              >
                <Ionicons
                  name="share-outline"
                  size={20}
                  color={ACTIVE_GREEN}
                  style={styles.externalInviteIcon}
                />
                <Text style={styles.externalInviteText}>
                  {inviteLoading ? 'Generating invite...' : 'Send Invite Link'}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                ]}
                onPress={() => {
                  setShowMemberPicker(false);
                  setMemberDropdownVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Delete Section - only show if user is the creator */}
        {isCreator && (
          <View style={styles.section}>
            <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
              <View style={styles.sectionContent}>
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteRow,
                    pressed && styles.deleteRowPressed,
                  ]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={DANGER_RED}
                    style={styles.deleteIcon}
                  />
                  <Text style={styles.deleteText}>Delete Prayer Circle</Text>
                </Pressable>
              </View>
            </BlurView>
          </View>
        )}

        {/* Bottom padding for scroll */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      {/* Loading Overlay */}
      {(isSaving || isDeleting) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.extraLargeSpinner}>
              <ActivityIndicator size="large" color="#b2d8b2" />
            </View>
            <Text style={styles.loadingText}>
              {isDeleting ? 'Deleting...' : 'Saving...'}
            </Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  actionIcon: {
    marginRight: 8,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionRowPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
  },
  actionText: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  addPhotoButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addPhotoButtonPressed: {
    opacity: 0.7,
  },
  addPhotoText: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  addMemberIcon: {
    marginRight: 8,
  },
  addMemberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 12,
  },
  addMemberRowPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
  },
  addMemberText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
  },
  externalInviteIcon: {
    marginRight: 8,
  },
  externalInviteRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(46, 125, 50, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 14,
  },
  externalInviteRowPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
  },
  externalInviteText: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 15,
  },
  pickerOutsideBlur: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  pickerWithDropdown: {
    marginBottom: 200,
  },
  avatar: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    elevation: 4,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: AVATAR_SIZE,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  deleteRowPressed: {
    opacity: 0.7,
  },
  deleteText: {
    color: DANGER_RED,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  emptyRow: {
    paddingVertical: 14,
  },
  emptyText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  extraLargeSpinner: {
    transform: [{ scale: 2 }],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
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
  headerButtonDisabled: {
    opacity: 0.6,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  headerTitle: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 18,
  },
  initialsText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 42,
    letterSpacing: 2,
  },
  input: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    paddingVertical: 4,
  },
  inputRow: {
    paddingVertical: 10,
  },
  inputRowBorder: {
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    height: StyleSheet.hairlineWidth,
  },
  loadingContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    paddingBottom: 30,
    paddingHorizontal: 60,
    paddingTop: 48,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  loadingText: {
    color: '#b2d8b2',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 24,
    marginTop: 48,
  },
  memberAvatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 14,
  },
  memberInfo: {
    flex: 1,
  },
  memberLoadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  memberLoadingText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginLeft: 8,
  },
  removeButton: {
    marginRight: 8,
    padding: 4,
  },
  removeButtonPressed: {
    opacity: 0.7,
  },
  memberName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  memberRole: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 60,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 4,
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
});
