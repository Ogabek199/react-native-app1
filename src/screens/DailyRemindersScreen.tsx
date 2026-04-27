import * as React from 'react';
import { Alert, FlatList, Platform, Pressable, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { AppIcon } from '../shared/ui/AppIcon';
import { DailyReminderItem, useSettingsStore } from '../store/useSettingsStore';
import { TextField } from '../shared/ui/TextField';
import { AppDialog } from '../shared/ui/AppDialog';
import { AppSheet } from '../shared/ui/AppSheet';
import { ConfirmDialog } from '../shared/ui/ConfirmDialog';
import scheduleDailyReminder, {
  cancelReminder,
  ensureNotificationPermissions,
} from '../features/notifications/dailyReminder';
import {
  DEFAULT_REMINDER_SOUND,
  ReminderSound,
  getDailyReminderBody,
} from '../features/notifications/reminderConfig';

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
  const [soundPickerFor, setSoundPickerFor] = React.useState<string | null>(null);
  const [deleteReminderId, setDeleteReminderId] = React.useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = React.useState<Record<string, string>>({});

  const soundOptions = React.useMemo(
    () => [
      { value: DEFAULT_REMINDER_SOUND, label: t('settings.soundDefault'), iconName: 'notifications-outline' as const },
      { value: 'reminder-glass.wav' as const, label: t('settings.soundGlass'), iconName: 'sparkles-outline' as const },
      { value: 'reminder-hero.wav' as const, label: t('settings.soundHero'), iconName: 'flash-outline' as const },
      { value: 'reminder-submarine.wav' as const, label: t('settings.soundSubmarine'), iconName: 'water-outline' as const },
    ],
    [t],
  );

  const save = React.useCallback(
    async (next: DailyReminderItem[]) => {
      await setReminders(next);
    },
    [setReminders],
  );

  React.useEffect(() => {
    setMessageDrafts((current) => {
      const next = { ...current };
      let changed = false;
      const ids = new Set(reminders.map((r) => r.id));

      reminders.forEach((r) => {
        if (!(r.id in next)) {
          next[r.id] = r.message ?? '';
          changed = true;
        }
      });

      Object.keys(next).forEach((id) => {
        if (!ids.has(id)) {
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [reminders]);

  React.useEffect(() => {
    if (!soundPickerFor) return;
    if (reminders.some((r) => r.id === soundPickerFor)) return;
    setSoundPickerFor(null);
  }, [reminders, soundPickerFor]);

  const buildReminderContent = React.useCallback(
    (message: string, sound: ReminderSound) => ({
      title: t('notifications.dailyReminderTitle'),
      body: getDailyReminderBody(message, t('notifications.dailyReminderBody')),
      sound,
    }),
    [t],
  );

  const getMessageDraft = React.useCallback(
    (reminder: DailyReminderItem) => messageDrafts[reminder.id] ?? reminder.message ?? '',
    [messageDrafts],
  );

  const getSoundLabel = React.useCallback(
    (sound: ReminderSound) => soundOptions.find((option) => option.value === sound)?.label ?? soundOptions[0].label,
    [soundOptions],
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
      buildReminderContent('', DEFAULT_REMINDER_SOUND),
    );
    const item: DailyReminderItem = {
      id: genId(),
      hour,
      minute,
      enabled: true,
      notificationId: nid,
      message: '',
      sound: DEFAULT_REMINDER_SOUND,
    };
    await save([...reminders, item]);
    setMessageDrafts((current) => ({ ...current, [item.id]: '' }));
  }, [buildReminderContent, reminders, save, t]);

  const toggleReminder = React.useCallback(
    async (id: string, v: boolean) => {
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) return;

      const nextMessage = getMessageDraft(reminder).trim();
      if (v) {
        const ok = await ensureNotificationPermissions();
        if (!ok) {
          Alert.alert(t('settings.notificationsPermissionTitle'), t('settings.notificationsPermissionBody'));
          return;
        }
      }

      const next = await Promise.all(
        reminders.map(async (r) => {
          if (r.id !== id) return r;
          if (!v) {
            await cancelReminder(r.notificationId);
            return { ...r, enabled: false, notificationId: null, message: nextMessage };
          }
          const updated = { ...r, enabled: true, message: nextMessage };
          const nid = await scheduleDailyReminder(
            { hour: updated.hour, minute: updated.minute },
            buildReminderContent(updated.message, updated.sound),
          );
          return { ...updated, notificationId: nid };
        }),
      );
      setMessageDrafts((current) => ({ ...current, [id]: nextMessage }));
      await save(next);
    },
    [buildReminderContent, getMessageDraft, reminders, save, t],
  );

  const deleteReminder = React.useCallback(
    (id: string) => {
      setDeleteReminderId(id);
    },
    [],
  );

  const commitMessage = React.useCallback(
    async (id: string) => {
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) return;

      const nextMessage = getMessageDraft(reminder).trim();
      if (nextMessage === reminder.message) {
        setMessageDrafts((current) => ({ ...current, [id]: nextMessage }));
        return;
      }

      const next = await Promise.all(
        reminders.map(async (r) => {
          if (r.id !== id) return r;
          const updated = { ...r, message: nextMessage };
          if (!updated.enabled) return updated;
          await cancelReminder(r.notificationId);
          const nid = await scheduleDailyReminder(
            { hour: updated.hour, minute: updated.minute },
            buildReminderContent(updated.message, updated.sound),
          );
          return { ...updated, notificationId: nid };
        }),
      );

      setMessageDrafts((current) => ({ ...current, [id]: nextMessage }));
      await save(next);
    },
    [buildReminderContent, getMessageDraft, reminders, save],
  );

  const setReminderSound = React.useCallback(
    async (id: string, sound: ReminderSound) => {
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) return;

      const nextMessage = getMessageDraft(reminder).trim();
      const next = await Promise.all(
        reminders.map(async (r) => {
          if (r.id !== id) return r;
          const updated = { ...r, message: nextMessage, sound };
          if (!updated.enabled) return updated;
          await cancelReminder(r.notificationId);
          const nid = await scheduleDailyReminder(
            { hour: updated.hour, minute: updated.minute },
            buildReminderContent(updated.message, updated.sound),
          );
          return { ...updated, notificationId: nid };
        }),
      );

      setMessageDrafts((current) => ({ ...current, [id]: nextMessage }));
      setSoundPickerFor(null);
      await save(next);
    },
    [buildReminderContent, getMessageDraft, reminders, save],
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

  const savePickedTime = React.useCallback(
    async (id: string, hour: number, minute: number) => {
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) return;

      const nextMessage = getMessageDraft(reminder).trim();
      const next = await Promise.all(
        reminders.map(async (r) => {
          if (r.id !== id) return r;
          const updated = { ...r, hour, minute, message: nextMessage };
          if (!updated.enabled) return updated;
          await cancelReminder(r.notificationId);
          const nid = await scheduleDailyReminder(
            { hour, minute },
            buildReminderContent(updated.message, updated.sound),
          );
          return { ...updated, notificationId: nid };
        }),
      );

      setMessageDrafts((current) => ({ ...current, [id]: nextMessage }));
      await save(next);
    },
    [buildReminderContent, getMessageDraft, reminders, save],
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
        await savePickedTime(id, h, m);
        return;
      }
      if ((evt as any)?.type === 'dismissed' || !selected) return;
      setPickerValue(selected);
    },
    [pickerFor, savePickedTime],
  );

  const confirmIosPicker = React.useCallback(async () => {
    if (!pickerFor || !pickerValue) return;
    const h = pickerValue.getHours();
    const m = pickerValue.getMinutes();
    await savePickedTime(pickerFor, h, m);
    setPickerFor(null);
    setPickerValue(null);
  }, [pickerFor, pickerValue, savePickedTime]);

  const renderItem = React.useCallback(
    ({ item }: { item: DailyReminderItem }) => {
      const draftMessage = getMessageDraft(item);
      return (
        <View className="py-4">
          <View className="flex-row items-start">
            <Pressable onPress={() => openPicker(item.id)} className="flex-1 pr-3 active:opacity-70">
              <Text className="text-text text-2xl font-bold">{fmtTime(item.hour, item.minute)}</Text>
              <Text className="text-muted text-xs mt-1">
                {draftMessage.trim() || t('settings.reminderUsesDefaultText')}
              </Text>
            </Pressable>

            <Pressable onPress={() => deleteReminder(item.id)} className="mr-3 mt-1 active:opacity-60">
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

          <View className="mt-3 gap-3">
            <TextField
              label={t('settings.reminderMessageLabel')}
              value={draftMessage}
              onChangeText={(text) => setMessageDrafts((current) => ({ ...current, [item.id]: text }))}
              onBlur={() => {
                void commitMessage(item.id);
              }}
              onSubmitEditing={() => {
                void commitMessage(item.id);
              }}
              autoCapitalize="sentences"
              returnKeyType="done"
              placeholder={t('settings.reminderMessagePlaceholder')}
            />

            <View>
              <Text className="text-muted mb-2 text-xs">{t('settings.notificationSoundLabel')}</Text>
              <Pressable
                onPress={() => setSoundPickerFor(item.id)}
                className="flex-row items-center justify-between rounded-2xl border border-elevated bg-card px-4 py-3 active:opacity-85"
              >
                <View className="flex-row items-center gap-2">
                  <AppIcon name="musical-notes-outline" size={18} color="#E04E4E" />
                  <Text className="text-text font-semibold">{getSoundLabel(item.sound)}</Text>
                </View>
                <AppIcon name="chevron-down" size={16} color="#8B919A" />
              </Pressable>
            </View>
          </View>
        </View>
      );
    },
    [commitMessage, deleteReminder, getMessageDraft, getSoundLabel, openPicker, t, toggleReminder],
  );

  const soundPickerReminder = soundPickerFor
    ? reminders.find((reminder) => reminder.id === soundPickerFor) ?? null
    : null;
  const deleteReminderTarget = deleteReminderId
    ? reminders.find((reminder) => reminder.id === deleteReminderId) ?? null
    : null;

  return (
    <Screen>
      <View className="gap-3">
        <Card>
          <Text className="text-text text-lg font-extrabold">{t('settings.dailyReminders')}</Text>
          <Text className="text-text2 mt-2">{t('settings.dailyRemindersInfo')}</Text>
          <Text className="text-muted text-xs mt-2">{t('settings.reminderMessageHint')}</Text>
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
          <AppSheet
            visible
            onClose={() => {
              setPickerFor(null);
              setPickerValue(null);
            }}
            title={t('settings.pickTime')}
            eyebrow={t('settings.dailyReminders')}
            footer={(
              <Pressable
                onPress={confirmIosPicker}
                className="rounded-2xl bg-danger px-4 py-3 items-center active:opacity-85"
              >
                <Text className="text-white font-extrabold">{t('common.save')}</Text>
              </Pressable>
            )}
          >
            <DateTimePicker value={pickerValue} mode="time" display="spinner" onChange={onPickTime} />
          </AppSheet>
        )
      ) : null}

      {soundPickerReminder ? (
        <AppDialog
          visible
          onClose={() => setSoundPickerFor(null)}
          title={t('settings.chooseNotificationSound')}
          iconName="musical-notes-outline"
        >
          <View className="gap-2">
            {soundOptions.map((option) => {
              const selected = option.value === soundPickerReminder.sound;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    void setReminderSound(soundPickerReminder.id, option.value);
                  }}
                  className={[
                    'flex-row items-center justify-between rounded-2xl border px-4 py-4 active:opacity-85',
                    selected ? 'border-danger bg-elevated' : 'border-elevated bg-card',
                  ].join(' ')}
                >
                  <View className="flex-row items-center gap-3 flex-1 pr-3">
                    <View
                      className={[
                        'h-10 w-10 rounded-2xl items-center justify-center',
                        selected ? 'bg-danger' : 'bg-elevated',
                      ].join(' ')}
                    >
                      <AppIcon name={option.iconName} size={18} color={selected ? '#FFFFFF' : '#A9ADB2'} />
                    </View>
                    <Text className="text-text font-extrabold">{option.label}</Text>
                  </View>

                  {selected ? <AppIcon name="checkmark" size={20} color="#E04E4E" /> : null}
                </Pressable>
              );
            })}
          </View>
        </AppDialog>
      ) : null}

      <ConfirmDialog
        visible={Boolean(deleteReminderTarget)}
        onClose={() => setDeleteReminderId(null)}
        title={t('settings.deleteReminderTitle')}
        description={t('settings.deleteReminderBody')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        onConfirm={async () => {
          if (!deleteReminderTarget) return;
          await cancelReminder(deleteReminderTarget.notificationId);
          await save(reminders.filter((reminder) => reminder.id !== deleteReminderTarget.id));
        }}
      />
    </Screen>
  );
}
