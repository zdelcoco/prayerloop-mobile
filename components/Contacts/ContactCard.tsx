import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { PrayerSubject } from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

interface ContactCardProps {
  contact: PrayerSubject;
  isCurrentUser?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  showSeparator?: boolean;
  isActive?: boolean;
}

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
const getTypeIcon = (type: PrayerSubject['prayerSubjectType']): string => {
  switch (type) {
    case 'family':
      return 'home';
    case 'group':
      return 'users';
    default:
      return 'user';
  }
};

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  isCurrentUser = false,
  onPress,
  onLongPress,
  showSeparator = true,
  isActive = false,
}) => {
  const initials = getInitials(contact.prayerSubjectDisplayName);
  const avatarColor = getAvatarColor(contact.prayerSubjectDisplayName);
  const hasPhoto = contact.photoS3Key !== null;
  const prayerCount = contact.prayers?.length || 0;

  // Determine subtitle text
  const getSubtitle = () => {
    if (isCurrentUser) {
      return 'My Card';
    }
    if (prayerCount > 0) {
      return `${prayerCount} prayer${prayerCount !== 1 ? 's' : ''}`;
    }
    return contact.notes || 'No prayers yet';
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        isActive && styles.active,
      ]}
    >
      <View style={styles.cardContent}>
        {/* Avatar - Photo or Initials */}
        <View style={styles.avatarContainer}>
          {hasPhoto ? (
            <Image
              source={{ uri: contact.photoS3Key! }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatarInitials, { backgroundColor: avatarColor }]}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}

          {/* Type indicator badge for family/group */}
          {contact.prayerSubjectType !== 'individual' && (
            <View style={styles.typeBadge}>
              <FontAwesome
                name={getTypeIcon(contact.prayerSubjectType)}
                size={10}
                color="#FFFFFF"
              />
            </View>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.displayName} numberOfLines={1}>
            {contact.prayerSubjectDisplayName}
          </Text>

          {/* Subtitle showing "My Card", prayer count, or notes preview */}
          <Text style={styles.subtitle} numberOfLines={1}>
            {getSubtitle()}
          </Text>
        </View>

        {/* Right side - Link status indicator and chevron */}
        <View style={styles.rightContainer}>
          {contact.linkStatus === 'linked' && (
            <FontAwesome
              name="link"
              size={12}
              color={ACTIVE_GREEN}
              style={styles.linkIcon}
            />
          )}
          {contact.linkStatus === 'pending' && (
            <FontAwesome
              name="clock-o"
              size={12}
              color="#FF9800"
              style={styles.linkIcon}
            />
          )}
          <FontAwesome
            name="chevron-right"
            size={14}
            color={SUBTLE_TEXT}
          />
        </View>
      </View>

      {/* Separator line */}
      {showSeparator && <View style={styles.separator} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  active: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
    transform: [{ scale: 1.02 }],
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatarImage: {
    backgroundColor: MUTED_GREEN,
    borderRadius: 25,
    height: 50,
    width: 50,
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
    paddingVertical: 12,
  },
  container: {
    backgroundColor: 'transparent',
  },
  displayName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
    marginBottom: 2,
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
  linkIcon: {
    marginRight: 4,
  },
  pressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
  },
  rightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  separator: {
    backgroundColor: 'rgba(45, 62, 49, 0.15)',
    height: StyleSheet.hairlineWidth,
    marginLeft: 78,
  },
  subtitle: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
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

export default ContactCard;
