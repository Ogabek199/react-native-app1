import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert, Image, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { initDb } from '../features/journal/db/client';
import { journalRepo } from '../features/journal/repo/journalRepo';
import type { Attachment, JournalEntry } from '../features/journal/repo/types';
import { formatDate } from '../shared/lib/date';
import { Screen } from '../shared/ui/Screen';
import { AppIcon } from '../shared/ui/AppIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'EntryDetail'>;

const MOOD_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  Happy: { label: 'HAPPY', color: '#E04E4E', icon: 'sunny-outline' },
  Calm: { label: 'PEACEFUL', color: '#E04E4E', icon: 'happy-outline' },
  Neutral: { label: 'NEUTRAL', color: '#6B6F75', icon: 'remove-outline' },
  Sad: { label: 'SAD', color: '#6B6F75', icon: 'rainy-outline' },
};

function extractTags(text: string): string[] {
  const matches = text.match(/#\w+/g);
  return matches ? [...new Set(matches.map((t) => t))] : [];
}

export function EntryDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const entryId = route.params.entryId;
  const [entry, setEntry] = React.useState<JournalEntry | null>(null);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  const load = React.useCallback(() => {
    initDb();
    setEntry(journalRepo.getEntry(entryId));
    setAttachments(journalRepo.listAttachments(entryId));
  }, [entryId]);

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  React.useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playAudio = React.useCallback(async (att: Attachment) => {
    try {
      if (playingId === att.id) {
        await soundRef.current?.stopAsync();
        await soundRef.current?.unloadAsync();
        soundRef.current = null;
        setPlayingId(null);
        return;
      }
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: att.uri });
      soundRef.current = sound;
      setPlayingId(att.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
      await sound.playAsync();
    } catch (e: any) {
      Alert.alert(t('entryDetail.audioTitle'), e?.message ?? t('entryDetail.playbackFailed'));
    }
  }, [playingId, t]);

  if (!entry) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t('entryDetail.notFound')}</Text>
        </View>
      </Screen>
    );
  }

  const moodCfg = MOOD_CONFIG[entry.mood] ?? MOOD_CONFIG.Calm;
  const images = attachments.filter((a) => a.type === 'image');
  const audios = attachments.filter((a) => a.type === 'audio');
  const tags = extractTags(`${entry.title} ${entry.body}`);
  const heroImage = images[0]?.uri;

  const onShare = async () => {
    const text = [entry.title, '', entry.body].filter(Boolean).join('\n');
    try {
      await Share.share({ message: text });
    } catch {
      // cancelled
    }
  };

  const onDelete = () => {
    Alert.alert(t('entryDetail.deleteTitle'), t('entryDetail.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {heroImage ? (
          <View className="rounded-3xl overflow-hidden mb-5" style={{ height: 220 }}>
            <Image source={{ uri: heroImage }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          </View>
        ) : (
          <View className="rounded-3xl bg-[#FCE7E7] mb-5 items-center justify-center" style={{ height: 160 }}>
            <AppIcon name="document-text-outline" size={48} color="#E04E4E" />
          </View>
        )}

        <Text className="text-text text-2xl font-extrabold leading-8">{entry.title || t('entryDetail.untitled')}</Text>

        <View className="flex-row items-center gap-3 mt-3">
          <View className="flex-row items-center gap-1.5">
            <AppIcon name="calendar-outline" size={14} color="#8B8F95" />
            <Text className="text-muted text-xs font-semibold">{formatDate(entry.createdAt)}</Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3 py-1"
            style={{ backgroundColor: moodCfg.color + '18' }}
          >
            <AppIcon name={moodCfg.icon as any} size={14} color={moodCfg.color} />
            <Text style={{ color: moodCfg.color, fontSize: 11, fontWeight: '800' }}>{moodCfg.label}</Text>
          </View>
        </View>

        {tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mt-4">
            {tags.map((tag) => (
              <View key={tag} className="rounded-full bg-[#F3F4F6] px-3 py-1.5">
                <Text className="text-text2 text-xs font-semibold">{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className="mt-5">
          <Text className="text-text leading-7 text-base">{entry.body || '—'}</Text>
        </View>

        {(images.length > 0 || audios.length > 0) ? (
          <View className="mt-6">
            <View className="flex-row items-center gap-2 mb-3">
              <AppIcon name="attach-outline" size={18} color="#E04E4E" />
              <Text className="text-text font-extrabold text-base">{t('entryDetail.attachments')}</Text>
            </View>

            {images.length > 0 ? (
              <View className="flex-row flex-wrap gap-3">
                {images.map((img) => (
                  <View key={img.id} className="items-center">
                    <Image
                      source={{ uri: img.uri }}
                      className="rounded-2xl"
                      style={{ width: 100, height: 80 }}
                      resizeMode="cover"
                    />
                    <Text className="text-muted text-[10px] mt-1 font-semibold">{t('entryDetail.image')}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {audios.length > 0 ? (
              <View className="mt-3 gap-2">
                {audios.map((aud, i) => (
                  <Pressable
                    key={aud.id}
                    onPress={() => playAudio(aud)}
                    className="flex-row items-center gap-3 rounded-2xl bg-[#F3F4F6] px-4 py-3 active:opacity-80"
                  >
                    <View className="h-10 w-10 rounded-full bg-[#E04E4E] items-center justify-center">
                      <AppIcon
                        name={playingId === aud.id ? 'pause' : 'play'}
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-text text-sm font-bold">{t('entryDetail.voiceNote', { index: i + 1 })}</Text>
                      <Text className="text-muted text-xs">
                        {t('entryDetail.tapTo', { action: playingId === aud.id ? t('entryDetail.stop') : t('entryDetail.play') })}
                      </Text>
                    </View>
                    <AppIcon name="mic" size={18} color="#A9ADB2" />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center pb-6 pt-3 bg-page"
        style={{ borderTopWidth: 1, borderTopColor: '#E9ECEF', paddingHorizontal: 4 }}
      >
        <Pressable
          onPress={() => navigation.navigate('EntryEditor', { entryId: entry.id })}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#E04E4E] py-3.5 active:opacity-85"
        >
          <AppIcon name="create-outline" size={18} color="#FFFFFF" />
          <Text className="text-white font-extrabold">{t('entryDetail.editEntry')}</Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          className="ml-2 h-12 w-12 rounded-2xl bg-[#F3F4F6] items-center justify-center active:opacity-80"
        >
          <AppIcon name="share-outline" size={20} color="#6B6F75" />
        </Pressable>
        <Pressable
          onPress={onDelete}
          className="ml-2 h-12 w-12 rounded-2xl bg-[#F3F4F6] items-center justify-center active:opacity-80"
        >
          <AppIcon name="trash-outline" size={20} color="#E04E4E" />
        </Pressable>
      </View>
    </Screen>
  );
}
