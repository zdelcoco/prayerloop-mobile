export interface UserPreference {
  userPreferenceId: number;
  userId: number;
  preferenceKey: string;
  preferenceValue: string;
  isActive: boolean;
  datetimeCreate: string;
  datetimeUpdate: string;
}

export interface UserPreferenceUpdate {
  preferenceKey: string;
  preferenceValue: string;
  isActive: boolean;
}

export interface PrayerReminder {
  id: string;
  isEnabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'specific';
  time: string; // HH:MM format - used for daily, weekly, monthly
  specificDays?: number[]; // 0-6 for Sunday-Saturday, used when frequency is 'specific'
  specificDayTimes?: { [day: number]: string }; // day -> time mapping for specific days
  message: string;
}