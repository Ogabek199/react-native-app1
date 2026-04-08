import * as React from 'react';
import { Alert, Platform, Pressable, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  cancelReminder,
  ensureNotificationPermissions,
  scheduleDailyReminder,
} from '../features/notifications/dailyReminder';

export function DailyRemindersScreen() {
  const { t } = useTranslation();
  const enabled = useSettingsStore((s) => s.dailyReminderEnabled);
  const hour = useSettingsStore((s) => s.dailyReminderHour);
  const minute = useSettingsStore((s) => s.dailyReminderMinute);
  const notifId = useSettingsStore((s) => s.dailyReminderNotificationId);
  const setDailyReminder = useSettingsStore((s) => s.setDailyReminder);

  const [showPicker, setShowPicker] = React.useState(false);
  const time = React.useMemo(() => {
    const d = new Date();
    d.setHours(hour);
    d.setMinutes(minute);
    d.setSeconds(0);
    return d;
  }, [hour, minute]);

  const onPickTime = React.useCallback(
    async (evt: DateTimePickerEvent, selected?: Date) => {
      setShowPicker(false);
      if (!selected) return;
      await setDailyReminder({
        enabled,
        hour: selected.getHours(),
        minute: selected.getMinutes(),
        notificationId: notifId,
      });
      if (enabled) {
        // reschedule
        await cancelReminder(notifId);
        const newId = await scheduleDailyReminder({
          hour: selected.getHours(),
          minute: selected.getMinutes(),
        });
        await setDailyReminder({
          enabled: true,
          hour: selected.getHours(),
          minute: selected.getMinutes(),
          notificationId: newId,
        });
      }
    },
    [enabled, notifId, setDailyReminder]
  );

  const onToggle = React.useCallback(
    async (v: boolean) => {
      try {
        if (!v) {
          await cancelReminder(notifId);
          await setDailyReminder({ enabled: false, hour, minute, notificationId: null });
          return;
        }

        const ok = await ensureNotificationPermissions();
        if (!ok) {
          Alert.alert(t('settings.notificationsPermissionTitle'), t('settings.notificationsPermissionBody'));
          return;
        }

        await cancelReminder(notifId);
        const newId = await scheduleDailyReminder({ hour, minute });
        await setDailyReminder({ enabled: true, hour, minute, notificationId: newId });
      } catch (e: any) {
        Alert.alert(t('settings.notificationsPermissionTitle'), e?.message ?? 'Failed');
        await setDailyReminder({ enabled: false, hour, minute, notificationId: null });
      }
    },
    [hour, minute, notifId, setDailyReminder, t]
  );

  return (
    <Screen>
      <View className="gap-3">
        <Card>
          <Text className="text-text text-lg font-extrabold">{t('settings.dailyReminders')}</Text>
          <Text className="text-text2 mt-2">{t('settings.dailyRemindersInfo')}</Text>
        </Card>

        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-text font-extrabold">{t('settings.remindersLabel')}</Text>
              <Text className="text-muted text-xs mt-1">
                {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={onToggle}
              trackColor={{ false: '#E6E2E0', true: '#E04E4E' }}
              ios_backgroundColor="#E6E2E0"
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>

          <View className="mt-4">
            <Pressable
              onPress={() => setShowPicker(true)}
              className="rounded-2xl bg-elevated px-4 py-3 items-center active:opacity-85"
            >
              <Text className="text-text font-extrabold">{t('settings.pickTime')}</Text>
            </Pressable>
          </View>
        </Card>

        {showPicker ? (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onPickTime}
          />
        ) : null}
      </View>
    </Screen>
  );
}

