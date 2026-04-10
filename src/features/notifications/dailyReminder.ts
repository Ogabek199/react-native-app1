import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

type DailyReminderTime = { hour: number; minute: number };
type DailyReminderContent = { title: string; body: string };

export async function ensureNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleDailyReminder(time: DailyReminderTime, content: DailyReminderContent) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E04E4E',
    });
  }

  const id = await Notifications.scheduleNotificationAsync({
    content,
    ...(Platform.OS === 'android' ? { channelId: 'daily-reminders' } : null),
    trigger:
      Platform.OS === 'android'
        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: time.hour, minute: time.minute }
        : { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour: time.hour, minute: time.minute, repeats: true },
  });
  return id;
}

export async function cancelReminder(notificationId: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore — notification may already be cancelled
  }
}
