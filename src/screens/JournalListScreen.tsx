import * as React from 'react';
import { FlatList, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { initDb } from '../features/journal/db/client';
import { journalRepo } from '../features/journal/repo/journalRepo';
import type { JournalEntry } from '../features/journal/repo/types';
import { formatDate, formatTime } from '../shared/lib/date';
import { getCurrentStreak } from '../shared/lib/streak';
import { Chip } from '../shared/ui/Chip';
import { IconButton } from '../shared/ui/IconButton';
import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { AppIcon } from '../shared/ui/AppIcon';
import { useJournalFiltersStore } from '../store/useJournalFiltersStore';
import { useSettingsStore } from '../store/useSettingsStore';

function useGreeting(t: (key: string, opts?: any) => string, name: string) {
  const hour = new Date().getHours();
  const first = name.split(' ')[0];
  if (hour < 12) return t('home.greeting.morning', { name: first });
  if (hour < 18) return t('home.greeting.afternoon', { name: first });
  return t('home.greeting.evening', { name: first });
}

export function JournalListScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const userName = useSettingsStore((s) => s.userName);
  const profileImageUri = useSettingsStore((s) => s.profileImageUri);
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const filters = useJournalFiltersStore((s) => s.filters);
  const setQuery = useJournalFiltersStore((s) => s.setQuery);
  const toggleMood = useJournalFiltersStore((s) => s.toggleMood);

  const load = React.useCallback(() => {
    initDb();
    setEntries(journalRepo.listEntries());
  }, []);

  React.useEffect(() => {
    const unsub = navigation.addListener?.('focus', load);
    if (typeof unsub === 'function') return unsub;
    load();
    return undefined;
  }, [navigation, load]);

  const list = React.useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filters.moods.length && !filters.moods.includes(e.mood)) return false;
      if (q) {
        const hay = `${e.title} ${e.body}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.dateRange.start != null && e.createdAt < filters.dateRange.start) return false;
      if (filters.dateRange.end != null && e.createdAt > filters.dateRange.end) return false;
      if (filters.withPhotos) {
        const uri = journalRepo.getFirstImageUri(e.id);
        if (!uri) return false;
      }
      if (filters.withAudio) {
        if (!journalRepo.hasAttachment(e.id, 'audio')) return false;
      }
      if (filters.tags.length) {
        const hay = `${e.title} ${e.body}`.toLowerCase();
        for (const tag of filters.tags) {
          if (!hay.includes(`#${tag}`) && !hay.includes(tag)) return false;
        }
      }
      return true;
    });
  }, [entries, filters]);

  const currentStreak = React.useMemo(() => getCurrentStreak(entries), [entries]);

  return (
    <Screen>
      <View className="items-center">
        <View className="w-full">
          <Text className="text-text text-xl font-extrabold text-center">{t('home.title')}</Text>
          <Pressable
            onPress={() => {
              navigation.navigate('JournalCalendar');
            }}
            className="absolute right-0 top-0 h-11 w-11 rounded-full border border-elevated items-center justify-center bg-page active:opacity-80"
          >
            <AppIcon name="calendar-outline" size={22} color="#E04E4E" />
          </Pressable>
        </View>
        <View className="h-[1px] bg-elevated w-full mt-6" />
      </View>

      <View className="mt-4 rounded-3xl bg-card border border-elevated px-4 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 rounded-full bg-card items-center justify-center overflow-hidden border-2 border-card"
            style={{ shadowColor: '#E04E4E', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
          >
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={{ width: 52, height: 52, borderRadius: 26 }} />
            ) : (
              <AppIcon name="person" size={26} color="#E04E4E" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-text text-lg font-extrabold">{useGreeting(t, userName)}</Text>
            <Text className="text-muted text-xs mt-0.5">{t('home.greetingSubtitle')}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('EntryEditor', {})}
            className="h-10 w-10 rounded-full bg-[#E04E4E] items-center justify-center active:opacity-80"
            style={{ shadowColor: '#E04E4E', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
          >
            <AppIcon name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View className="flex-row gap-4 mt-4">
        <Card className="flex-1">
          <View className="h-11 w-11 rounded-full bg-danger items-center justify-center">
            <AppIcon name="flame" size={20} color="#FFFFFF" />
          </View>
          <Text className="text-text text-2xl font-extrabold mt-3">{t('home.currentStreakValue', { count: currentStreak })}</Text>
          <Text className="text-muted text-xs mt-1">{t('home.currentStreak')}</Text>
        </Card>
        <Card className="flex-1">
          <View className="h-11 w-11 rounded-full bg-danger items-center justify-center">
            <AppIcon name="book" size={20} color="#FFFFFF" />
          </View>
          <Text className="text-text text-2xl font-extrabold mt-3">{entries.length}</Text>
          <Text className="text-muted text-xs mt-1">{t('home.totalEntries')}</Text>
        </Card>
      </View>

      <View className="mt-4 flex-row items-center gap-3 rounded-2xl bg-card px-4 py-3 border border-elevated">
        <AppIcon name="search-outline" size={18} color="#A9ADB2" />
        <TextInput
          value={filters.query}
          onChangeText={setQuery}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor="#8B919A"
          className="flex-1 text-text"
        />
      </View>

      <View className="mt-4 flex-row items-center gap-3">
        <Pressable
          onPress={() => navigation.navigate('JournalFilters')}
          className="h-10 w-10 rounded-full bg-card items-center justify-center border border-elevated active:opacity-80"
        >
          <AppIcon name="funnel-outline" size={18} color="#A9ADB2" />
        </Pressable>
        <View className="flex-row gap-2 flex-1">
          <Chip label={t('moods.happy')} selected={filters.moods.includes('Happy')} onPress={() => toggleMood('Happy')} />
          <Chip label={t('moods.calm')} selected={filters.moods.includes('Calm')} onPress={() => toggleMood('Calm')} />
          <Chip label={t('moods.neutral')} selected={filters.moods.includes('Neutral')} onPress={() => toggleMood('Neutral')} />
          <Chip
            label={t('moods.sad')}
            selected={filters.moods.includes('Sad')}
            onPress={() => toggleMood('Sad')}
          />
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-text font-extrabold text-lg">{t('home.recentEntries')}</Text>
        <Pressable className="active:opacity-80" onPress={() => {}}>
          <Text className="text-danger font-semibold">{t('home.viewAll')} ›</Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-1">
        {list.length === 0 ? (
          <Card className="mt-6">
            <Text className="text-text text-base font-semibold mb-1">
              {entries.length === 0 ? t('home.emptyTitle') : t('search.noResultsTitle')}
            </Text>
            <Text className="text-muted">
              {entries.length === 0
                ? t('home.emptyBody')
                : t('search.noResultsBody')}
            </Text>
          </Card>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(e) => e.id}
            contentContainerClassName="gap-3 pb-24"
            renderItem={({ item }) => (
              <EntryRow
                entry={item}
                onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })}
              />
            )}
          />
        )}
      </View>

    </Screen>
  );
}

