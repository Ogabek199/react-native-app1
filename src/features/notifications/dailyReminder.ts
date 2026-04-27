import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  DEFAULT_REMINDER_SOUND,
  ReminderSound,
  getReminderChannelId,
  normalizeReminderSound,
} from './reminderConfig';

type DailyReminderTime = { hour: number; minute: number };
type DailyReminderContent = { title: string; body: string; sound?: ReminderSound };

export async function ensureNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureReminderChannel(sound: ReminderSound) {
  if (Platform.OS !== 'android') return undefined;

  const channelId = getReminderChannelId(sound);
  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E04E4E',
    ...(sound !== DEFAULT_REMINDER_SOUND ? { sound } : {}),
  });

  return channelId;
}

async function scheduleDailyReminder(time: DailyReminderTime, content: DailyReminderContent) {
  const sound = normalizeReminderSound(content.sound);
  const channelId = await ensureReminderChannel(sound);

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: sound === DEFAULT_REMINDER_SOUND ? 'default' : sound,
    },
    trigger:
      Platform.OS === 'android'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: time.hour,
            minute: time.minute,
            ...(channelId ? { channelId } : {}),
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: time.hour,
            minute: time.minute,
            repeats: true,
          },
  });
}

export default scheduleDailyReminder;

export async function cancelReminder(notificationId: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
  }
}
