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
} from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { BlurView } from 'expo-blur';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchPrayerSubjects } from '@/store/prayerSubjectsSlice';
import { fetchUserPrayers } from '@/store/userPrayersSlice';
import { updateUserProfileSuccess, logout } from '@/store/authSlice';
import {
  updatePrayerSubject as updatePrayerSubjectAPI,
  deletePrayerSubject as deletePrayerSubjectAPI,
  getPrayerSubjectMembers,
  getPrayerSubjectParentGroups,
  addMemberToSubject,
  removeMemberFromSubject,
  ParentGroup,
} from '@/util/prayerSubjects';
import { selectPrayerSubjects } from '@/store/prayerSubjectsSlice';
import PrayerSubjectPicker from '@/components/PrayerCards/PrayerSubjectPicker';
import { createUserPrayer } from '@/util/createUserPrayer';
import { updateUserPrayer } from '@/util/updateUserPrayer';
import { removePrayerAccess } from '@/util/removePrayerAccess';
import { updateUserProfile } from '@/util/updateUserProfile';
import { changeUserPassword } from '@/util/changeUserPassword';
import { deleteUserAccount } from '@/util/deleteUserAccount';
import { formatPhoneNumberInput } from '@/util/phoneFormatter';
import { RootState } from '@/store/store';
import ChangePasswordModal from '@/components/Home/ChangePasswordModal';
import type { PrayerSubject, PrayerSubjectMember, UpdatePrayerSubjectRequest, CreatePrayerRequest } from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';
const DANGER_RED = '#D32F2F';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = 120;

