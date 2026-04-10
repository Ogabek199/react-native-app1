import * as React from 'react';
import { Modal, Pressable, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';

import { Screen } from '../shared/ui/Screen'; 
import { AppIcon } from '../shared/ui/AppIcon';
import { endOfDay, startOfDay } from '../shared/lib/dateRange';
import { useJournalFiltersStore } from '../store/useJournalFiltersStore';

export function JournalCalendarScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const dateRange = useJournalFiltersStore((s) => s.filters.dateRange);
  const setDateRange = useJournalFiltersStore((s) => s.setDateRange);

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
    <Modal transparent animationType="slide" onRequestClose={() => navigation.goBack()}>
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="flex-1" onPress={() => navigation.goBack()} />
        <View className="bg-page rounded-t-3xl px-5 pt-3 pb-6">
          <View className="items-center">
            <View className="h-1 w-12 rounded-full bg-[#DADDE2]" />
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <View>
              <Text className="text-muted text-xs font-semibold">{t('calendar.selectDate').toUpperCase()}</Text>
              <Text className="text-text font-extrabold text-lg">
                {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center">
              <AppIcon name="close" size={22} color="#111217" />
            </Pressable>
          </View>

          <View className="mt-4 rounded-2xl bg-card border border-[#E9ECEF] px-4 py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-9 w-9 rounded-2xl bg-[#FCE7E7] items-center justify-center">
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
                  className="px-3 py-2 rounded-full bg-page border border-[#E9ECEF] active:opacity-80"
                >
                  <Text className="text-text2 text-xs font-semibold">{p.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-page border border-[#E9ECEF] overflow-hidden">
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
                arrowColor: '#6B6F75',
                monthTextColor: '#111217',
                textDayFontWeight: '600',
                textMonthFontWeight: '800',
                textDayHeaderFontWeight: '700',
              }}
            />
          </View>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={clear}
              className="flex-1 rounded-2xl bg-page border border-[#E9ECEF] px-4 py-4 items-center active:opacity-85"
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
        </View>
      </View>
    </Modal>
  );
}

