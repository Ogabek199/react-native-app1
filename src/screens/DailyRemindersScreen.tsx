import * as React from 'react';
import { Alert, FlatList, Platform, Pressable, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { AppIcon } from '../shared/ui/AppIcon';
import { DailyReminderItem, useSettingsStore } from '../store/useSettingsStore';
import {
  cancelReminder,
  ensureNotificationPermissions,
  scheduleDailyReminder,
} from '../features/notifications/dailyReminder';

const MAX_REMINDERS = 5;

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function DailyRemindersScreen() {
  const { t } = useTranslation();
  const reminders = useSettingsStore((s) => s.dailyReminders);
  const setReminders = useSettingsStore((s) => s.setDailyReminders);

  const [pickerFor, setPickerFor] = React.useState<string | null>(null);
  const [pickerValue, setPickerValue] = React.useState<Date | null>(null);

  const save = React.useCallback(
    async (next: DailyReminderItem[]) => {
      await setReminders(next);
    },
    [setReminders],
  );

  const addReminder = React.useCallback(async () => {
    if (reminders.length >= MAX_REMINDERS) {
      Alert.alert(t('settings.dailyReminders'), t('settings.maxReminders'));
      return;
    }
    const ok = await ensureNotificationPermissions();
    if (!ok) {
      Alert.alert(t('settings.notificationsPermissionTitle'), t('settings.notificationsPermissionBody'));
      return;
    }
    const hour = 21;
    const minute = 0;
    const nid = await scheduleDailyReminder(
      { hour, minute },
      { title: t('notifications.dailyReminderTitle'), body: t('notifications.dailyReminderBody') },
    );
    const item: DailyReminderItem = { id: genId(), hour, minute, enabled: true, notificationId: nid };
    await save([...reminders, item]);
  }, [reminders, save, t]);

  const toggleReminder = React.useCallback(
    async (id: string, v: boolean) => {
      const next = await Promise.all(
        reminders.map(async (r) => {
          if (r.id !== id) return r;
          if (!v) {
            await cancelReminder(r.notificationId);
            return { ...r, enabled: false, notificationId: null };
          }
          const ok = await ensureNotificationPermissions();
          if (!ok) {
            Alert.alert(t('settings.notificationsPermissionTitle'), t('settings.notificationsPermissionBody'));
            return r;
          }
          const nid = await scheduleDailyReminder(
            { hour: r.hour, minute: r.minute },
            { title: t('notifications.dailyReminderTitle'), body: t('notifications.dailyReminderBody') },
          );
          return { ...r, enabled: true, notificationId: nid };
        }),
      );
      await save(next);
    },
    [reminders, save, t],
  );

  const deleteReminder = React.useCallback(
    (id: string) => {
      Alert.alert(t('settings.deleteReminderTitle'), t('settings.deleteReminderBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const r = reminders.find((x) => x.id === id);
            if (r) await cancelReminder(r.notificationId);
            await save(reminders.filter((x) => x.id !== id));
          },
        },
      ]);
    },
    [reminders, save, t],
  );

  const openPicker = React.useCallback(
    (id: string) => {
      const r = reminders.find((x) => x.id === id);
      if (!r) return;
      const d = new Date();
      d.setHours(r.hour);
      d.setMinutes(r.minute);
      d.setSeconds(0);
      setPickerValue(d);
      setPickerFor(id);
    },
    [reminders],
  );

  const onPickTime = React.useCallback(
    async (evt: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === 'android') {
        const id = pickerFor;
        setPickerFor(null);
        setPickerValue(null);
        if ((evt as any)?.type === 'dismissed' || !selected || !id) return;
        const h = selected.getHours();
        const m = selected.getMinutes();
        const next = await Promise.all(
          reminders.map(async (r) => {
            if (r.id !== id) return r;
            if (r.enabled) {
              await cancelReminder(r.notificationId);
              const nid = await scheduleDailyReminder(
                { hour: h, minute: m },
                { title: t('notifications.dailyReminderTitle'), body: t('notifications.dailyReminderBody') },
              );
              return { ...r, hour: h, minute: m, notificationId: nid };
            }
            return { ...r, hour: h, minute: m };
          }),
        );
        await save(next);
        return;
      }
      if ((evt as any)?.type === 'dismissed' || !selected) return;
      setPickerValue(selected);
    },
    [pickerFor, reminders, save, t],
  );

  const confirmIosPicker = React.useCallback(async () => {
    if (!pickerFor || !pickerValue) return;
    const h = pickerValue.getHours();
    const m = pickerValue.getMinutes();
    const next = await Promise.all(
      reminders.map(async (r) => {
        if (r.id !== pickerFor) return r;
        if (r.enabled) {
          await cancelReminder(r.notificationId);
          const nid = await scheduleDailyReminder(
            { hour: h, minute: m },
            { title: t('notifications.dailyReminderTitle'), body: t('notifications.dailyReminderBody') },
          );
          return { ...r, hour: h, minute: m, notificationId: nid };
        }
        return { ...r, hour: h, minute: m };
      }),
    );
    await save(next);
    setPickerFor(null);
    setPickerValue(null);
  }, [pickerFor, pickerValue, reminders, save, t]);

  const renderItem = React.useCallback(
    ({ item }: { item: DailyReminderItem }) => (
      <View className="flex-row items-center py-3">
        <Pressable onPress={() => openPicker(item.id)} className="flex-1 active:opacity-70">
          <Text className="text-text text-2xl font-bold">{fmtTime(item.hour, item.minute)}</Text>
          <Text className="text-muted text-xs mt-0.5">
            {item.enabled ? t('settings.dailyReminders') : t('common.cancel')}
          </Text>
        </Pressable>

        <Pressable onPress={() => deleteReminder(item.id)} className="mr-3 active:opacity-60">
          <AppIcon name="trash-outline" size={20} color="#E04E4E" />
        </Pressable>

        <Switch
          value={item.enabled}
          onValueChange={(v) => toggleReminder(item.id, v)}
          trackColor={{ false: '#E6E2E0', true: '#E04E4E' }}
          ios_backgroundColor="#E6E2E0"
          thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
        />
      </View>
    ),
    [deleteReminder, openPicker, t, toggleReminder],
  );

  return (
    <Screen>
      <View className="gap-3">
        <Card>
          <Text className="text-text text-lg font-extrabold">{t('settings.dailyReminders')}</Text>
          <Text className="text-text2 mt-2">{t('settings.dailyRemindersInfo')}</Text>
        </Card>

        <Card>
          {reminders.length === 0 ? (
            <Text className="text-muted text-center py-4">{t('settings.noReminders')}</Text>
          ) : (
            <FlatList
              data={reminders}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View className="h-[1px] bg-elevated" />}
            />
          )}

          <Pressable
            onPress={addReminder}
            className="mt-4 rounded-2xl bg-elevated px-4 py-3 flex-row items-center justify-center gap-2 active:opacity-85"
          >
            <AppIcon name="add-circle-outline" size={20} color="#E04E4E" />
            <Text className="text-text font-extrabold">{t('settings.addReminder')}</Text>
          </Pressable>
        </Card>
      </View>

      {pickerFor && pickerValue ? (
        Platform.OS === 'android' ? (
          <DateTimePicker value={pickerValue} mode="time" display="spinner" onChange={onPickTime} />
        ) : (
          <View className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl px-5 pb-8 pt-4 shadow-black/10 shadow-lg">
            <DateTimePicker value={pickerValue} mode="time" display="spinner" onChange={onPickTime} />
            <Pressable
              onPress={confirmIosPicker}
              className="mt-3 rounded-2xl bg-[#E04E4E] px-4 py-3 items-center active:opacity-85"
            >
              <Text className="text-white font-extrabold">{t('common.save')}</Text>
            </Pressable>
          </View>
        )
      ) : null}
    </Screen>
  );
}
