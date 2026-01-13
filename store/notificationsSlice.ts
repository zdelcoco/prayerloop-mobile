import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';

import { getUserNotifications } from '@/util/getUserNotifications';
import { toggleNotificationStatus } from '@/util/toggleNotificationStatus';
import { deleteNotification } from '@/util/deleteNotification';
import { markAllNotificationsRead } from '@/util/markAllNotificationsRead';

import { Notification, NotificationStatus } from '@/util/notification.types';

interface NotificationsState {
  notifications: Notification[];
  status: 'idle' | 'loading' | 'toggling' | 'deleting' | 'marking' | 'succeeded' | 'failed';
  error: string | null;
  unreadCount: number;
}

const initialState: NotificationsState = {
  notifications: [],
  status: 'idle',
  error: null,
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    getNotificationsStart: (state) => {
      state.status = 'loading';
      state.error = null;
    },
    getNotificationsSuccess: (state, action: PayloadAction<Notification[]>) => {
      state.status = 'succeeded';
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(
        (n) => n.notificationStatus === NotificationStatus.UNREAD
      ).length;
      state.error = null;
    },
    getNotificationsFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    toggleNotificationStatusStart: (state) => {
      state.status = 'toggling';
    },
    toggleNotificationStatusSuccess: (state, action: PayloadAction<number>) => {
      state.status = 'succeeded';
      const notification = state.notifications.find(
        (n) => n.notificationId === action.payload
      );
      if (notification) {
        // Toggle status locally
        notification.notificationStatus =
          notification.notificationStatus === NotificationStatus.READ
            ? NotificationStatus.UNREAD
            : NotificationStatus.READ;
        // Recalculate unread count
        state.unreadCount = state.notifications.filter(
          (n) => n.notificationStatus === NotificationStatus.UNREAD
        ).length;
      }
    },
    toggleNotificationStatusFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    deleteNotificationStart: (state) => {
      state.status = 'deleting';
    },
    deleteNotificationSuccess: (state, action: PayloadAction<number>) => {
      state.status = 'succeeded';
      state.notifications = state.notifications.filter(
        (n) => n.notificationId !== action.payload
      );
      // Recalculate unread count
      state.unreadCount = state.notifications.filter(
        (n) => n.notificationStatus === NotificationStatus.UNREAD
      ).length;
    },
    deleteNotificationFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    markAllReadStart: (state) => {
      state.status = 'marking';
    },
    markAllReadSuccess: (state) => {
      state.status = 'succeeded';
      // Mark all notifications as read locally
      state.notifications.forEach((notification) => {
        notification.notificationStatus = NotificationStatus.READ;
      });
      state.unreadCount = 0;
    },
    markAllReadFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearNotifications: (state) => {
      state.status = 'idle';
      state.notifications = [];
      state.unreadCount = 0;
      state.error = null;
    },
  },
});

export const {
  getNotificationsStart,
  getNotificationsSuccess,
  getNotificationsFailure,
  toggleNotificationStatusStart,
  toggleNotificationStatusSuccess,
  toggleNotificationStatusFailure,
  deleteNotificationStart,
  deleteNotificationSuccess,
  deleteNotificationFailure,
  markAllReadStart,
  markAllReadSuccess,
  markAllReadFailure,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

// Thunk type definition
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

// Thunk actions

/**
 * Fetch all notifications for the current user
 */
export const fetchNotifications = (): AppThunk => async (dispatch, getState) => {
  const { auth, notifications } = getState();
  if (!auth.isAuthenticated || !auth.token || !auth.user) {
    dispatch(getNotificationsFailure('User not authenticated'));
    return;
  }

  if (notifications.status === 'loading') {
    console.log('fetchNotifications already in progress.');
    return;
  }

  dispatch(getNotificationsStart());
  try {
    const result = await getUserNotifications(auth.token, auth.user.userProfileId);
    if (result.success && result.data) {
      dispatch(getNotificationsSuccess(result.data));
    } else {
      dispatch(
        getNotificationsFailure(result.error?.message || 'Failed to fetch notifications')
      );
    }
  } catch (error) {
    dispatch(getNotificationsFailure('An error occurred while fetching notifications'));
  }
};

/**
 * Toggle notification read/unread status
 */
export const toggleNotification =
  (notificationId: number): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(toggleNotificationStatusFailure('User not authenticated'));
      return;
    }

    dispatch(toggleNotificationStatusStart());
    try {
      const result = await toggleNotificationStatus(
        auth.token,
        auth.user.userProfileId,
        notificationId
      );
      if (result.success) {
        dispatch(toggleNotificationStatusSuccess(notificationId));
      } else {
        dispatch(
          toggleNotificationStatusFailure(
            result.error?.message || 'Failed to toggle notification status'
          )
        );
      }
    } catch (error) {
      dispatch(
        toggleNotificationStatusFailure('An error occurred while toggling notification')
      );
    }
  };

/**
 * Delete a notification
 */
export const removeNotification =
  (notificationId: number): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(deleteNotificationFailure('User not authenticated'));
      return;
    }

    dispatch(deleteNotificationStart());
    try {
      const result = await deleteNotification(
        auth.token,
        auth.user.userProfileId,
        notificationId
      );
      if (result.success) {
        dispatch(deleteNotificationSuccess(notificationId));
      } else {
        dispatch(
          deleteNotificationFailure(result.error?.message || 'Failed to delete notification')
        );
      }
    } catch (error) {
      dispatch(deleteNotificationFailure('An error occurred while deleting notification'));
    }
  };

/**
 * Mark all notifications as read
 */
export const markAllAsRead = (): AppThunk => async (dispatch, getState) => {
  const { auth } = getState();
  if (!auth.isAuthenticated || !auth.token || !auth.user) {
    dispatch(markAllReadFailure('User not authenticated'));
    return;
  }

  dispatch(markAllReadStart());
  try {
    const result = await markAllNotificationsRead(auth.token, auth.user.userProfileId);
    if (result.success) {
      dispatch(markAllReadSuccess());
    } else {
      dispatch(
        markAllReadFailure(result.error?.message || 'Failed to mark all as read')
      );
    }
  } catch (error) {
    dispatch(markAllReadFailure('An error occurred while marking all as read'));
  }
};
