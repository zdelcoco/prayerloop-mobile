import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { logout } from '@/store/authSlice';
import { router } from 'expo-router';
import { Share, Alert } from 'react-native';
import { createGroupInvite } from '@/util/createGroupInvite';
import { generateGroupInviteLink } from '@/util/deepLinks';
import { RootState } from '@/store/store';
import type { ContextMenuOption } from '@/components/ui/ContextMenu';

export type ContextMenuType = 'cards' | 'home' | 'groups' | 'groupDetail';

interface UseContextMenuProps {
  type: ContextMenuType;
  groupId?: number;
  groupName?: string;
  prayerCount?: number;
  groupCreatorId?: number;
}

export function useContextMenu({ type, groupId, groupName, prayerCount = 0, groupCreatorId }: UseContextMenuProps) {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  const handleViewCards = () => {
    router.replace('/(tabs)/cards/');
  };

  const handleViewGroups = () => {
    router.replace('/(tabs)/groups/');
  };

  const handleUserPreferences = () => {
    router.push('/(tabs)/userProfile');
  };

  const handleAddPrayer = () => {
    if (type === 'cards') {
      // Pass returnTo so the modal knows where to go back to
      router.push('/(tabs)/cards/PrayerModal?mode=add&returnTo=current');
    } else if (type === 'groupDetail' && groupId && groupName) {
      router.push(`/(tabs)/groups/PrayerModal?mode=add&groupProfileId=${groupId}&groupName=${encodeURIComponent(groupName)}`);
    }
  };

  const handleStartPrayerSession = () => {
    // Access global function set by each screen
    if (type === 'cards') {
      if ((global as any).cardsSetPrayerSessionVisible) {
        (global as any).cardsSetPrayerSessionVisible(true);
      }
    } else if (type === 'groups') {
      if ((global as any).groupsSetPrayerSessionVisible) {
        (global as any).groupsSetPrayerSessionVisible(true);
      }
    } else if (type === 'groupDetail') {
      if ((global as any).groupSetPrayerSessionVisible) {
        (global as any).groupSetPrayerSessionVisible(true);
      }
    }
  };

  const handleCreateGroup = () => {
    router.push('/(tabs)/groups/GroupModal');
  };

  const handleJoinGroup = () => {
    router.push('/(tabs)/groups/JoinGroupModal');
  };

  const handleViewGroupMembers = () => {
    if (groupId && groupName) {
      router.push({
        pathname: '/(tabs)/groups/UsersModal',
        params: {
          groupProfileId: groupId,
          groupName: groupName,
          groupCreatorId: groupCreatorId
        }
      });
    }
  };

  const handleInviteToGroup = async () => {
    if (!groupId || !groupName || !token) return;

    try {
      const result = await createGroupInvite(token, groupId);
      if (result.success && result.data?.inviteCode) {
        const deepLink = generateGroupInviteLink(result.data.inviteCode);
        const inviteMessage = `You're invited to join "${groupName}" on PrayerLoop!\n\nTap this link to join:\n${deepLink}\n\nOr enter this code manually:\n${result.data.inviteCode}`;

        try {
          await Share.share({
            message: inviteMessage,
            title: 'PrayerLoop Group Invite',
          });
        } catch (shareError) {
          console.error('Share error:', shareError);
          // If sharing fails, show the code in an alert
          Alert.alert(
            'Invite Generated',
            `Deep link:\n${deepLink}\n\nInvite code: ${result.data.inviteCode}\n\nShare either with someone to invite them to ${groupName}`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Error', 'Failed to create invite code');
      }
    } catch (error) {
      console.error('Invite error:', error);
      Alert.alert('Error', 'Failed to create invite code');
    }
  };

  const getMenuOptions = (): { title: string; options: ContextMenuOption[] } => {
    switch (type) {
      case 'cards':
        const cardsOptions: ContextMenuOption[] = [
          // Only show Start Prayer Session if there are prayers
          ...(prayerCount > 0 ? [{ title: 'Start Prayer Session', action: handleStartPrayerSession, style: 'primary' as const }] : []),
          { title: 'Add Prayer', action: handleAddPrayer, style: 'default' as const },
          { title: 'User Preferences', action: handleUserPreferences, style: 'default' as const },
          { title: 'Logout', action: handleLogout, style: 'destructive' as const },
        ];
        
        return {
          title: 'Prayer Cards Menu',
          options: cardsOptions,
        };

      case 'home':
        return {
          title: 'Home Menu',
          options: [
            { title: 'View Cards', action: handleViewCards, style: 'default' as const },
            { title: 'View Groups', action: handleViewGroups, style: 'default' as const },
            { title: 'Logout', action: handleLogout, style: 'destructive' as const },
          ],
        };

      case 'groups':
        return {
          title: 'Prayer Circles Menu',
          options: [
            { title: 'Start Prayer Session', action: handleStartPrayerSession, style: 'default' as const },
            { title: 'Create Group', action: handleCreateGroup, style: 'default' as const },
            { title: 'Join Group', action: handleJoinGroup, style: 'default' as const },
            { title: 'User Preferences', action: handleUserPreferences, style: 'default' as const },
            { title: 'Logout', action: handleLogout, style: 'destructive' as const },
          ],
        };

      case 'groupDetail':
        const groupDetailOptions: ContextMenuOption[] = [
          // Only show Start Prayer Session if there are prayers - should be first and primary
          ...(prayerCount > 0 ? [{ title: 'Start Prayer Session', action: handleStartPrayerSession, style: 'primary' as const }] : []),
          { title: 'Add Prayer', action: handleAddPrayer, style: 'default' as const },
          { title: 'Manage Group', action: handleViewGroupMembers, style: 'default' as const },
          { title: 'Invite to Group', action: handleInviteToGroup, style: 'blue' as const },
          { title: 'Logout', action: handleLogout, style: 'destructive' as const },
        ];
        
        return {
          title: `${groupName || 'Group'} Menu`,
          options: groupDetailOptions,
        };

      default:
        return {
          title: 'Menu',
          options: [
            { title: 'Logout', action: handleLogout, style: 'destructive' as const },
          ],
        };
    }
  };

  return getMenuOptions();
}