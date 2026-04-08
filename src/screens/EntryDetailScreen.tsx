import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { initDb } from '../features/journal/db/client';
import { journalRepo } from '../features/journal/repo/journalRepo';
import type { Attachment, JournalEntry } from '../features/journal/repo/types';
import { formatDate, formatTime } from '../shared/lib/date';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'EntryDetail'>;

export function EntryDetailScreen({ navigation, route }: Props) {
  const entryId = route.params.entryId;
  const [entry, setEntry] = React.useState<JournalEntry | null>(null);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);

  const load = React.useCallback(() => {
    initDb();
    setEntry(journalRepo.getEntry(entryId));
    setAttachments(journalRepo.listAttachments(entryId));
  }, [entryId]);

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  if (!entry) {
    return (
      <Screen>
        <Card>
          <Text className="text-text font-semibold">Qayd topilmadi</Text>
          <Text className="text-muted mt-1">Ehtimol o‘chirib yuborilgan.</Text>
          <View className="mt-4">
            <Button title="Orqaga" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        </Card>
      </Screen>
    );
  }

  const onDelete = () => {
    Alert.alert('O‘chirish', 'Qayd o‘chirilsinmi?', [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'O‘chirish',
        style: 'destructive',
        onPress: () => {
          journalRepo.deleteEntry(entry.id);
          navigation.popToTop();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-3 pb-10">
        <Text className="text-text text-2xl font-bold">{entry.title}</Text>
        <Text className="text-muted text-xs">
          {formatDate(entry.createdAt)} • {formatTime(entry.createdAt)}
        </Text>

        <Card>
          <Text className="text-text leading-6">{entry.body || '—'}</Text>
        </Card>

        {attachments.length > 0 ? (
          <Card>
            <Text className="text-text font-semibold mb-2">Rasmlar</Text>
            <View className="flex-row flex-wrap gap-2">
              {attachments.slice(0, 6).map((a) => (
                <Pressable
                  key={a.id}
                  onLongPress={() => journalRepo.deleteAttachment(a.id)}
                  className="active:opacity-80"
                >
                  <Image
                    source={{ uri: a.uri }}
                    style={{ width: 96, height: 96 }}
                    className="rounded-xl bg-black/20"
                  />
                </Pressable>
              ))}
            </View>
            <Text className="text-muted mt-3 text-xs">
              Uzoq bosib tursangiz rasm o‘chadi. (MVP)
            </Text>
          </Card>
        ) : null}

        <View className="flex-row gap-3">
          <Button
            title="Tahrirlash"
            onPress={() => navigation.navigate('EntryEditor', { entryId: entry.id })}
            className="flex-1"
          />
          <Button title="O‘chirish" variant="ghost" onPress={onDelete} className="flex-1" />
        </View>
      </ScrollView>
    </Screen>
  );
}

