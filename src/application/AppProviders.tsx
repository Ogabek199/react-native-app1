import { NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import { LocaleConfig } from 'react-native-calendars';

import { RootNavigator } from './navigation/RootNavigator';
import { useSettingsStore } from '../store/useSettingsStore';
import i18n from '../shared/i18n/i18n';
import { cancelReminder, scheduleDailyReminder } from '../features/notifications/dailyReminder';

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
  const [unlocked, setUnlocked] = React.useState(false);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

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
                { title: i18n.t('notifications.dailyReminderTitle'), body: i18n.t('notifications.dailyReminderBody') },
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
      <NavigationContainer>
        {unlocked ? <RootNavigator /> : null}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
