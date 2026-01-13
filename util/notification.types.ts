// Notification type constants (match backend)
export const NotificationTypes = {
  PRAYER_CREATED_FOR_YOU: 'PRAYER_CREATED_FOR_YOU',
  PRAYER_EDITED_BY_SUBJECT: 'PRAYER_EDITED_BY_SUBJECT',
  PRAYER_SHARED: 'PRAYER_SHARED',
  GROUP_INVITE: 'GROUP_INVITE',
  GROUP_MEMBER_JOINED: 'GROUP_MEMBER_JOINED',
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

// Notification status constants
export const NotificationStatus = {
  READ: 'READ',
  UNREAD: 'UNREAD',
} as const;

export type NotificationStatusType = typeof NotificationStatus[keyof typeof NotificationStatus];

export interface Notification {
  notificationId: number;
  userProfileId: number;
  notificationType: NotificationType;
  notificationMessage: string;
  notificationStatus: NotificationStatusType;
  datetimeCreate: string;
  datetimeUpdate: string;
  createdBy: number;
  updatedBy: number;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
}

export interface ToggleNotificationStatusResponse {
  message: string;
}

export interface DeleteNotificationResponse {
  message: string;
}

export interface MarkAllReadResponse {
  message: string;
  updatedCount: number;
}
