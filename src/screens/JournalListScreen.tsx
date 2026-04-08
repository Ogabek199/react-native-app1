import * as React from 'react';
import { FlatList, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { initDb } from '../features/journal/db/client';
import { journalRepo } from '../features/journal/repo/journalRepo';
import type { JournalEntry } from '../features/journal/repo/types';
import { formatDate, formatTime } from '../shared/lib/date';
import { Chip } from '../shared/ui/Chip';
import { IconButton } from '../shared/ui/IconButton';
import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { AppIcon } from '../shared/ui/AppIcon';
import { useJournalFiltersStore } from '../store/useJournalFiltersStore';

export function JournalListScreen() {
  const navigation = useNavigation<any>();
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

  return (
    <Screen>
      <View className="items-center">
        <View className="w-full">
          <Text className="text-text text-xl font-extrabold text-center">My Reflections</Text>
          <Pressable
            onPress={() => {
              navigation.navigate('JournalCalendar');
            }}
            className="absolute right-0 top-0 h-11 w-11 rounded-full border border-[#F3D6D6] items-center justify-center bg-page active:opacity-80"
          >
            <AppIcon name="calendar-outline" size={22} color="#E04E4E" />
          </Pressable>
        </View>
        <View className="h-[1px] bg-elevated w-full mt-4" />
      </View>

      <View className="flex-row gap-4 mt-5">
        <Card className="flex-1">
          <View className="h-11 w-11 rounded-full bg-danger items-center justify-center">
            <AppIcon name="flame" size={20} color="#FFFFFF" />
          </View>
          <Text className="text-text text-2xl font-extrabold mt-3">12 Days</Text>
          <Text className="text-muted text-xs mt-1">CURRENT STREAK</Text>
        </Card>
        <Card className="flex-1 bg-[#FCE7E7]">
          <View className="h-11 w-11 rounded-full bg-danger items-center justify-center">
            <AppIcon name="book" size={20} color="#FFFFFF" />
          </View>
          <Text className="text-text text-2xl font-extrabold mt-3">{entries.length}</Text>
          <Text className="text-muted text-xs mt-1">TOTAL ENTRIES</Text>
        </Card>
      </View>

      <View className="mt-4 flex-row items-center gap-3 rounded-2xl bg-card px-4 py-3 border border-[#E9ECEF]">
        <AppIcon name="search-outline" size={18} color="#8B8F95" />
        <TextInput
          value={filters.query}
          onChangeText={setQuery}
          placeholder="Search your memories..."
          placeholderTextColor="#8B8F95"
          className="flex-1 text-text"
        />
      </View>

      <View className="mt-4 flex-row items-center gap-3">
        <Pressable
          onPress={() => navigation.navigate('JournalFilters')}
          className="h-10 w-10 rounded-full bg-card items-center justify-center border border-[#E9ECEF] active:opacity-80"
        >
          <AppIcon name="funnel-outline" size={18} color="#8B8F95" />
        </Pressable>
        <View className="flex-row gap-2 flex-1">
          <Chip label="Happy" selected={filters.moods.includes('Happy')} onPress={() => toggleMood('Happy')} />
          <Chip label="Calm" selected={filters.moods.includes('Calm')} onPress={() => toggleMood('Calm')} />
          <Chip label="Neutral" selected={filters.moods.includes('Neutral')} onPress={() => toggleMood('Neutral')} />
          <Chip
            label="Sad"
            selected={filters.moods.includes('Sad')}
            onPress={() => toggleMood('Sad')}
          />
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-text font-extrabold text-lg">Recent Entries</Text>
        <Pressable className="active:opacity-80" onPress={() => {}}>
          <Text className="text-danger font-semibold">View All ›</Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-1">
        {list.length === 0 ? (
          <Card className="mt-6">
            <Text className="text-text text-base font-semibold mb-1">
              {entries.length === 0 ? 'Hali qayd yo‘q' : 'Hech narsa topilmadi'}
            </Text>
            <Text className="text-muted">
              {entries.length === 0
                ? 'Pastdagi “+” tugmasini bosib birinchi qaydingizni yozing.'
                : 'Filter yoki qidiruvni o‘zgartirib ko‘ring.'}
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
      <View className="rounded-3xl bg-card border border-[#E9ECEF] px-5 py-5 shadow-black/5 shadow-lg">
        <View className="flex-row items-start justify-between">
          <Text className="text-muted text-sm font-semibold">{formatDate(entry.createdAt)}</Text>
          <View className="flex-row items-center gap-2 rounded-full border border-[#E9ECEF] bg-page px-3 py-2">
            <AppIcon name={moodIcon as any} size={16} color="#6B6F75" />
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

