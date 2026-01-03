import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';
import { User } from '../../util/shared.types';
import { selectPrayerSubjects } from '../../store/prayerSubjectsSlice';
import { formatPhoneNumber } from '../../util/phoneFormatter';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

interface UserProfileCardProps {
  user: User;
}

// Generate initials from user name
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.[0]?.toUpperCase() || '';
  const last = lastName?.[0]?.toUpperCase() || '';
  return first + last || '?';
};

// Generate a consistent color based on the name
const getAvatarColor = (name: string): string => {
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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
}) => {
  // Get the user's own prayer subject from the store
  const prayerSubjects = useSelector(selectPrayerSubjects);
  const userPrayerSubject = prayerSubjects?.find(
    (s) => s.userProfileId === user?.userProfileId
  );

  if (!user) {
    return null;
  }

  const { email, phoneNumber, firstName, lastName } = user;
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';
  const initials = getInitials(firstName, lastName);
  const avatarColor = getAvatarColor(fullName);
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const handlePress = () => {
    if (userPrayerSubject) {
      // Navigate to EditPrayerCardModal with the user's prayer subject
      // Pass returnTo so it knows to go back to home screen
      router.push({
        pathname: '/cards/EditPrayerCardModal',
        params: {
          contact: JSON.stringify(userPrayerSubject),
          returnTo: 'home',
        },
      });
    }
  };

  // Build subtitle with email and optional phone
  const getSubtitle = () => {
    if (formattedPhone) {
      return `${email} • ${formattedPhone}`;
    }
    return email;
  };

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={handlePress}
        disabled={!userPrayerSubject}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
          !userPrayerSubject && styles.disabled,
        ]}
      >
        <View style={styles.cardContent}>
          {/* Avatar with user icon badge */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarInitials, { backgroundColor: avatarColor }]}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
            {/* User badge indicating it's a profile */}
            <View style={styles.typeBadge}>
              <FontAwesome
                name="user"
                size={10}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.displayName} numberOfLines={1}>
              {fullName}
            </Text>

            <Text style={styles.subtitle} numberOfLines={2}>
              {getSubtitle()}
            </Text>

            <Text style={styles.actionHint}>
              Tap to edit profile
            </Text>
          </View>

          {/* Right side - chevron */}
          <View style={styles.rightContainer}>
            <FontAwesome
              name="chevron-right"
              size={14}
              color={SUBTLE_TEXT}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  actionHint: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatarInitials: {
    alignItems: 'center',
    borderRadius: 25,
    elevation: 2,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 50,
  },
  cardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  displayName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 18,
    letterSpacing: 1,
  },
  pressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
  },
  rightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  subtitle: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginTop: 2,
  },
  typeBadge: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderColor: '#F6EDD9',
    borderRadius: 10,
    borderWidth: 2,
    bottom: -2,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 20,
  },
});

export default UserProfileCard;
