import * as React from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Screen } from '../shared/ui/Screen';
import { Card } from '../shared/ui/Card';
import { AppIcon } from '../shared/ui/AppIcon';
import { useJournalFiltersStore } from '../store/useJournalFiltersStore';
import { formatShortDate } from '../shared/lib/dateRange';
import type { JournalMood } from '../features/journal/filters/types';

function MoodCircle({ mood, selected, onPress }: { mood: JournalMood; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const emoji = mood === 'Happy' ? '☀️' : mood === 'Calm' ? '☕️' : mood === 'Neutral' ? '🙂' : '🌧️';
  const label =
    mood === 'Happy'
      ? t('moods.happy')
      : mood === 'Calm'
        ? t('moods.calm')
        : mood === 'Neutral'
          ? t('moods.neutral')
          : t('moods.sad');
  return (
    <Pressable
      onPress={onPress}
      className={[
        'items-center justify-center h-14 w-14 rounded-2xl border',
        selected ? 'bg-elevated border-danger' : 'bg-page border-elevated',
        'active:opacity-80',
      ].join(' ')}
    >
      <Text className="text-xl">{emoji}</Text>
      <Text
        numberOfLines={2}
        className={['mt-1 font-semibold', selected ? 'text-danger' : 'text-muted'].join(' ')}
        style={{ fontSize: 9, lineHeight: 11, textAlign: 'center', width: 54 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function JournalFiltersScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const filters = useJournalFiltersStore((s) => s.filters);
  const setQuery = useJournalFiltersStore((s) => s.setQuery);
  const toggleMood = useJournalFiltersStore((s) => s.toggleMood);
  const setWithPhotos = useJournalFiltersStore((s) => s.setWithPhotos);
  const setWithAudio = useJournalFiltersStore((s) => s.setWithAudio);
  const toggleTag = useJournalFiltersStore((s) => s.toggleTag);
  const addTag = useJournalFiltersStore((s) => s.addTag);
  const reset = useJournalFiltersStore((s) => s.reset);
  const [tagText, setTagText] = React.useState('');

  const dateLabel = React.useMemo(() => {
    if (!filters.dateRange.start && !filters.dateRange.end) return t('filters.anyDate');
    if (filters.dateRange.start && filters.dateRange.end) {
      return `${formatShortDate(filters.dateRange.start)} - ${formatShortDate(filters.dateRange.end)}`;
    }
    return filters.dateRange.start
      ? t('filters.fromDate', { date: formatShortDate(filters.dateRange.start) })
      : t('filters.untilDate', { date: formatShortDate(filters.dateRange.end!) });
  }, [filters.dateRange.end, filters.dateRange.start, t]);

  return (
    <Screen>
      <View className="flex-1">
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center">
              <AppIcon name="close" size={22} color="#A9ADB2" />
            </Pressable>
            <Text className="text-text font-extrabold text-base">{t('filters.title')}</Text>
          </View>

          <View className="rounded-2xl bg-card px-4 py-3 border border-elevated flex-row items-center gap-3">
            <AppIcon name="search-outline" size={18} color="#A9ADB2" />
            <TextInput
              value={filters.query}
              onChangeText={setQuery}
              placeholder={t('filters.searchPlaceholder')}
              placeholderTextColor="#8B919A"
              className="flex-1 text-text"
            />
          </View>

          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted text-xs font-semibold">{t('filters.dateRange').toUpperCase()}</Text>
              <Pressable onPress={() => navigation.navigate('JournalCalendar')} className="active:opacity-80">
                <Text className="text-danger font-semibold text-xs">{t('common.edit')}</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => navigation.navigate('JournalCalendar')}
              className="mt-3 rounded-2xl border border-elevated bg-page px-4 py-4 flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-2xl bg-elevated items-center justify-center">
                  <AppIcon name="calendar-outline" size={18} color="#E04E4E" />
                </View>
                <View>
                  <Text className="text-text font-extrabold">{dateLabel}</Text>
                  <Text className="text-muted text-xs mt-1">{t('filters.lastDays', { count: 14 }).toUpperCase()}</Text>
                </View>
              </View>
              <AppIcon name="chevron-forward" size={18} color="#A9ADB2" />
            </Pressable>
          </Card>

          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted text-xs font-semibold">{t('filters.moods').toUpperCase()}</Text>
              <Text className="text-danger font-semibold text-xs">{t('home.viewAll')}</Text>
            </View>
            <View className="mt-3 flex-row gap-3">
              {(['Happy', 'Calm', 'Neutral', 'Sad'] as const).map((m) => (
                <MoodCircle key={m} mood={m} selected={filters.moods.includes(m)} onPress={() => toggleMood(m)} />
              ))}
            </View>
          </Card>

          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted text-xs font-semibold">{t('filters.tags').toUpperCase()}</Text>
              <Text className="text-danger font-semibold text-xs">{t('filters.suggestions')}</Text>
            </View>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {['grateful', 'nature', 'travel', 'work', 'family'].map((t) => (
                <Pressable
                  key={t}
                  onPress={() => toggleTag(t)}
                  className={[
                    'px-3 py-2 rounded-full border',
                    filters.tags.includes(t) ? 'bg-elevated border-elevated' : 'bg-page border-elevated',
                    'active:opacity-80',
                  ].join(' ')}
                >
                  <Text className="text-text2 text-xs font-semibold">#{t}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  addTag(tagText);
                  setTagText('');
                }}
                className="px-3 py-2 rounded-full border border-elevated bg-page active:opacity-80"
              >
                <Text className="text-text2 text-xs font-semibold">{t('filters.addTag')}</Text>
              </Pressable>
            </View>
            <View className="mt-3 rounded-2xl bg-page border border-elevated px-4 py-3">
              <TextInput
                value={tagText}
                onChangeText={setTagText}
                placeholder={t('filters.tagInputPlaceholder')}
                placeholderTextColor="#8B919A"
                className="text-text"
              />
            </View>
          </Card>

          <Card>
            <Text className="text-muted text-xs font-semibold">{t('filters.attachments').toUpperCase()}</Text>
            <View className="mt-3 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <AppIcon name="image-outline" size={18} color="#A9ADB2" />
                  <View>
                    <Text className="text-text font-extrabold">{t('filters.hasImages')}</Text>
                    <Text className="text-muted text-xs mt-1">{t('filters.hasImagesSub')}</Text>
                  </View>
                </View>
                <Switch
                  value={filters.withPhotos}
                  onValueChange={setWithPhotos}
                  trackColor={{ false: '#E6E2E0', true: '#E04E4E' }}
                  ios_backgroundColor="#E6E2E0"
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <AppIcon name="mic-outline" size={18} color="#A9ADB2" />
                  <View>
                    <Text className="text-text font-extrabold">{t('filters.hasAudio')}</Text>
                    <Text className="text-muted text-xs mt-1">{t('filters.hasAudioSub')}</Text>
                  </View>
                </View>
                <Switch
                  value={filters.withAudio}
                  onValueChange={setWithAudio}
                  trackColor={{ false: '#E6E2E0', true: '#E04E4E' }}
                  ios_backgroundColor="#E6E2E0"
                />
              </View>
            </View>
          </Card>
        </View>

        <View className="mt-auto flex-row gap-3 items-center mb-6">
          <Pressable
            onPress={reset}
            className="flex-1 rounded-2xl bg-page border border-elevated px-4 py-4 items-center active:opacity-85"
          >
            <Text className="text-text font-extrabold">{t('filters.reset')}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('JournalFiltered')}
            className="flex-[2] rounded-2xl bg-danger px-4 py-4 items-center active:opacity-85"
          >
            <Text className="text-white font-extrabold">{t('filters.apply')}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

