import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchNotifications,
  toggleNotification,
  removeNotification,
  markAllAsRead,
} from '@/store/notificationsSlice';
import { RootState } from '@/store/store';
import { NotificationItem } from '@/components/Notifications';
import { Notification } from '@/util/notification.types';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const NotificationsCard = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, status } = useAppSelector(
    (state: RootState) => state.notifications
  );

  // Load notifications when component mounts
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Handle notification press (mark as read when tapped)
  const handleNotificationPress = (notification: Notification) => {
    if (notification.notificationStatus === 'UNREAD') {
      dispatch(toggleNotification(notification.notificationId));
    }
  };

  // Handle toggle read/unread
  const handleToggleRead = (notification: Notification) => {
    dispatch(toggleNotification(notification.notificationId));
  };

  // Handle delete
  const handleDelete = (notification: Notification) => {
    dispatch(removeNotification(notification.notificationId));
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllAsRead());
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchNotifications());
  };

  const isLoading = status === 'loading';
  const hasNotifications = notifications.length > 0;

  return (
    <View style={styles.cardContainer}>
      {/* Header with title and actions */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {hasNotifications && unreadCount > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.markAllButton,
              pressed && styles.markAllButtonPressed,
            ]}
            onPress={handleMarkAllAsRead}
          >
            <Ionicons name="checkmark-done" size={14} color={ACTIVE_GREEN} />
            <Text style={styles.markAllText}>Mark All Read</Text>
          </Pressable>
        )}
      </View>

      {/* Notifications list or empty state */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={ACTIVE_GREEN}
          />
        }
      >
        {!hasNotifications ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={SUBTLE_TEXT} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.notificationId}
              notification={notification}
              onPress={handleNotificationPress}
              onToggleRead={handleToggleRead}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    maxHeight: 500, // Limit height so it doesn't take over the whole screen
    overflow: 'hidden',
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySubtitle: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyTitle: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  markAllButton: {
    alignItems: 'center',
    borderColor: 'rgba(46, 125, 50, 0.3)',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  markAllButtonPressed: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  markAllText: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 12,
  },
  scrollContent: {
    gap: 0, // NotificationItem has its own margin
  },
  scrollView: {
    maxHeight: 400,
  },
  title: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: '#f44336',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 11,
  },
});

export default NotificationsCard;
