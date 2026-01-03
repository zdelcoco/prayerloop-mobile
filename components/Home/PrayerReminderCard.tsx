import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { PrayerReminder } from '../../util/userPreferences.types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PrayerReminderCard = () => {
  const [reminder, setReminder] = useState<PrayerReminder>({
    id: 'prayer-reminder-1',
    isEnabled: false,
    frequency: 'daily',
    time: '09:00',
    specificDays: [],
    specificDayTimes: {},
    message: "It's time to pray! Press here to open prayerloop.",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [selectedDayForTime, setSelectedDayForTime] = useState<number | null>(
    null
  );
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => {
    loadReminder();
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setNotificationPermission(finalStatus === 'granted');
  };

  const loadReminder = async () => {
    try {
      const storedReminder = await AsyncStorage.getItem('prayerReminder');
      if (storedReminder) {
        const parsed = JSON.parse(storedReminder);
        // Ensure backward compatibility with old format
        if (!parsed.specificDayTimes) {
          parsed.specificDayTimes = {};
        }
        setReminder(parsed);
      }
    } catch (error) {
      console.error('Error loading reminder:', error);
    }
  };

  const saveReminder = async (newReminder: PrayerReminder) => {
    try {
      await AsyncStorage.setItem('prayerReminder', JSON.stringify(newReminder));
      setReminder(newReminder);

      if (newReminder.isEnabled) {
        await scheduleNotifications(newReminder);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', 'Failed to save reminder settings');
    }
  };

  const scheduleNotifications = async (reminderConfig: PrayerReminder) => {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!notificationPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications to use prayer reminders'
      );
      return;
    }

    try {
      if (reminderConfig.frequency === 'daily') {
        const [hours, minutes] = reminderConfig.time.split(':').map(Number);

        // Use DAILY trigger for repeating daily notifications
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Prayer Time',
            body: reminderConfig.message,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hours,
            minute: minutes,
          },
        });
      } else if (reminderConfig.frequency === 'weekly') {
        // Schedule for Sunday (weekday: 1)
        const [hours, minutes] = reminderConfig.time.split(':').map(Number);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Prayer Time',
            body: reminderConfig.message,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: 1, // Sunday
            hour: hours,
            minute: minutes,
          },
        });
      } else if (reminderConfig.frequency === 'monthly') {
        // Schedule for first day of each month
        const [hours, minutes] = reminderConfig.time.split(':').map(Number);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Prayer Time',
            body: reminderConfig.message,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            day: 1,
            hour: hours,
            minute: minutes,
          },
        });
      } else if (
        reminderConfig.frequency === 'specific' &&
        reminderConfig.specificDayTimes
      ) {
        // Schedule for specific days with their individual times
        for (const [dayStr, timeStr] of Object.entries(
          reminderConfig.specificDayTimes
        )) {
          const day = parseInt(dayStr);
          const [hours, minutes] = timeStr.split(':').map(Number);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Prayer Time',
              body: reminderConfig.message,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: day === 0 ? 1 : day + 1, // Expo uses 1=Sunday, 2=Monday
              hour: hours,
              minute: minutes,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      Alert.alert('Error', 'Failed to schedule notifications');
    }
  };

  const toggleReminder = async (enabled: boolean) => {
    const newReminder = { ...reminder, isEnabled: enabled };
    await saveReminder(newReminder);
  };

  const updateFrequency = (
    frequency: 'daily' | 'weekly' | 'monthly' | 'specific'
  ) => {
    setReminder({ ...reminder, frequency });
  };

  const showTimePickerForGeneral = () => {
    if (!showSettings) return; // Don't show if settings modal is closed
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setTempTime(date);
    setSelectedDayForTime(null);
    setShowTimePicker(true);
  };

  const showTimePickerForDay = (day: number) => {
    if (!showSettings) return; // Don't show if settings modal is closed
    const currentTime = reminder.specificDayTimes?.[day] || '09:00';
    const [hours, minutes] = currentTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setTempTime(date);
    setSelectedDayForTime(day);
    setShowTimePicker(true);
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().substring(0, 5); // HH:MM format
      
      if (selectedDayForTime !== null) {
        // Update specific day time
        const newSpecificDayTimes = { ...reminder.specificDayTimes };
        newSpecificDayTimes[selectedDayForTime] = timeString;
        setReminder({ 
          ...reminder, 
          specificDayTimes: newSpecificDayTimes 
        });
      } else {
        // Update general time
        setReminder({ ...reminder, time: timeString });
      }
    }
  };

  const dismissTimePicker = () => {
    setShowTimePicker(false);
    setSelectedDayForTime(null);
  };

  const handleSettingsClose = () => {
    // Ensure time picker is closed before closing settings
    setShowTimePicker(false);
    setSelectedDayForTime(null);
    setShowSettings(false);
  };

  const toggleDay = (day: number) => {
    const specificDays = reminder.specificDays || [];
    const specificDayTimes = { ...reminder.specificDayTimes };

    if (specificDays.includes(day)) {
      // Remove day
      const newDays = specificDays.filter((d) => d !== day);
      delete specificDayTimes[day];
      setReminder({
        ...reminder,
        specificDays: newDays,
        specificDayTimes: specificDayTimes,
      });
    } else {
      // Add day with default time
      const newDays = [...specificDays, day].sort();
      specificDayTimes[day] = '09:00';
      setReminder({
        ...reminder,
        specificDays: newDays,
        specificDayTimes: specificDayTimes,
      });
    }
  };

  const saveSettings = async () => {
    // Ensure time picker is closed before saving
    setShowTimePicker(false);
    setSelectedDayForTime(null);
    await saveReminder(reminder);
    setShowSettings(false);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getReminderSummary = () => {
    if (reminder.frequency === 'daily') {
      return `Daily at ${reminder.time}`;
    } else if (reminder.frequency === 'weekly') {
      return `Weekly on Sunday at ${reminder.time}`;
    } else if (reminder.frequency === 'monthly') {
      return `Monthly at ${reminder.time}`;
    } else if (reminder.frequency === 'specific') {
      const activeDays = reminder.specificDays || [];
      if (activeDays.length === 0) {
        return 'No days selected';
      }
      return activeDays
        .map((day) => {
          const time = reminder.specificDayTimes?.[day] || '09:00';
          return `${dayNames[day]} ${time}`;
        })
        .join(', ');
    }
    return '';
  };

  return (
    <>
      <View style={styles.cardContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Prayer Reminders</Text>
          <Switch
            value={reminder.isEnabled}
            onValueChange={toggleReminder}
            thumbColor={reminder.isEnabled ? '#white' : 'white'}
            trackColor={{ false: '#ccc', true: '#008000' }}
          />
        </View>

        {reminder.isEnabled && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>{getReminderSummary()}</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.settingsButtonText}>Customize</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleSettingsClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Prayer Reminder Settings</Text>
            <TouchableOpacity onPress={saveSettings}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Frequency</Text>
            {(['daily', 'weekly', 'monthly', 'specific'] as const).map(
              (freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.optionRow,
                    reminder.frequency === freq && styles.optionRowSelected,
                  ]}
                  onPress={() => updateFrequency(freq)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      reminder.frequency === freq && styles.optionTextSelected,
                    ]}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              )
            )}

            {/* Time selector for non-specific frequencies */}
            {reminder.frequency !== 'specific' && (
              <>
                <Text style={styles.sectionTitle}>Time</Text>
                <TouchableOpacity
                  style={styles.timeSelector}
                  onPress={showTimePickerForGeneral}
                >
                  <Text style={styles.timeDisplay}>{reminder.time}</Text>
                  <Text style={styles.tapToEdit}>Tap to edit</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Specific days configuration */}
            {reminder.frequency === 'specific' && (
              <>
                <Text style={styles.sectionTitle}>Days & Times</Text>
                <Text style={styles.sectionSubtitle}>
                  Select days and set individual times for each
                </Text>
                <View style={styles.daysContainer}>
                  {dayNames.map((day, index) => {
                    const isSelected = reminder.specificDays?.includes(index);
                    const dayTime =
                      reminder.specificDayTimes?.[index] || '09:00';

                    return (
                      <View key={index} style={styles.dayContainer}>
                        <TouchableOpacity
                          style={[
                            styles.dayButton,
                            isSelected && styles.dayButtonSelected,
                          ]}
                          onPress={() => toggleDay(index)}
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              isSelected && styles.dayButtonTextSelected,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>

                        {isSelected && (
                          <TouchableOpacity
                            style={styles.dayTimeButton}
                            onPress={() => showTimePickerForDay(index)}
                          >
                            <Text style={styles.dayTimeText}>{dayTime}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

          </ScrollView>
        </View>

        {/* Time Picker - Fixed to bottom of screen */}
        {showTimePicker && (
          <TouchableOpacity 
            style={styles.timePickerOverlay}
            activeOpacity={1}
            onPress={dismissTimePicker}
          >
            <TouchableOpacity 
              style={styles.timePickerContainer}
              activeOpacity={1}
              onPress={(e) => e?.stopPropagation?.()}
            >
              <View style={styles.timePickerHeader}>
                <TouchableOpacity onPress={dismissTimePicker}>
                  <Text style={styles.timePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerTitle}>
                  {selectedDayForTime !== null
                    ? `${dayNames[selectedDayForTime]} Time`
                    : 'Select Time'}
                </Text>
                <TouchableOpacity onPress={dismissTimePicker}>
                  <Text style={styles.timePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Modal>
    </>
  );
};

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const styles = StyleSheet.create({
  cancelButton: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  dayButton: {
    alignItems: 'center',
    borderColor: SUBTLE_TEXT,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayButtonSelected: {
    backgroundColor: ACTIVE_GREEN,
    borderColor: ACTIVE_GREEN,
  },
  dayButtonText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  dayContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  dayTimeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
    borderRadius: 8,
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayTimeText: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  daysContainer: {
    gap: 12,
  },
  detailText: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailsContainer: {
    marginTop: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    backgroundColor: '#fff',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalTitle: {
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 18,
  },
  optionRow: {
    borderRadius: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(144, 197, 144, 0.3)',
  },
  optionText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  optionTextSelected: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
  },
  saveButton: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  sectionSubtitle: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
    marginBottom: 12,
    marginTop: 20,
  },
  settingsButton: {
    alignSelf: 'flex-start',
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingsButtonText: {
    color: '#fff',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 14,
  },
  tapToEdit: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
  },
  timeDisplay: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 32,
    marginBottom: 4,
  },
  timePicker: {
    backgroundColor: '#fff',
  },
  timePickerCancel: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  timePickerDone: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  timePickerHeader: {
    alignItems: 'center',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  timePickerOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  timePickerTitle: {
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 18,
  },
  timeSelector: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    marginBottom: 20,
    paddingVertical: 20,
  },
  title: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 17,
  },
});

export default PrayerReminderCard;
