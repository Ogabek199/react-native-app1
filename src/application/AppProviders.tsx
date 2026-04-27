import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { View, useColorScheme as useSystemColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import { LocaleConfig } from 'react-native-calendars';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme as useNativewindColorScheme, vars } from 'nativewind';

import { RootNavigator } from './navigation/RootNavigator';
import { useSettingsStore } from '../store/useSettingsStore';
import i18n from '../shared/i18n/i18n';
import scheduleDailyReminder, { cancelReminder } from '../features/notifications/dailyReminder';
import { getDailyReminderBody } from '../features/notifications/reminderConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

Notifications.setNotificationChannelAsync('default', {
  name: 'Daily Reminders',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#6366F1',
});

LocaleConfig.locales.en = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today',
};

LocaleConfig.locales.ru = {
  monthNames: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ],
  monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: 'Сегодня',
};

LocaleConfig.locales.uz = {
  monthNames: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
  ],
  monthNamesShort: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  dayNames: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  dayNamesShort: ['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha'],
  today: 'Bugun',
};

export function AppProviders() {
  const lockEnabled = useSettingsStore((s) => s.lockEnabled);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);
  const [unlocked, setUnlocked] = React.useState(false);
  const systemScheme = useSystemColorScheme();
  const { setColorScheme } = useNativewindColorScheme();
  const effectiveScheme = theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;
  const themeVars = React.useMemo(
    () =>
      vars(
        effectiveScheme === 'dark'
          ? {
              '--color-page': '11 12 15',
              '--color-card': '20 22 27',
              '--color-elevated': '30 34 42',
              '--color-text': '244 245 247',
              '--color-text2': '193 197 204',
              '--color-muted': '139 145 154',
              '--color-accent': '245 188 164',
              '--color-accent2': '166 212 192',
              '--color-success': '76 175 80',
              '--color-warning': '245 179 1',
              '--color-danger': '224 78 78',
              '--color-overlay': '0 0 0',
            }
          : {
              '--color-page': '251 250 248',
              '--color-card': '255 255 255',
              '--color-elevated': '241 237 235',
              '--color-text': '17 18 23',
              '--color-text2': '107 111 117',
              '--color-muted': '169 173 178',
              '--color-accent': '245 188 164',
              '--color-accent2': '166 212 192',
              '--color-success': '76 175 80',
              '--color-warning': '245 179 1',
              '--color-danger': '224 78 78',
              '--color-overlay': '9 10 11',
            },
      ),
    [effectiveScheme],
  );
  const navigationTheme = React.useMemo(() => {
    const base = effectiveScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: '#E04E4E',
        background: effectiveScheme === 'dark' ? '#0B0C0F' : '#FBFAF8',
        card: effectiveScheme === 'dark' ? '#14161B' : '#FFFFFF',
        text: effectiveScheme === 'dark' ? '#F4F5F7' : '#111217',
        border: effectiveScheme === 'dark' ? '#1E222A' : '#F1EDEB',
        notification: '#E04E4E',
      },
    };
  }, [effectiveScheme]);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (!hydrated) return;
    setColorScheme(effectiveScheme);
  }, [hydrated, effectiveScheme, setColorScheme]);

  const prevLangRef = React.useRef(language);
  React.useEffect(() => {
    if (!hydrated) return;
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
    LocaleConfig.defaultLocale = language;

    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      const s = useSettingsStore.getState();
      const enabled = s.dailyReminders.filter((r) => r.enabled);
      if (enabled.length === 0) return;

      (async () => {
        try {
          const next = await Promise.all(
            s.dailyReminders.map(async (r) => {
              if (!r.enabled) return r;
              await cancelReminder(r.notificationId);
              const nid = await scheduleDailyReminder(
                { hour: r.hour, minute: r.minute },
                {
                  title: i18n.t('notifications.dailyReminderTitle'),
                  body: getDailyReminderBody(r.message, i18n.t('notifications.dailyReminderBody')),
                  sound: r.sound,
                },
              );
              return { ...r, notificationId: nid };
            }),
          );
          await s.setDailyReminders(next);
        } catch {
          // ignore
        }
      })();
    }
  }, [hydrated, language]);

  const authIfNeeded = React.useCallback(async () => {
    if (!lockEnabled) {
      setUnlocked(true);
      return;
    }
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ilovani ochish',
    });
    setUnlocked(res.success);
  }, [lockEnabled]);

  React.useEffect(() => {
    if (!hydrated) return;
    authIfNeeded();
  }, [hydrated, authIfNeeded]);

  return (
    <SafeAreaProvider>
      <View className="flex-1" style={themeVars}>
        <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
        <NavigationContainer theme={navigationTheme}>
          {unlocked ? <RootNavigator /> : null}
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}
