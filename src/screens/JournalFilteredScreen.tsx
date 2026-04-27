import * as React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Screen } from '../shared/ui/Screen';
import { AppIcon } from '../shared/ui/AppIcon';
import { initDb } from '../features/journal/db/client';
import { journalRepo } from '../features/journal/repo/journalRepo';
import type { JournalEntry } from '../features/journal/repo/types';
import { useJournalFiltersStore } from '../store/useJournalFiltersStore';
import type { JournalFilters } from '../features/journal/filters/types';
import { formatDate, formatTime } from '../shared/lib/date';
import { Card } from '../shared/ui/Card';
import { Chip } from '../shared/ui/Chip';
import { Image } from 'react-native';

function applyFilters(entries: JournalEntry[], filters: JournalFilters) {
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
}

function EntryCard({ entry, onPress }: { entry: JournalEntry; onPress: () => void }) {
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
            <Text className="text-text2 text-xs font-semibold">{mood}</Text>
          </View>
        </View>

        <View className="flex-row items-center mt-2">
          <View className="flex-1 pr-4">
            <Text className="text-text font-extrabold text-2xl" numberOfLines={1}>
              {entry.title || 'Untitled'}
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
            <Image source={{ uri: img }} className="rounded-2xl bg-elevated" style={{ width: 96, height: 96 }} />
          ) : (
            <View className="rounded-2xl bg-elevated" style={{ width: 96, height: 96 }} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function JournalFilteredScreen() {
  const navigation = useNavigation<any>();
  const filters = useJournalFiltersStore((s) => s.filters);
  const toggleMood = useJournalFiltersStore((s) => s.toggleMood);

  const [entries, setEntries] = React.useState<JournalEntry[]>([]);

  React.useEffect(() => {
    initDb();
    setEntries(journalRepo.listEntries());
  }, []);

  const results = React.useMemo(() => applyFilters(entries, filters), [entries, filters]);

  return (
    <Screen>
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center">
            <AppIcon name="chevron-back" size={22} color="#A9ADB2" />
          </Pressable>
          <Text className="text-text font-extrabold text-base">Filtered</Text>
          <Pressable onPress={() => navigation.navigate('JournalFilters')} className="h-10 w-10 items-center justify-center">
            <AppIcon name="options-outline" size={22} color="#A9ADB2" />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-muted text-xs font-semibold">RESULTS ({results.length})</Text>
          <Text className="text-danger font-semibold text-xs">Refine Search</Text>
        </View>

        <Card>
          <Text className="text-muted text-xs font-semibold">MOOD FILTERS</Text>
          <View className="mt-3 flex-row gap-2">
            {(['Happy', 'Calm', 'Neutral', 'Sad'] as const).map((m) => (
              <Chip key={m} label={m} selected={filters.moods.includes(m)} onPress={() => toggleMood(m)} />
            ))}
          </View>
        </Card>

        <FlatList
          data={results}
          keyExtractor={(e) => e.id}
          contentContainerClassName="gap-3 pb-28"
          renderItem={({ item }) => (
            <EntryCard entry={item} onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })} />
          )}
        />
      </View>
    </Screen>
  );
}

