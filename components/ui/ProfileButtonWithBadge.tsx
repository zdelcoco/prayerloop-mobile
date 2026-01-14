import React from 'react';
import { useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';
import ProfileButton from './ProfileButton';

interface ProfileButtonWithBadgeProps {
  firstName: string;
  lastName: string;
  onPress: () => void;
  size?: number;
}

/**
 * Wrapper for ProfileButton that automatically includes unread notification badge
 * Reads unreadCount directly from Redux to avoid stale closure issues
 */
export default function ProfileButtonWithBadge({
  firstName,
  lastName,
  onPress,
  size,
}: ProfileButtonWithBadgeProps) {
  const unreadCount = useAppSelector((state: RootState) => state.notifications.unreadCount);

  return (
    <ProfileButton
      firstName={firstName}
      lastName={lastName}
      onPress={onPress}
      size={size}
      badge={unreadCount}
    />
  );
}
