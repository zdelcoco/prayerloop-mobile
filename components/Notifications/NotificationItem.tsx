import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Notification, NotificationTypes, NotificationStatus } from '@/util/notification.types';
import { formatTimeAgo } from '@/util/dateFormat';

const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';
const UNREAD_BG = '#f0fdf4'; // Very light green for unread
const READ_BG = '#ffffff';

interface NotificationItemProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onToggleRead?: (notification: Notification) => void;
  onDelete?: (notification: Notification) => void;
}

// Get icon and color based on notification type
const getNotificationIcon = (
  type: string
): { name: string; type: 'fontawesome' | 'ionicons'; color: string } => {
  switch (type) {
    case NotificationTypes.PRAYER_CREATED_FOR_YOU:
      return { name: 'hands-praying', type: 'fontawesome', color: '#4CAF50' };
    case NotificationTypes.PRAYER_EDITED_BY_SUBJECT:
      return { name: 'edit', type: 'fontawesome', color: '#2196F3' };
    case NotificationTypes.PRAYER_SHARED:
      return { name: 'share-alt', type: 'fontawesome', color: '#FF9800' };
    case NotificationTypes.GROUP_INVITE:
      return { name: 'users', type: 'fontawesome', color: '#9C27B0' };
    case NotificationTypes.GROUP_MEMBER_JOINED:
      return { name: 'user-plus', type: 'fontawesome', color: '#00BCD4' };
    default:
      return { name: 'bell', type: 'ionicons', color: ACTIVE_GREEN };
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onToggleRead,
  onDelete,
}) => {
  const isUnread = notification.notificationStatus === NotificationStatus.UNREAD;
  const iconInfo = getNotificationIcon(notification.notificationType);

  // Format timestamp
  const timeAgo = formatTimeAgo(notification.datetimeCreate);

  const handlePress = () => {
    onPress?.(notification);
  };

  const handleToggleRead = () => {
    onToggleRead?.(notification);
  };

  const handleDelete = () => {
    onDelete?.(notification);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.notificationCard,
          {
            backgroundColor: isUnread ? UNREAD_BG : READ_BG,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={handlePress}
      >
        {/* Left side - Icon and content */}
        <View style={styles.leftContent}>
          {/* Notification icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconInfo.color + '20' }]}>
            {iconInfo.type === 'ionicons' ? (
              <Ionicons name={iconInfo.name as any} size={20} color={iconInfo.color} />
            ) : (
              <FontAwesome name={iconInfo.name as any} size={20} color={iconInfo.color} />
            )}
          </View>

          {/* Message and timestamp */}
          <View style={styles.textContainer}>
            <Text style={[styles.message, isUnread && styles.unreadText]} numberOfLines={2}>
              {notification.notificationMessage}
            </Text>
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>
        </View>

        {/* Right side - Unread indicator */}
        {isUnread && <View style={styles.unreadDot} />}
      </Pressable>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={handleToggleRead}
        >
          <Ionicons
            name={isUnread ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={20}
            color={ACTIVE_GREEN}
          />
          <Text style={styles.actionText}>{isUnread ? 'Mark Read' : 'Mark Unread'}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#f44336" />
          <Text style={[styles.actionText, { color: '#f44336' }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderColor: 'rgba(46, 125, 50, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  actionText: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  container: {
    backgroundColor: 'transparent',
    marginBottom: 8,
    paddingHorizontal: 0, // Remove horizontal padding since card already has padding
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  leftContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  message: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  notificationCard: {
    borderColor: 'rgba(46, 125, 50, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  timestamp: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
  },
  unreadDot: {
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 4,
    height: 8,
    marginLeft: 8,
    width: 8,
  },
  unreadText: {
    fontFamily: 'InstrumentSans-SemiBold',
  },
});

export default NotificationItem;
