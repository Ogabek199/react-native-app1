import * as React from 'react';
import { Pressable, Switch, Text, View, useColorScheme as useSystemColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';

import { AppIcon } from '../shared/ui/AppIcon';
import { AppSheet } from '../shared/ui/AppSheet';
import { endOfDay, startOfDay } from '../shared/lib/dateRange';
import { useJournalFiltersStore } from '../store/useJournalFiltersStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function JournalCalendarScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const dateRange = useJournalFiltersStore((s) => s.filters.dateRange);
  const setDateRange = useJournalFiltersStore((s) => s.setDateRange);
  const theme = useSettingsStore((s) => s.theme);
  const systemScheme = useSystemColorScheme();
  const effectiveScheme = theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;
  const isDark = effectiveScheme === 'dark';

  const [rangeEnabled, setRangeEnabled] = React.useState(true);
  const [start, setStart] = React.useState<number | null>(dateRange.start ?? null);
  const [end, setEnd] = React.useState<number | null>(dateRange.end ?? null);

  const today = React.useMemo(() => new Date(), []);
  const toKey = React.useCallback((ts: number) => {
    const d = new Date(ts);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }, []);

  const onDayPress = React.useCallback(
    (day: any) => {
      const ts = startOfDay(new Date(day.dateString).getTime());
      if (!rangeEnabled) {
        setStart(ts);
        setEnd(endOfDay(ts));
        return;
      }
      if (!start || (start && end)) {
        setStart(ts);
        setEnd(null);
        return;
      }
      if (ts < start) {
        setEnd(endOfDay(start));
        setStart(ts);
      } else {
        setEnd(endOfDay(ts));
      }
    },
    [end, rangeEnabled, start]
  );

  const apply = React.useCallback(() => {
    setDateRange({
      start: start ?? undefined,
      end: end ?? undefined,
    });
    navigation.goBack();
  }, [end, navigation, setDateRange, start]);

  const clear = React.useCallback(() => {
    setStart(null);
    setEnd(null);
    setDateRange({});
  }, [setDateRange]);

  return (
    <AppSheet
      visible
      onClose={() => navigation.goBack()}
      eyebrow={t('calendar.selectDate')}
      title={new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      footer={(
        <View className="flex-row gap-3">
          <Pressable
            onPress={clear}
            className="flex-1 rounded-2xl bg-page border border-elevated px-4 py-4 items-center active:opacity-85"
          >
            <Text className="text-text font-extrabold">{t('calendar.clear')}</Text>
          </Pressable>
          <Pressable
            onPress={apply}
            className="flex-[2] rounded-2xl bg-danger px-4 py-4 items-center active:opacity-85"
          >
            <Text className="text-white font-extrabold">{t('calendar.apply')}</Text>
          </Pressable>
        </View>
      )}
    >
      <View className="rounded-2xl bg-page border border-elevated px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 rounded-2xl bg-elevated items-center justify-center">
              <AppIcon name="calendar-outline" size={18} color="#E04E4E" />
            </View>
            <View>
              <Text className="text-text font-extrabold">{t('calendar.selectRange')}</Text>
              <Text className="text-muted text-xs mt-1">{t('calendar.pickStartEnd')}</Text>
            </View>
          </View>
          <Switch
            value={rangeEnabled}
            onValueChange={setRangeEnabled}
            trackColor={{ false: '#E6E2E0', true: '#E04E4E' }}
            ios_backgroundColor="#E6E2E0"
          />
        </View>

        <View className="mt-4 flex-row gap-2">
          {[
            { label: t('calendar.presetToday'), onPress: () => { const s = startOfDay(today.getTime()); setStart(s); setEnd(endOfDay(s)); } },
            { label: t('calendar.presetLast7Days'), onPress: () => { const e = endOfDay(today.getTime()); const s = startOfDay(today.getTime() - 6 * 24 * 60 * 60 * 1000); setStart(s); setEnd(e); } },
            { label: t('calendar.presetThisMonth'), onPress: () => { const d = new Date(today); d.setDate(1); const s = startOfDay(d.getTime()); const e = endOfDay(today.getTime()); setStart(s); setEnd(e); } },
          ].map((p) => (
            <Pressable
              key={p.label}
              onPress={p.onPress}
              className="px-3 py-2 rounded-full bg-page border border-elevated active:opacity-80"
            >
              <Text className="text-text2 text-xs font-semibold">{p.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mt-4 rounded-2xl bg-page border border-elevated overflow-hidden">
        <Calendar
          onDayPress={onDayPress}
          markedDates={(() => {
            const marks: any = {};
            if (start) marks[toKey(start)] = { startingDay: true, color: '#E04E4E', textColor: '#fff' };
            if (end) marks[toKey(end)] = { endingDay: true, color: '#E04E4E', textColor: '#fff' };
            if (start && end) {
              const s = startOfDay(start);
              const e = startOfDay(end);
              for (let t = s; t <= e; t += 24 * 60 * 60 * 1000) {
                const k = toKey(t);
                if (k === toKey(start) || k === toKey(end)) continue;
                marks[k] = { color: '#FCE7E7', textColor: '#111217' };
              }
            }
            return marks;
          })()}
          markingType="period"
          theme={{
            todayTextColor: '#E04E4E',
            arrowColor: isDark ? '#C1C5CC' : '#6B6F75',
            monthTextColor: isDark ? '#F4F5F7' : '#111217',
            dayTextColor: isDark ? '#F4F5F7' : '#111217',
            textDisabledColor: isDark ? '#4B5563' : '#C8CCD2',
            calendarBackground: 'transparent',
            textDayFontWeight: '600',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '700',
          }}
        />
      </View>
    </AppSheet>
  );
}
