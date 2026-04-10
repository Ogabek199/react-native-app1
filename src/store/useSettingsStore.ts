import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { signInWithFirebase, signUpWithFirebase } from '../shared/firebase/authRest';
import { backupJournalToFirebase } from '../features/backup/cloudBackup';

export type DailyReminderItem = {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  notificationId: string | null;
};

type SettingsState = {
  lockEnabled: boolean;
  hydrated: boolean;
  language: 'uz' | 'ru' | 'en';
  profileImageUri: string | null;
  userName: string;
  userEmail: string;
  userId: string;
  isLoggedIn: boolean;
  lastSyncAt: number | null;
  syncBusy: boolean;
  dailyReminders: DailyReminderItem[];
  setLockEnabled: (v: boolean) => Promise<void>;
  setLanguage: (v: 'uz' | 'ru' | 'en') => Promise<void>;
  setProfileImageUri: (v: string | null) => Promise<void>;
  setUserProfile: (name: string, email: string) => Promise<void>;
  setDailyReminders: (reminders: DailyReminderItem[]) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  setAuthState: (isLoggedIn: boolean, user?: { name?: string | null; email?: string | null }) => Promise<void>;
  backupNow: () => Promise<boolean>;
  hydrate: () => Promise<void>;
};

const KEY = 'settings.lockEnabled';
const LANG_KEY = 'settings.language';
const PROFILE_IMAGE_KEY = 'settings.profileImageUri';
const USER_NAME_KEY = 'settings.userName';
const USER_EMAIL_KEY = 'settings.userEmail';
const USER_ID_KEY = 'settings.userId';
const REMINDER_KEY = 'settings.dailyReminder';
const REMINDERS_KEY = 'settings.dailyReminders';
const IS_LOGGED_IN_KEY = 'settings.isLoggedIn';
const LAST_SYNC_AT_KEY = 'settings.lastSyncAt';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  lockEnabled: false,
  hydrated: false,
  language: 'en',
  profileImageUri: null,
  userName: '',
  userEmail: '',
  userId: '',
  isLoggedIn: false,
  lastSyncAt: null,
  syncBusy: false,
  dailyReminders: [],

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const lang = (await AsyncStorage.getItem(LANG_KEY)) as
        | 'uz'
        | 'ru'
        | 'en'
        | null;
      const profileImageUri = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      const userName = await AsyncStorage.getItem(USER_NAME_KEY);
      const userEmail = await AsyncStorage.getItem(USER_EMAIL_KEY);
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      const isLoggedInRaw = await AsyncStorage.getItem(IS_LOGGED_IN_KEY);
      const lastSyncAtRaw = await AsyncStorage.getItem(LAST_SYNC_AT_KEY);
      // If you previously stored a local password, ensure we don't keep it in plain AsyncStorage.
      try { await AsyncStorage.removeItem('settings.userPassword'); } catch { /* ignore */ }

      let reminders: DailyReminderItem[] = [];
      const remindersRaw = await AsyncStorage.getItem(REMINDERS_KEY);
      if (remindersRaw) {
        reminders = JSON.parse(remindersRaw) as DailyReminderItem[];
      } else {
        // Migrate from old single-reminder format
        const oldRaw = await AsyncStorage.getItem(REMINDER_KEY);
        if (oldRaw) {
          const old = JSON.parse(oldRaw) as any;
          if (old?.enabled) {
            reminders = [{
              id: genId(),
              hour: Number(old.hour ?? 21),
              minute: Number(old.minute ?? 0),
              enabled: true,
              notificationId: (old.notificationId ?? null) as string | null,
            }];
          }
          await AsyncStorage.removeItem(REMINDER_KEY);
          await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
        }
      }

      set({
        lockEnabled: raw === '1',
        language: lang ?? 'en',
        profileImageUri: profileImageUri || null,
        userName: userName || '',
        userEmail: userEmail || '',
        userId: userId || '',
        isLoggedIn: isLoggedInRaw === '1',
        lastSyncAt: lastSyncAtRaw ? Number(lastSyncAtRaw) : null,
        syncBusy: false,
        dailyReminders: reminders,
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
      // ignore
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

  setUserProfile: async (name, email) => {
    set({ userName: name, userEmail: email });
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, name);
      await AsyncStorage.setItem(USER_EMAIL_KEY, email);
    } catch {
      // ignore
    }
  },

  setDailyReminders: async (reminders) => {
    set({ dailyReminders: reminders });
    try {
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    } catch {
      // ignore
    }
  },

  signUp: async (name, email, password) => {
    const result = await signUpWithFirebase(name, email, password);
    set({
      userName: result.name || name,
      userEmail: result.email,
      userId: result.userId,
      isLoggedIn: true,
    });
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, result.name || name);
      await AsyncStorage.setItem(USER_EMAIL_KEY, result.email);
      await AsyncStorage.setItem(USER_ID_KEY, result.userId);
      await AsyncStorage.setItem(IS_LOGGED_IN_KEY, '1');
    } catch { }
  },

  signIn: async (email, password) => {
    try {
      const result = await signInWithFirebase(email, password);
      set({
        userName: result.name,
        userEmail: result.email,
        userId: result.userId,
        isLoggedIn: true,
      });
      try { await AsyncStorage.setItem(USER_NAME_KEY, result.name); } catch { }
      try { await AsyncStorage.setItem(USER_EMAIL_KEY, result.email); } catch { }
      try { await AsyncStorage.setItem(USER_ID_KEY, result.userId); } catch { }
      try { await AsyncStorage.setItem(IS_LOGGED_IN_KEY, '1'); } catch { }
      return true;
    } catch { return false; }
  },

  signOut: async () => {
    set({ isLoggedIn: false, userId: '' });
    try { await AsyncStorage.removeItem(USER_ID_KEY); } catch { }
    try { await AsyncStorage.setItem(IS_LOGGED_IN_KEY, '0'); } catch { }
  },

  setAuthState: async (isLoggedIn, user) => {
    set({
      isLoggedIn,
      userEmail: user?.email ?? get().userEmail,
      userName: user?.name ?? get().userName,
    });
    try { await AsyncStorage.setItem(IS_LOGGED_IN_KEY, isLoggedIn ? '1' : '0'); } catch { }
    if (user?.email) { try { await AsyncStorage.setItem(USER_EMAIL_KEY, user.email); } catch { } }
    if (user?.name) { try { await AsyncStorage.setItem(USER_NAME_KEY, user.name); } catch { } }
  },

  backupNow: async () => {
    if (get().syncBusy) return false;
    set({ syncBusy: true });
    try {
      await backupJournalToFirebase();
      const ts = Date.now();
      set({ lastSyncAt: ts, syncBusy: false });
      try { await AsyncStorage.setItem(LAST_SYNC_AT_KEY, String(ts)); } catch { }
      return true;
    } catch {
      set({ syncBusy: false });
      return false;
    }
  },
}));
