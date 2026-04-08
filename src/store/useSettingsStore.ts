import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsState = {
  lockEnabled: boolean;
  hydrated: boolean;
  language: 'uz' | 'ru' | 'en';
  profileImageUri: string | null;
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  dailyReminderNotificationId: string | null;
  setLockEnabled: (v: boolean) => Promise<void>;
  setLanguage: (v: 'uz' | 'ru' | 'en') => Promise<void>;
  setProfileImageUri: (v: string | null) => Promise<void>;
  setDailyReminder: (v: {
    enabled: boolean;
    hour: number;
    minute: number;
    notificationId: string | null;
  }) => Promise<void>;
  hydrate: () => Promise<void>;
};

const KEY = 'settings.lockEnabled';
const LANG_KEY = 'settings.language';
const PROFILE_IMAGE_KEY = 'settings.profileImageUri';
const REMINDER_KEY = 'settings.dailyReminder';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  lockEnabled: false,
  hydrated: false,
  language: 'en',
  profileImageUri: null,
  dailyReminderEnabled: false,
  dailyReminderHour: 21,
  dailyReminderMinute: 0,
  dailyReminderNotificationId: null,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const lang = (await AsyncStorage.getItem(LANG_KEY)) as
        | 'uz'
        | 'ru'
        | 'en'
        | null;
      const profileImageUri = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      const reminderRaw = await AsyncStorage.getItem(REMINDER_KEY);
      const reminder = reminderRaw ? (JSON.parse(reminderRaw) as any) : null;
      set({
        lockEnabled: raw === '1',
        language: lang ?? 'en',
        profileImageUri: profileImageUri || null,
        dailyReminderEnabled: Boolean(reminder?.enabled ?? false),
        dailyReminderHour: Number(reminder?.hour ?? 21),
        dailyReminderMinute: Number(reminder?.minute ?? 0),
        dailyReminderNotificationId: (reminder?.notificationId ?? null) as string | null,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setLockEnabled: async (v) => {
    set({ lockEnabled: v });
    try {
      await AsyncStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      // ignore persistence errors (still works in-memory)
    }
  },

  setLanguage: async (v) => {
    set({ language: v });
    try {
      await AsyncStorage.setItem(LANG_KEY, v);
    } catch {
      // ignore
    }
  },

  setProfileImageUri: async (v) => {
    set({ profileImageUri: v });
    try {
      if (!v) {
        await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
      } else {
        await AsyncStorage.setItem(PROFILE_IMAGE_KEY, v);
      }
    } catch {
      // ignore
    }
  },

  setDailyReminder: async ({ enabled, hour, minute, notificationId }) => {
    set({
      dailyReminderEnabled: enabled,
      dailyReminderHour: hour,
      dailyReminderMinute: minute,
      dailyReminderNotificationId: notificationId,
    });
    try {
      await AsyncStorage.setItem(
        REMINDER_KEY,
        JSON.stringify({ enabled, hour, minute, notificationId })
      );
    } catch {
      // ignore
    }
  },
}));

