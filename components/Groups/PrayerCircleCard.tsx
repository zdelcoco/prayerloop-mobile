import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Group, User } from '@/util/shared.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

interface PrayerCircleCardProps {
  group: Group;
  members?: User[];
  memberCount?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  isActive?: boolean;
  isDragging?: boolean;
  showDragHandle?: boolean;
}

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

// Format members string for display
const formatMembersText = (members?: User[], memberCount?: number): string => {
  if (members && members.length > 0) {
    const names = members.slice(0, 3).map(m => m.firstName || 'Unknown');
    if (members.length > 3) {
      return `${names.join(', ')} +${members.length - 3} more`;
    }
    return names.join(', ');
  }
  if (memberCount !== undefined) {
    return `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
  }
  return 'No members yet';
};

const PrayerCircleCard: React.FC<PrayerCircleCardProps> = ({
  group,
  members,
  memberCount,
  onPress,
  onLongPress,
  isActive = false,
  isDragging = false,
  showDragHandle = false,
}) => {
  const initials = getInitials(group.groupName);
  const avatarColor = getAvatarColor(group.groupName);
  const membersText = formatMembersText(members, memberCount);

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={isDragging}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
          (isActive || isDragging) && styles.active,
        ]}
      >
        <View style={styles.cardContent}>
        {/* Drag Handle */}
        {showDragHandle && (
          <View style={styles.dragHandle}>
            <FontAwesome name="bars" size={16} color={SUBTLE_TEXT} />
          </View>
        )}

        {/* Avatar with circle icon */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarInitials, { backgroundColor: avatarColor }]}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
          {/* Circle badge indicating it's a prayer circle */}
          <View style={styles.typeBadge}>
            <FontAwesome
              name="users"
              size={10}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* Circle Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.displayName} numberOfLines={1}>
            {group.groupName}
          </Text>

          {/* Description */}
          {group.groupDescription && (
            <Text style={styles.description} numberOfLines={2}>
              {group.groupDescription}
            </Text>
          )}

          {/* Members count */}
          <Text style={styles.subtitle} numberOfLines={1}>
            {membersText}
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
  active: {
    backgroundColor: 'rgba(144, 197, 144, 0.5)',
    transform: [{ scale: 1.02 }],
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
  description: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  displayName: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  dragHandle: {
    marginRight: 12,
    opacity: 0.5,
    padding: 4,
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

export default PrayerCircleCard;