// Generate a preview color based on the name
const getAvatarColor = (displayName: string): string => {
  if (!displayName.trim()) {
    return '#9E9E9E'; // Gray default
  }
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

// Generate initials from display name
const getInitials = (displayName: string): string => {
  if (!displayName.trim()) return '';
  const words = displayName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return displayName.substring(0, 2).toUpperCase();
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

// Get label for subject type
const getTypeLabel = (type: PrayerSubject['prayerSubjectType']): string => {
  switch (type) {
    case 'family':
      return 'Family';
    case 'group':
      return 'Group';
    default:
      return 'Individual';
  }
};

// Prayer subject type options
type PrayerSubjectType = 'individual' | 'family' | 'group';

const TYPE_OPTIONS: { value: PrayerSubjectType; label: string; icon: 'user' | 'home' | 'users' }[] = [
  { value: 'individual', label: 'Individual', icon: 'user' },
  { value: 'family', label: 'Family', icon: 'home' },
  { value: 'group', label: 'Group', icon: 'users' },
];

const HEADER_HEIGHT = 56;

type RootStackParamList = {
  EditPrayerCardModal: { contact: string; returnTo?: string };
  ContactDetail: { contact: string };
};

// Local prayer item type for tracking edits
interface LocalPrayerItem {
  id: string; // Either prayerId as string for existing, or temp ID for new
  prayerId?: number; // Exists only for existing prayers
  prayerAccessId?: number; // Exists only for existing prayers
  title: string;
  description: string;
  isAnswered: boolean;
  isNew: boolean; // True if this is a new prayer to be created
  isModified: boolean; // True if an existing prayer has been modified
}

// Type for tracking deleted prayers
interface DeletedPrayer {
  prayerId: number;
  prayerAccessId: number;
}

export default function EditPrayerCardModal() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditPrayerCardModal'>>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const { token, user } = useAppSelector((state: RootState) => state.auth);
  const prayerSubjects = useAppSelector(selectPrayerSubjects);

  // Parse the contact from route params
  const contact: PrayerSubject = JSON.parse(route.params.contact);
  const returnTo = route.params.returnTo;

  // Check if this is the user's own card (linked to their profile)
  const isOwnCard = contact.userProfileId === user?.userProfileId;

  // Initialize prayers from contact
  const initialPrayers: LocalPrayerItem[] = useMemo(() => {
    return (contact.prayers || []).map((prayer) => ({
      id: prayer.prayerId.toString(),
      prayerId: prayer.prayerId,
      prayerAccessId: prayer.prayerAccessId,
      title: prayer.title,
      description: prayer.prayerDescription,
      isAnswered: prayer.isAnswered,
      isNew: false,
      isModified: false,
    }));
  }, [contact.prayers]);

  // Pre-populate form state with existing values
  const [displayName, setDisplayName] = useState(contact.prayerSubjectDisplayName);
  const [notes, setNotes] = useState(contact.notes || '');
  const [subjectType, setSubjectType] = useState<PrayerSubjectType>(contact.prayerSubjectType);
  const [prayers, setPrayers] = useState<LocalPrayerItem[]>(initialPrayers);
  const [linkedUserId, setLinkedUserId] = useState<number | null>(contact.userProfileId);
  const [members, setMembers] = useState<PrayerSubjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [deletedPrayers, setDeletedPrayers] = useState<DeletedPrayer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [addingToGroup, setAddingToGroup] = useState(false);
  const [parentGroups, setParentGroups] = useState<ParentGroup[]>([]);
  const [parentGroupsLoading, setParentGroupsLoading] = useState(false);
  const [memberDropdownVisible, setMemberDropdownVisible] = useState(false);
  const [groupDropdownVisible, setGroupDropdownVisible] = useState(false);
  const [membershipChanged, setMembershipChanged] = useState(false);

  // Account settings state (only used when isOwnCard)
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Fetch members for family/group types to check if type can be changed
  useEffect(() => {
    const fetchMembers = async () => {
      if (contact.prayerSubjectType === 'individual' || !token) {
        return;
      }

      setMembersLoading(true);
      try {
        const result = await getPrayerSubjectMembers(token, contact.prayerSubjectId);
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

  // Fetch parent groups for individual types
  useEffect(() => {
    const fetchParentGroups = async () => {
      if (contact.prayerSubjectType !== 'individual' || !token) {
        return;
      }

      setParentGroupsLoading(true);
      try {
        const result = await getPrayerSubjectParentGroups(token, contact.prayerSubjectId);
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
  }, [contact.prayerSubjectId, contact.prayerSubjectType, token]);

  // Check if type can be changed to individual (only if no members)
  const canChangeToIndividual = contact.prayerSubjectType === 'individual' || members.length === 0;

  const totalHeaderHeight = insets.top + HEADER_HEIGHT;
  const headerGradientEnd = totalHeaderHeight / SCREEN_HEIGHT;

  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  // Split prayers into active and answered
  const activePrayers = prayers.filter((p) => !p.isAnswered);
  const answeredPrayers = prayers.filter((p) => p.isAnswered);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    const nameChanged = displayName !== contact.prayerSubjectDisplayName;
    const notesChanged = notes !== (contact.notes || '');
    const typeChanged = subjectType !== contact.prayerSubjectType;
    const prayersChanged = prayers.some((p) => p.isNew || p.isModified);
    const prayersDeleted = deletedPrayers.length > 0;
    return nameChanged || notesChanged || typeChanged || prayersChanged || prayersDeleted;
  }, [displayName, notes, subjectType, prayers, deletedPrayers, contact]);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Please enter a display name.');
      return;
    }

    if (!token || !user) {
      Alert.alert('Error', 'You must be logged in to edit a prayer card.');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    try {
      // Step 1: Update prayer subject if changed
      const updateData: UpdatePrayerSubjectRequest = {};

      if (displayName.trim() !== contact.prayerSubjectDisplayName) {
        updateData.prayerSubjectDisplayName = displayName.trim();
      }

      if (subjectType !== contact.prayerSubjectType) {
        updateData.prayerSubjectType = subjectType;
      }

      const newNotes = notes.trim();
      const oldNotes = contact.notes || '';
      if (newNotes !== oldNotes) {
        updateData.notes = newNotes;
      }

      if (Object.keys(updateData).length > 0) {
        const result = await updatePrayerSubjectAPI(
          token,
          contact.prayerSubjectId,
          updateData
        );

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to update prayer card');
        }
      }

      // Step 2: Create new prayers
      const newPrayers = prayers.filter((p) => p.isNew && p.title.trim());
      for (const prayer of newPrayers) {
        const prayerData: CreatePrayerRequest = {
          title: prayer.title.trim(),
          prayerDescription: prayer.description.trim() || prayer.title.trim(),
          isPrivate: false,
          isAnswered: prayer.isAnswered,
          prayerType: 'general',
          prayerSubjectId: contact.prayerSubjectId,
        };
        await createUserPrayer(token, user.userProfileId, prayerData);
      }

      // Step 3: Update modified existing prayers
      const modifiedPrayers = prayers.filter((p) => p.isModified && p.prayerId);
      for (const prayer of modifiedPrayers) {
        const prayerData = {
          title: prayer.title.trim(),
          prayerDescription: prayer.description.trim() || prayer.title.trim(),
          isPrivate: false,
          isAnswered: prayer.isAnswered,
          prayerType: 'general',
        };
        await updateUserPrayer(token, prayer.prayerId!, prayerData);
      }

      // Step 4: Delete removed prayers
      for (const deleted of deletedPrayers) {
        await removePrayerAccess(token, deleted.prayerId, deleted.prayerAccessId);
      }

      // Refresh data
      await dispatch(fetchPrayerSubjects());
      await dispatch(fetchUserPrayers());

      // Go back to the appropriate screen
      if (returnTo === 'home') {
        navigation.goBack();
        setTimeout(() => {
          router.navigate('/userProfile');
        }, 50);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating prayer card:', error);
      Alert.alert('Error', 'Failed to update prayer card. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [displayName, notes, subjectType, prayers, deletedPrayers, contact, isSaving, token, user, dispatch, navigation, returnTo]);

  const handleClose = useCallback(() => {
    const closeAndRefresh = () => {
      // Refresh prayer subjects if membership was changed
      if (membershipChanged) {
        dispatch(fetchPrayerSubjects());
      }

      // Close the modal first, then navigate if needed
      if (returnTo === 'home') {
        navigation.goBack();
        // Navigate to home after a short delay to ensure modal is closed
        setTimeout(() => {
          router.navigate('/userProfile');
        }, 50);
      } else {
        navigation.goBack();
      }
    };

    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: closeAndRefresh },
        ]
      );
    } else {
      closeAndRefresh();
    }
  }, [hasChanges, membershipChanged, dispatch, navigation, returnTo]);

  const handleAddPhoto = () => {
    Alert.alert('Coming Soon', 'Photo upload will be available in a future update.');
  };

  const handleTypeChange = (newType: PrayerSubjectType) => {
    // If trying to change to individual and there are members, show error
    if (newType === 'individual' && !canChangeToIndividual) {
      Alert.alert(
        'Cannot Change Type',
        'This card has members. Please remove all members before changing to Individual.'
      );
      return;
    }
    setSubjectType(newType);
  };

  const handleAddPrayer = (isAnswered: boolean) => {
    const newId = `new-${Date.now()}`;
    setPrayers([
      ...prayers,
      {
        id: newId,
        title: '',
        description: '',
        isAnswered,
        isNew: true,
        isModified: false,
      },
    ]);
  };

  const handleUpdatePrayer = (
    id: string,
    field: 'title' | 'description',
    value: string
  ) => {
    setPrayers(
      prayers.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        // Mark as modified if it's an existing prayer
        if (!p.isNew) {
          updated.isModified = true;
        }
        return updated;
      })
    );
  };

  const handleRemovePrayer = (id: string) => {
    const prayerToRemove = prayers.find((p) => p.id === id);

    // If it's an existing prayer (has prayerId and prayerAccessId), track it for deletion
    if (prayerToRemove && !prayerToRemove.isNew && prayerToRemove.prayerId && prayerToRemove.prayerAccessId) {
      setDeletedPrayers([
        ...deletedPrayers,
        { prayerId: prayerToRemove.prayerId, prayerAccessId: prayerToRemove.prayerAccessId },
      ]);
    }

    setPrayers(prayers.filter((p) => p.id !== id));
  };

  const handleDelete = useCallback(() => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to delete a prayer card.');
      return;
    }

    const prayerCount = contact.prayers?.length || 0;
    const warningMessage = prayerCount > 0
      ? `This will permanently delete "${contact.prayerSubjectDisplayName}" and reassign ${prayerCount} prayer${prayerCount === 1 ? '' : 's'} to your personal card.`
      : `This will permanently delete "${contact.prayerSubjectDisplayName}".`;

    Alert.alert(
      'Delete Prayer Card?',
      warningMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await deletePrayerSubjectAPI(
                token,
                contact.prayerSubjectId,
                true
              );

              if (!result.success) {
                throw new Error(result.error?.message || 'Failed to delete prayer card');
              }

              await dispatch(fetchPrayerSubjects());
              navigation.popToTop();
            } catch (error) {
              console.error('Error deleting prayer card:', error);
              Alert.alert('Error', 'Failed to delete prayer card. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [token, contact, dispatch, navigation]);

  const handleLinkUser = () => {
    Alert.alert(
      'Coming Soon',
      'User linking will be available in a future update.'
    );
  };

  // Account settings handlers (only used when isOwnCard)
  const handlePhoneNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setPhoneNumber(cleaned);
  };

  const handleSaveAccountSettings = async () => {
    if (!token || !user) {
      Alert.alert('Error', 'You must be logged in to update your profile.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    setIsSavingAccount(true);

    try {
      const updateData: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string } = {};

      if (firstName !== (user.firstName || '')) {
        updateData.firstName = firstName;
      }
      if (lastName !== (user.lastName || '')) {
        updateData.lastName = lastName;
      }
      if (email !== user.email) {
        updateData.email = email;
      }
      if (phoneNumber !== (user.phoneNumber || '')) {
        updateData.phoneNumber = phoneNumber;
      }

      if (Object.keys(updateData).length === 0) {
        // No changes
        return;
      }

      const result = await updateUserProfile(token, user.userProfileId, updateData);

      if (result.success && result.data) {
        dispatch(updateUserProfileSuccess(result.data.user));
        Alert.alert('Success', 'Account settings updated successfully!');
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to update account settings. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Error updating account settings:', error);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePasswordSave = async (currentPassword: string, newPassword: string) => {
    if (!token || !user) {
      Alert.alert('Error', 'You must be logged in to change your password.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changeUserPassword(token, user.userProfileId, {
        oldPassword: currentPassword,
        newPassword: newPassword,
      });

      if (result.success) {
        Alert.alert('Success', 'Your password has been changed successfully!');
        setShowChangePasswordModal(false);
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to change password. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Error changing password:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Deleting your account will permanently delete all your data, including prayers, groups, and preferences. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Warning',
              'This action is irreversible. Your account and all associated data will be permanently deleted. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: confirmDeleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!token || !user) {
      Alert.alert('Error', 'You must be logged in to delete your account.');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const result = await deleteUserAccount(token, user.userProfileId);

      if (result.success) {
        navigation.popToTop();
        dispatch(logout());
        setTimeout(() => {
          Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
        }, 500);
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to delete account. Please try again.'
        );
        setIsDeletingAccount(false);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Error deleting account:', error);
      setIsDeletingAccount(false);
    }
  };

  // Check if account settings have changes
  const hasAccountChanges = useMemo(() => {
    if (!isOwnCard || !user) return false;
    return (
      firstName !== (user.firstName || '') ||
      lastName !== (user.lastName || '') ||
      email !== user.email ||
      phoneNumber !== (user.phoneNumber || '')
    );
  }, [isOwnCard, user, firstName, lastName, email, phoneNumber]);

  // Handle adding a member to the group/family
  const handleAddMember = async (memberSubject: PrayerSubject | null) => {
    if (!memberSubject || !token) return;

    // Check if already a member
    if (members.some(m => m.memberPrayerSubjectId === memberSubject.prayerSubjectId)) {
      Alert.alert('Already a Member', `${memberSubject.prayerSubjectDisplayName} is already a member.`);
      return;
    }

    setAddingMember(true);
    try {
      const result = await addMemberToSubject(
        token,
        contact.prayerSubjectId,
        memberSubject.prayerSubjectId
      );

      if (result.success) {
        // Refresh members list
        const membersResult = await getPrayerSubjectMembers(token, contact.prayerSubjectId);
        if (membersResult.success && membersResult.data) {
          setMembers(membersResult.data.members);
        }
        setShowMemberPicker(false);
        setMembershipChanged(true);
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to add member.');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  // Handle removing a member from the group/family
  const handleRemoveMember = async (member: PrayerSubjectMember) => {
    if (!token) return;

    Alert.alert(
      'Remove Member',
      `Remove ${member.memberDisplayName} from this ${subjectType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeMemberFromSubject(
                token,
                contact.prayerSubjectId,
                member.memberPrayerSubjectId
              );

              if (result.success) {
                setMembers(members.filter(m => m.prayerSubjectMembershipId !== member.prayerSubjectMembershipId));
                setMembershipChanged(true);
              } else {
                Alert.alert('Error', result.error?.message || 'Failed to remove member.');
              }
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  // Get individual subjects that aren't already members (for the picker)
  const availableMembers = useMemo(() => {
    if (!prayerSubjects) return [];
    const memberIds = new Set(members.map(m => m.memberPrayerSubjectId));
    // Filter to individuals that aren't already members and aren't this subject
    return prayerSubjects.filter(s =>
      s.prayerSubjectType === 'individual' &&
      !memberIds.has(s.prayerSubjectId) &&
      s.prayerSubjectId !== contact.prayerSubjectId
    );
  }, [prayerSubjects, members, contact.prayerSubjectId]);

  // Get group/family subjects that this individual isn't already a member of
  const availableGroups = useMemo(() => {
    if (!prayerSubjects) return [];
    const parentIds = new Set(parentGroups.map(p => p.groupPrayerSubjectId));
    // Filter to groups/families that don't already have this individual
    return prayerSubjects.filter(s =>
      (s.prayerSubjectType === 'family' || s.prayerSubjectType === 'group') &&
      !parentIds.has(s.prayerSubjectId)
    );
  }, [prayerSubjects, parentGroups]);

  // Handle adding this individual to a group/family
  const handleAddToGroup = async (groupSubject: PrayerSubject | null) => {
    if (!groupSubject || !token) return;

    // Check if already a member
    if (parentGroups.some(p => p.groupPrayerSubjectId === groupSubject.prayerSubjectId)) {
      Alert.alert('Already a Member', `Already a member of ${groupSubject.prayerSubjectDisplayName}.`);
      return;
    }

    setAddingToGroup(true);
    try {
      // Add this individual as a member to the selected group
      const result = await addMemberToSubject(
        token,
        groupSubject.prayerSubjectId,
        contact.prayerSubjectId
      );

      if (result.success) {
        // Refresh parent groups list
        const parentsResult = await getPrayerSubjectParentGroups(token, contact.prayerSubjectId);
        if (parentsResult.success && parentsResult.data) {
          setParentGroups(parentsResult.data.parents);
        }
        setShowGroupPicker(false);
        setMembershipChanged(true);
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to add to group.');
      }
    } catch (error) {
      console.error('Error adding to group:', error);
      Alert.alert('Error', 'Failed to add to group.');
    } finally {
      setAddingToGroup(false);
    }
  };

  // Handle removing this individual from a group/family
  const handleRemoveFromGroup = async (parent: ParentGroup) => {
    if (!token) return;

    Alert.alert(
      'Remove from Group',
      `Remove from ${parent.groupDisplayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeMemberFromSubject(
                token,
                parent.groupPrayerSubjectId,
                contact.prayerSubjectId
              );

              if (result.success) {
                setParentGroups(parentGroups.filter(p => p.prayerSubjectMembershipId !== parent.prayerSubjectMembershipId));
                setMembershipChanged(true);
              } else {
                Alert.alert('Error', result.error?.message || 'Failed to remove from group.');
              }
            } catch (error) {
              console.error('Error removing from group:', error);
              Alert.alert('Error', 'Failed to remove from group.');
            }
          },
        },
      ]
    );
  };

  // Render a prayer item (editable)
  const renderPrayerItem = (prayer: LocalPrayerItem, index: number, _list: LocalPrayerItem[]) => (
    <View key={prayer.id}>
      {index > 0 && <View style={styles.inputRowBorder} />}
      <View style={styles.prayerRequestItem}>
        <Pressable
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
          ]}
          onPress={() => handleRemovePrayer(prayer.id)}
        >
          <Ionicons name="remove-circle" size={24} color={DANGER_RED} />
        </Pressable>
        <View style={styles.prayerRequestInputs}>
          <TextInput
            style={styles.prayerTitleInput}
            placeholder="Prayer title"
            placeholderTextColor={SUBTLE_TEXT}
            value={prayer.title}
            onChangeText={(text) => handleUpdatePrayer(prayer.id, 'title', text)}
            autoCapitalize="sentences"
          />
          <TextInput
            style={[styles.input, styles.prayerDescInput]}
            placeholder="Description (optional)"
            placeholderTextColor={SUBTLE_TEXT}
            value={prayer.description}
            onChangeText={(text) => handleUpdatePrayer(prayer.id, 'description', text)}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            autoCapitalize="sentences"
          />
        </View>
      </View>
    </View>
  );

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

        <Text style={styles.headerTitle}>Edit Prayer Card</Text>

        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
            !displayName.trim() && styles.headerButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!displayName.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={ACTIVE_GREEN} />
          ) : (
            <Ionicons
              name="checkmark"
              size={24}
              color={displayName.trim() ? ACTIVE_GREEN : SUBTLE_TEXT}
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
        {/* Type Selector Section */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              {isOwnCard ? (
                // Read-only display for user's own card
                <View style={styles.typeDisplay}>
                  <FontAwesome
                    name={getTypeIcon(subjectType)}
                    size={16}
                    color={DARK_TEXT}
                    style={styles.typeDisplayIcon}
                  />
                  <Text style={styles.typeDisplayText}>
                    {getTypeLabel(subjectType)}
                  </Text>
                </View>
              ) : (
                // Editable type selector for other cards
                <>
                  <View style={styles.typeSelector}>
                    {TYPE_OPTIONS.map((option) => {
                      // Disable individual option if there are members
                      const isDisabled = option.value === 'individual' && !canChangeToIndividual && !membersLoading;

                      return (
                        <Pressable
                          key={option.value}
                          style={({ pressed }) => [
                            styles.typeOption,
                            subjectType === option.value && styles.typeOptionSelected,
                            pressed && !isDisabled && styles.typeOptionPressed,
                            isDisabled && styles.typeOptionDisabled,
                          ]}
                          onPress={() => handleTypeChange(option.value)}
                          disabled={isDisabled}
                        >
                          <FontAwesome
                            name={option.icon}
                            size={16}
                            color={
                              isDisabled
                                ? SUBTLE_TEXT
                                : subjectType === option.value
                                ? '#FFFFFF'
                                : DARK_TEXT
                            }
                            style={styles.typeOptionIcon}
                          />
                          <Text
                            style={[
                              styles.typeOptionText,
                              subjectType === option.value && styles.typeOptionTextSelected,
                              isDisabled && styles.typeOptionTextDisabled,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {!canChangeToIndividual && !membersLoading && (
                    <Text style={styles.typeHint}>
                      Remove all members to change to Individual
                    </Text>
                  )}
                </>
              )}
            </View>
          </BlurView>
        </View>

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
              <FontAwesome name="user" size={50} color="rgba(255,255,255,0.7)" />
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addPhotoButton,
              pressed && styles.addPhotoButtonPressed,
            ]}
            onPress={handleAddPhoto}
          >
            <Text style={styles.addPhotoText}>
              {contact.photoS3Key ? 'Change Photo' : 'Add Photo'}
            </Text>
          </Pressable>
        </View>

        {/* Name & Note Section */}
        <View style={styles.section}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputRowBorder} />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Note"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </BlurView>
        </View>

        {/* Account Settings Section - only show for user's own card */}
        {isOwnCard && (
          <View style={styles.section}>
            <View style={styles.sectionLabelContainer}>
              <Text style={styles.sectionLabel}>Account Settings</Text>
              <View style={styles.sectionLabelLine} />
            </View>
            <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
              <View style={styles.sectionContent}>
                {/* Name Fields */}
                <View style={styles.inputRow}>
                  <View style={styles.accountFieldRow}>
                    <Ionicons name="person-outline" size={20} color={SUBTLE_TEXT} style={styles.accountFieldIcon} />
                    <View style={styles.nameFieldsContainer}>
                      <TextInput
                        style={[styles.input, styles.accountInput]}
                        placeholder="First Name"
                        placeholderTextColor={SUBTLE_TEXT}
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                      <View style={styles.nameFieldDivider} />
                      <TextInput
                        style={[styles.input, styles.accountInput]}
                        placeholder="Last Name"
                        placeholderTextColor={SUBTLE_TEXT}
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.inputRowBorder} />
                {/* Email Field */}
                <View style={styles.inputRow}>
                  <View style={styles.accountFieldRow}>
                    <Ionicons name="mail-outline" size={20} color={SUBTLE_TEXT} style={styles.accountFieldIcon} />
                    <TextInput
                      style={[styles.input, styles.accountInput]}
                      placeholder="Email"
                      placeholderTextColor={SUBTLE_TEXT}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                <View style={styles.inputRowBorder} />
                {/* Phone Field */}
                <View style={styles.inputRow}>
                  <View style={styles.accountFieldRow}>
                    <Ionicons name="call-outline" size={20} color={SUBTLE_TEXT} style={styles.accountFieldIcon} />
                    <TextInput
                      style={[styles.input, styles.accountInput]}
                      placeholder="Phone Number"
                      placeholderTextColor={SUBTLE_TEXT}
                      value={formatPhoneNumberInput(phoneNumber)}
                      onChangeText={handlePhoneNumberChange}
                      keyboardType="phone-pad"
                      maxLength={14}
                    />
                  </View>
                </View>
                {/* Save Account Settings Button - only show if there are changes */}
                {hasAccountChanges && (
                  <>
                    <View style={styles.inputRowBorder} />
                    <Pressable
                      style={({ pressed }) => [
                        styles.saveAccountButton,
                        pressed && styles.saveAccountButtonPressed,
                      ]}
                      onPress={handleSaveAccountSettings}
                      disabled={isSavingAccount}
                    >
                      {isSavingAccount ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.saveAccountButtonText}>Save Changes</Text>
                      )}
                    </Pressable>
                  </>
                )}
                <View style={styles.inputRowBorder} />
                {/* Change Password Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.accountActionRow,
                    pressed && styles.accountActionRowPressed,
                  ]}
                  onPress={() => setShowChangePasswordModal(true)}
                >
                  <Ionicons name="key-outline" size={20} color={ACTIVE_GREEN} style={styles.accountFieldIcon} />
                  <Text style={styles.accountActionText}>Change Password</Text>
                  <FontAwesome name="chevron-right" size={14} color={SUBTLE_TEXT} />
                </Pressable>
                <View style={styles.inputRowBorder} />
                {/* Delete Account Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteRow,
                    pressed && styles.deleteRowPressed,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={isDeletingAccount}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={DANGER_RED}
                    style={styles.deleteIcon}
                  />
                  <Text style={styles.deleteText}>Delete Account</Text>
                </Pressable>
              </View>
            </BlurView>
          </View>
        )}

        {/* Active Prayer Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>Prayer Requests</Text>
            <View style={styles.sectionLabelLine} />
          </View>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              {activePrayers.map((prayer, index) =>
                renderPrayerItem(prayer, index, activePrayers)
              )}
              {activePrayers.length > 0 && <View style={styles.inputRowBorder} />}
              <Pressable
                style={({ pressed }) => [
                  styles.addRow,
                  pressed && styles.addRowPressed,
                ]}
                onPress={() => handleAddPrayer(false)}
              >
                <Ionicons
                  name="add-circle"
                  size={22}
                  color={ACTIVE_GREEN}
                  style={styles.addIcon}
                />
                <Text style={styles.addRowText}>add prayer request</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>

        {/* Answered Prayers Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>Answered Prayers</Text>
            <View style={styles.sectionLabelLine} />
          </View>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              {answeredPrayers.map((prayer, index) =>
                renderPrayerItem(prayer, index, answeredPrayers)
              )}
              {answeredPrayers.length > 0 && <View style={styles.inputRowBorder} />}
              <Pressable
                style={({ pressed }) => [
                  styles.addRow,
                  pressed && styles.addRowPressed,
                ]}
                onPress={() => handleAddPrayer(true)}
              >
                <Ionicons
                  name="add-circle"
                  size={22}
                  color={ACTIVE_GREEN}
                  style={styles.addIcon}
                />
                <Text style={styles.addRowText}>add answered prayer</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>

        {/* Members Section - only show for family/group types */}
        {subjectType !== 'individual' && (
          <View style={styles.section}>
            <View style={styles.sectionLabelContainer}>
              <Text style={styles.sectionLabel}>Members</Text>
              <View style={styles.sectionLabelLine} />
            </View>
            {/* Hide BlurView when picker is active and there are no members */}
            {(!showMemberPicker || members.length > 0 || membersLoading) && (
              <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
                <View style={styles.sectionContent}>
                  {membersLoading ? (
                    <View style={styles.memberLoadingRow}>
                      <ActivityIndicator size="small" color={ACTIVE_GREEN} />
                      <Text style={styles.memberLoadingText}>Loading members...</Text>
                    </View>
                  ) : (
                    <>
                      {members.map((member, index) => (
                        <View key={member.prayerSubjectMembershipId}>
                          {index > 0 && <View style={styles.inputRowBorder} />}
                          <View style={styles.memberRow}>
                            <View
                              style={[
                                styles.memberAvatar,
                                { backgroundColor: getAvatarColor(member.memberDisplayName) },
                              ]}
                            >
                              <Text style={styles.memberAvatarText}>
                                {getInitials(member.memberDisplayName)}
                              </Text>
                            </View>
                            <Text style={styles.memberName}>{member.memberDisplayName}</Text>
                            <Pressable
                              style={({ pressed }) => [
                                styles.removeButton,
                                pressed && styles.removeButtonPressed,
                              ]}
                              onPress={() => handleRemoveMember(member)}
                            >
                              <Ionicons name="remove-circle" size={24} color={DANGER_RED} />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                      {/* Show add button inside BlurView when picker is not active */}
                      {!showMemberPicker && (
                        <>
                          {members.length > 0 && <View style={styles.inputRowBorder} />}
                          <Pressable
                            style={({ pressed }) => [
                              styles.addRow,
                              pressed && styles.addRowPressed,
                            ]}
                            onPress={() => setShowMemberPicker(true)}
                          >
                            <Ionicons
                              name="add-circle"
                              size={22}
                              color={ACTIVE_GREEN}
                              style={styles.addIcon}
                            />
                            <Text style={styles.addRowText}>add member</Text>
                          </Pressable>
                        </>
                      )}
                    </>
                  )}
                </View>
              </BlurView>
            )}
            {/* Picker rendered outside BlurView to avoid overflow clipping */}
            {showMemberPicker && token && user && (
              <View style={[styles.pickerOutsideBlur, memberDropdownVisible && styles.pickerWithDropdown]}>
                <PrayerSubjectPicker
                  subjects={availableMembers}
                  selectedSubjectId={null}
                  onSelectSubject={handleAddMember}
                  onQuickAddSuccess={async (newSubjectId, displayName) => {
                    // After quick-adding a new contact, refresh subjects then add as member
                    await dispatch(fetchPrayerSubjects());
                    // Create a minimal subject object to add as member
                    const minimalSubject: PrayerSubject = {
                      prayerSubjectId: newSubjectId,
                      prayerSubjectDisplayName: displayName,
                      prayerSubjectType: 'individual',
                      photoS3Key: null,
                      userProfileId: null,
                      useLinkedUserPhoto: false,
                      linkStatus: 'unlinked',
                      displaySequence: 0,
                      notes: null,
                      datetimeCreate: new Date().toISOString(),
                      datetimeUpdate: new Date().toISOString(),
                      createdBy: user.userProfileId,
                      updatedBy: user.userProfileId,
                      prayers: [],
                    };
                    handleAddMember(minimalSubject);
                  }}
                  onDropdownVisibilityChange={setMemberDropdownVisible}
                  filterType="individual-only"
                  showAddContactButton={false}
                  placeholder="Search for a contact to add..."
                  disabled={addingMember}
                  token={token}
                  userProfileId={user.userProfileId}
                />
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
        )}

        {/* Member Of Section - only show for individual types */}
        {subjectType === 'individual' && (
          <View style={styles.section}>
            <View style={styles.sectionLabelContainer}>
              <Text style={styles.sectionLabel}>Member Of</Text>
              <View style={styles.sectionLabelLine} />
            </View>
            {/* Hide BlurView when picker is active and there are no parent groups */}
            {(!showGroupPicker || parentGroups.length > 0 || parentGroupsLoading) && (
              <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
                <View style={styles.sectionContent}>
                  {parentGroupsLoading ? (
                    <View style={styles.memberLoadingRow}>
                      <ActivityIndicator size="small" color={ACTIVE_GREEN} />
                      <Text style={styles.memberLoadingText}>Loading groups...</Text>
                    </View>
                  ) : (
                    <>
                      {parentGroups.map((parent, index) => (
                        <View key={parent.prayerSubjectMembershipId}>
                          {index > 0 && <View style={styles.inputRowBorder} />}
                          <View style={styles.memberRow}>
                            <View
                              style={[
                                styles.memberAvatar,
                                { backgroundColor: getAvatarColor(parent.groupDisplayName) },
                              ]}
                            >
                              <FontAwesome
                                name={parent.groupType === 'family' ? 'home' : 'users'}
                                size={14}
                                color="#FFFFFF"
                              />
                            </View>
                            <View style={styles.groupInfo}>
                              <Text style={styles.memberName}>{parent.groupDisplayName}</Text>
                              <Text style={styles.groupTypeLabel}>
                                {parent.groupType === 'family' ? 'Family' : 'Group'}
                              </Text>
                            </View>
                            <Pressable
                              style={({ pressed }) => [
                                styles.removeButton,
                                pressed && styles.removeButtonPressed,
                              ]}
                              onPress={() => handleRemoveFromGroup(parent)}
                            >
                              <Ionicons name="remove-circle" size={24} color={DANGER_RED} />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                      {/* Show add button inside BlurView when picker is not active */}
                      {!showGroupPicker && (
                        <>
                          {parentGroups.length > 0 && <View style={styles.inputRowBorder} />}
                          <Pressable
                            style={({ pressed }) => [
                              styles.addRow,
                              pressed && styles.addRowPressed,
                            ]}
                            onPress={() => setShowGroupPicker(true)}
                          >
                            <Ionicons
                              name="add-circle"
                              size={22}
                              color={ACTIVE_GREEN}
                              style={styles.addIcon}
                            />
                            <Text style={styles.addRowText}>add to group or family</Text>
                          </Pressable>
                        </>
                      )}
                    </>
                  )}
                </View>
              </BlurView>
            )}
            {/* Picker rendered outside BlurView to avoid overflow clipping */}
            {showGroupPicker && token && user && (
              <View style={[styles.pickerOutsideBlur, groupDropdownVisible && styles.pickerWithDropdown]}>
                <PrayerSubjectPicker
                  subjects={availableGroups}
                  selectedSubjectId={null}
                  onSelectSubject={handleAddToGroup}
                  onDropdownVisibilityChange={setGroupDropdownVisible}
                  filterType="group-family-only"
                  showQuickAdd={false}
                  showAddContactButton={false}
                  placeholder="Search for a group or family..."
                  disabled={addingToGroup}
                  token={token}
                  userProfileId={user.userProfileId}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.cancelButtonPressed,
                  ]}
                  onPress={() => {
                    setShowGroupPicker(false);
                    setGroupDropdownVisible(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Link to User Section - only show for non-own cards */}
        {!isOwnCard && (
          <View style={styles.section}>
            <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
              <View style={styles.sectionContent}>
                {linkedUserId && (
                  <>
                    <View style={styles.linkedUserRow}>
                      <Text style={styles.linkedUserText}>
                        {contact.linkStatus === 'linked'
                          ? 'Linked to Prayerloop user'
                          : contact.linkStatus === 'pending'
                          ? 'Link request pending'
                          : `Linked to user #${linkedUserId}`}
                      </Text>
                      {contact.linkStatus !== 'linked' && (
                        <Pressable
                          onPress={() => setLinkedUserId(null)}
                          style={({ pressed }) => [
                            styles.removeButton,
                            pressed && styles.removeButtonPressed,
                          ]}
                        >
                          <Ionicons name="remove-circle" size={24} color={DANGER_RED} />
                        </Pressable>
                      )}
                    </View>
                    <View style={styles.inputRowBorder} />
                  </>
                )}
                <Pressable
                  style={({ pressed }) => [
                    styles.addRow,
                    pressed && styles.addRowPressed,
                  ]}
                  onPress={handleLinkUser}
                >
                  <Ionicons
                    name="add-circle"
                    size={22}
                    color={ACTIVE_GREEN}
                    style={styles.addIcon}
                  />
                  <Text style={styles.addRowText}>link card to prayerloop user</Text>
                </Pressable>
              </View>
            </BlurView>
          </View>
        )}

        {/* Delete Section - only show if not user's own card */}
        {!isOwnCard && (
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
                  <Text style={styles.deleteText}>Delete Prayer Card</Text>
                </Pressable>
              </View>
            </BlurView>
          </View>
        )}

        {/* Bottom padding for scroll */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      {/* Loading Overlay */}
      {(isSaving || isDeleting || isDeletingAccount) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.extraLargeSpinner}>
              <ActivityIndicator size="large" color="#b2d8b2" />
            </View>
            <Text style={styles.loadingText}>
              {isDeleting ? 'Deleting...' : isDeletingAccount ? 'Deleting Account...' : 'Saving...'}
            </Text>
          </View>
        </View>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSave={handleChangePasswordSave}
        isSaving={isChangingPassword}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  accountActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 14,
  },
  accountActionRowPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
  },
  accountActionText: {
    color: ACTIVE_GREEN,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  accountFieldIcon: {
    marginRight: 12,
    width: 24,
  },
  accountFieldRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  accountInput: {
    flex: 1,
  },
  addIcon: {
    marginRight: 8,
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
  addRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 12,
  },
  addRowPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
  },
  addRowText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
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
  extraLargeSpinner: {
    transform: [{ scale: 2 }],
  },
  groupInfo: {
    flex: 1,
  },
  groupTypeLabel: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginTop: 2,
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
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 36,
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
  linkedUserRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  linkedUserText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
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
  memberName: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 60,
  },
  nameFieldDivider: {
    backgroundColor: 'rgba(45, 62, 49, 0.1)',
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  nameFieldsContainer: {
    flex: 1,
  },
  pickerOutsideBlur: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  pickerWithDropdown: {
    marginBottom: 200,
  },
  prayerDescInput: {
    marginTop: 4,
    minHeight: 40,
  },
  prayerRequestInputs: {
    flex: 1,
  },
  prayerRequestItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingVertical: 10,
  },
  prayerTitleInput: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    paddingVertical: 4,
  },
  removeButton: {
    marginRight: 8,
    padding: 4,
  },
  removeButtonPressed: {
    opacity: 0.7,
  },
  saveAccountButton: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 8,
    marginBottom: 4,
    marginTop: 12,
    paddingVertical: 12,
  },
  saveAccountButtonPressed: {
    opacity: 0.8,
  },
  saveAccountButtonText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
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
  typeDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  typeDisplayIcon: {
    marginRight: 8,
  },
  typeDisplayText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  typeHint: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    paddingBottom: 8,
    textAlign: 'center',
  },
  typeOption: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeOptionDisabled: {
    opacity: 0.4,
  },
  typeOptionIcon: {
    marginRight: 6,
  },
  typeOptionPressed: {
    opacity: 0.7,
  },
  typeOptionSelected: {
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 8,
  },
  typeOptionText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  typeOptionTextDisabled: {
    color: SUBTLE_TEXT,
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
  typeSelector: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
});
