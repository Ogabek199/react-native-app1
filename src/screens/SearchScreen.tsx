import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { initDb } from '../features/journal/db/client';
import { journalRepo } from '../features/journal/repo/journalRepo';
import type { JournalEntry } from '../features/journal/repo/types';
import { formatDate } from '../shared/lib/date';
import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { TextField } from '../shared/ui/TextField';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<JournalEntry[]>([]);

  React.useEffect(() => {
    initDb();
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setResults(journalRepo.searchEntries(q));
  }, [query]);

  return (
    <Screen>
      <View className="gap-3">
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Kalit so‘z..."
          autoFocus
        />

        {results.length === 0 && query.trim() ? (
          <Card>
            <Text className="text-text font-semibold">Hech narsa topilmadi</Text>
            <Text className="text-muted mt-1">Boshqa so‘z bilan urinib ko‘ring.</Text>
          </Card>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(e) => e.id}
          contentContainerClassName="gap-3 pb-10"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })}
              className="active:opacity-80"
            >
              <Card>
                <Text className="text-text font-semibold" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-muted mt-1 text-xs">{formatDate(item.createdAt)}</Text>
                <Text className="text-muted mt-2" numberOfLines={2}>
                  {item.body}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      </View>
    </Screen>
  );
}