function EntryRow({ entry, onPress }: { entry: JournalEntry; onPress: () => void }) {
  const { t } = useTranslation();
  const img = journalRepo.getFirstImageUri(entry.id);
  const mood = entry.mood ?? 'Calm';
  const moodIcon =
    mood === 'Happy'
      ? 'happy-outline'
      : mood === 'Sad'
        ? 'rainy-outline'
        : mood === 'Neutral'
          ? 'ellipse-outline'
          : 'cafe-outline';
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View className="rounded-3xl bg-card border border-elevated px-5 py-5 shadow-black/5 shadow-lg">
        <View className="flex-row items-start justify-between">
          <Text className="text-muted text-sm font-semibold">{formatDate(entry.createdAt)}</Text>
          <View className="flex-row items-center gap-2 rounded-full border border-elevated bg-page px-3 py-2">
            <AppIcon name={moodIcon as any} size={16} color="#A9ADB2" />
            <Text className="text-text2 text-xs font-semibold">
              {mood === 'Happy'
                ? t('moods.happy')
                : mood === 'Calm'
                  ? t('moods.calm')
                  : mood === 'Neutral'
                    ? t('moods.neutral')
                    : t('moods.sad')}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mt-2">
          <View className="flex-1 pr-4">
            <Text className="text-text font-extrabold text-2xl" numberOfLines={1}>
              {entry.title || t('entryDetail.untitled')}
            </Text>
            <Text className="text-text2 mt-2 leading-6" numberOfLines={2}>
              {entry.body}
            </Text>

            <View className="flex-row items-center gap-2 mt-4">
              <Text className="text-muted text-xs font-extrabold">{formatTime(entry.createdAt)}</Text>
              <Text className="text-muted text-xs font-extrabold">•</Text>
              <View className="px-2.5 py-1 rounded-full bg-elevated">
                <Text className="text-text2 text-[10px] font-semibold">#Daily</Text>
              </View>
              <View className="px-2.5 py-1 rounded-full bg-elevated">
                <Text className="text-text2 text-[10px] font-semibold">#Thoughts</Text>
              </View>
            </View>
          </View>

          {img ? (
            <Image
              source={{ uri: img }}
              className="rounded-2xl bg-elevated"
              style={{ width: 96, height: 96 }}
            />
          ) : (
            <View className="rounded-2xl bg-elevated" style={{ width: 96, height: 96 }} />
          )}
        </View>
      </View>
    </Pressable>
  );
}
