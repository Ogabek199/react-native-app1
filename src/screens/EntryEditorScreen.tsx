import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { initDb } from '../features/journal/db/client';
import { journalRepo } from '../features/journal/repo/journalRepo';
import { Chip } from '../shared/ui/Chip';
import { Screen } from '../shared/ui/Screen';
import { TextField } from '../shared/ui/TextField';
import { AppIcon } from '../shared/ui/AppIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'EntryEditor'>;

export function EntryEditorScreen({ navigation, route }: Props) {
  const entryId = route.params?.entryId;
  const [savedId, setSavedId] = React.useState<string | null>(entryId ?? null);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [mood, setMood] = React.useState<'Happy' | 'Calm' | 'Neutral' | 'Sad'>('Calm');
  const [stickersOpen, setStickersOpen] = React.useState(false);
  const [tagOpen, setTagOpen] = React.useState(false);
  const [tagText, setTagText] = React.useState('');
  const [boldOn, setBoldOn] = React.useState(false);
  const [italicOn, setItalicOn] = React.useState(false);
  const [largeTextOn, setLargeTextOn] = React.useState(false);

  React.useEffect(() => {
    initDb();
    if (!entryId) return;
    const entry = journalRepo.getEntry(entryId);
    if (!entry) return;
    setTitle(entry.title);
    setBody(entry.body);
    setMood(entry.mood ?? 'Calm');
  }, [entryId]);

  const onSave = React.useCallback(() => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle && !trimmedBody) {
      Alert.alert('Bo‘sh qayd', 'Hech bo‘lmasa title yoki matn kiriting.');
      return;
    }

    const saved = journalRepo.upsertEntry({
      id: entryId,
      title: trimmedTitle || 'Untitled',
      body: trimmedBody,
      mood,
    });

    setSavedId(saved.id);
    navigation.replace('EntryDetail', { entryId: saved.id });
  }, [title, body, entryId, navigation]);

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: entryId ? 'Edit Reflection' : 'Write Reflection',
      headerRight: () => (
        <Pressable
          onPress={onSave}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          className="rounded-full bg-danger active:opacity-85"
        >
          <Text className="text-white font-extrabold">Save</Text>
        </Pressable>
      ),
    });
  }, [navigation, onSave, entryId]);

  const ensureSaved = React.useCallback((): string | null => {
    if (savedId) return savedId;
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle && !trimmedBody) {
      Alert.alert('Avval matn kiriting', 'Rasm qo‘shishdan oldin qaydni saqlaymiz.');
      return null;
    }
    const saved = journalRepo.upsertEntry({
      title: trimmedTitle || 'Untitled',
      body: trimmedBody,
      mood,
    });
    setSavedId(saved.id);
    return saved.id;
  }, [savedId, title, body]);

  const addFromGallery = React.useCallback(async () => {
    try {
      const id = ensureSaved();
      if (!id) return;

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Ruxsat kerak', 'Galereyaga ruxsat bering.');
        return;
      }

      // Android builds can be flaky with multiple selection depending on picker.
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      journalRepo.addImageAttachment(id, uri);
      Alert.alert('Saqlandi', 'Rasm biriktirildi.');
    } catch (e: any) {
      Alert.alert('Gallery', e?.message ?? 'Failed to pick image');
    }
  }, [ensureSaved]);

  const takePhoto = React.useCallback(async () => {
    try {
      const id = ensureSaved();
      if (!id) return;

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Ruxsat kerak', 'Kameraga ruxsat bering.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      journalRepo.addImageAttachment(id, uri);
      Alert.alert('Saqlandi', 'Surat biriktirildi.');
    } catch (e: any) {
      Alert.alert('Camera', e?.message ?? 'Failed to take photo');
    }
  }, [ensureSaved]);

  const appendToBody = React.useCallback(
    (text: string) => {
      setBody((prev) => (prev ? `${prev}${prev.endsWith(' ') ? '' : ' '}${text}` : text));
    },
    [setBody]
  );

  const onPickSticker = React.useCallback(
    (emoji: string) => {
      appendToBody(emoji);
      setStickersOpen(false);
    },
    [appendToBody]
  );

  const onAddTag = React.useCallback(() => {
    const t = tagText.trim().replace(/^#/, '');
    if (!t) return;
    appendToBody(`#${t}`);
    setTagText('');
    setTagOpen(false);
  }, [appendToBody, tagText]);

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 pb-24">
        <View className="rounded-3xl bg-[#FCE7E7] px-5 py-5 gap-4">
          <Text className="text-text2 font-semibold">How are you feeling?</Text>

          <View className="flex-row justify-between">
            {(['Happy', 'Calm', 'Neutral', 'Sad'] as const).map((m) => {
              const selected = mood === m;
              const icon =
                m === 'Happy' ? 'sunny-outline' : m === 'Calm' ? 'happy-outline' : m === 'Neutral' ? 'remove-outline' : 'rainy-outline';
              return (
                <View key={m} className="items-center w-[23%]">
                  <Pressable
                    onPress={() => setMood(m)}
                    className={[
                      'w-full rounded-3xl bg-page items-center justify-center py-4 border',
                      selected ? 'border-danger' : 'border-[#E9ECEF]',
                      'active:opacity-85',
                    ].join(' ')}
                  >
                    <View
                      className={[
                        'h-11 w-11 rounded-full items-center justify-center border',
                        selected ? 'border-danger' : 'border-[#DADDE2]',
                      ].join(' ')}
                    >
                      <AppIcon name={icon as any} size={22} color={selected ? '#E04E4E' : '#A9ADB2'} />
                    </View>
                    <Text className={['mt-2 text-xs font-semibold', selected ? 'text-text' : 'text-muted'].join(' ')}>
                      {m}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-page border border-[#E9ECEF]">
              <AppIcon name="calendar-outline" size={16} color="#6B6F75" />
              <Text className="text-text2 text-xs font-semibold">{new Date().toLocaleDateString()}</Text>
            </View>
            <View className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-page border border-[#E9ECEF]">
              <AppIcon name="time-outline" size={16} color="#6B6F75" />
              <Text className="text-text2 text-xs font-semibold">
                {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View className="ml-auto px-4 py-2 rounded-full bg-[#FCE7E7] border border-[#F3D6D6]">
              <Text className="text-danger text-xs font-extrabold">
                {body.trim().split(/\s+/).filter(Boolean).length} Words
              </Text>
            </View>
          </View>

          <TextField
            value={title}
            onChangeText={setTitle}
            placeholder="Title of your reflection..."
            returnKeyType="next"
            className="text-2xl font-extrabold text-text"
          />

          <View className="w-full rounded-3xl bg-page border border-[#E9ECEF]">
            <TextField
              value={body}
              onChangeText={setBody}
              placeholder="Start your mindful reflection here..."
              multiline
              className={[
                'min-h-[320px]',
                largeTextOn ? 'text-lg' : 'text-base',
                boldOn ? 'font-semibold' : '',
                italicOn ? 'italic' : '',
              ].join(' ')}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View className="bg-page rounded-3xl px-6 py-4 flex-row items-center justify-between border border-[#E9ECEF]">
          <View className="flex-row items-center gap-6">
            <Pressable
              onPress={() => setBoldOn((v) => !v)}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-80"
            >
              <Text className={['font-extrabold', boldOn ? 'text-danger' : 'text-text2'].join(' ')}>B</Text>
            </Pressable>
            <Pressable
              onPress={() => setItalicOn((v) => !v)}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-80"
            >
              <Text className={['font-extrabold italic', italicOn ? 'text-danger' : 'text-text2'].join(' ')}>I</Text>
            </Pressable>
            <Pressable
              onPress={() => setLargeTextOn((v) => !v)}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-80"
            >
              <Text className={['font-extrabold', largeTextOn ? 'text-danger' : 'text-text2'].join(' ')}>T</Text>
            </Pressable>
          </View>
          <View className="flex-row items-center gap-6">
            <Pressable
              onPress={() => setStickersOpen(true)}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-80"
            >
              <AppIcon name="happy-outline" size={22} color="#6B6F75" />
            </Pressable>
            <Pressable
              onPress={addFromGallery}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-80"
            >
              <AppIcon name="image-outline" size={22} color="#6B6F75" />
            </Pressable>
            <Pressable
              onPress={takePhoto}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-80"
            >
              <AppIcon name="camera-outline" size={22} color="#6B6F75" />
            </Pressable>
            <Pressable
              onPress={() => setTagOpen(true)}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-80"
            >
              <AppIcon name="pricetag-outline" size={22} color="#6B6F75" />
            </Pressable>
            <Pressable
              onPress={() => {
                Alert.alert('More', 'Choose an action', [
                  { text: 'Insert #Daily', onPress: () => appendToBody('#Daily') },
                  { text: 'Insert #Thoughts', onPress: () => appendToBody('#Thoughts') },
                  { text: 'Clear text', style: 'destructive', onPress: () => setBody('') },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-80"
            >
              <AppIcon name="ellipsis-horizontal" size={22} color="#6B6F75" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <StickerModal open={stickersOpen} onClose={() => setStickersOpen(false)} onPick={onPickSticker} />

      <Modal transparent visible={tagOpen} animationType="fade" onRequestClose={() => setTagOpen(false)}>
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="w-full rounded-3xl bg-page px-5 py-5 border border-[#E9ECEF]">
            <View className="flex-row items-center justify-between">
              <Text className="text-text font-extrabold text-base">Add tag</Text>
              <Pressable onPress={() => setTagOpen(false)} className="h-10 w-10 items-center justify-center">
                <AppIcon name="close" size={22} color="#111217" />
              </Pressable>
            </View>
            <View className="mt-3 rounded-2xl bg-card border border-[#E9ECEF] px-4 py-3">
              <TextInput
                value={tagText}
                onChangeText={setTagText}
                placeholder="e.g. gratitude"
                placeholderTextColor="#8B8F95"
                className="text-text"
                autoCapitalize="none"
              />
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {['daily', 'thoughts', 'work', 'family', 'travel', 'nature'].map((t) => (
                <Pressable
                  key={t}
                  onPress={() => {
                    setTagText(t);
                  }}
                  className="px-3 py-2 rounded-full bg-page border border-[#E9ECEF] active:opacity-80"
                >
                  <Text className="text-text2 text-xs font-semibold">#{t}</Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setTagOpen(false)}
                className="flex-1 rounded-2xl bg-page border border-[#E9ECEF] px-4 py-4 items-center active:opacity-85"
              >
                <Text className="text-text font-extrabold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onAddTag}
                className="flex-[2] rounded-2xl bg-danger px-4 py-4 items-center active:opacity-85"
              >
                <Text className="text-white font-extrabold">Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function StickerModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
}) {
  const emojis = React.useMemo(
    () => [
      '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😍','😘','😗','😙','😚','😋','😜','😝','😛','🤪','🤩','🥳','😎','🤓','🧐','😤','😭','😡','😴','😌','🤗','🤔','🫠','😶‍🌫️',
      '☀️','🌤️','⛅️','🌧️','⛈️','🌈','⭐️','🌙','🔥','💧','🌊','🍀','🌸','🌻','🍁','❄️',
      '❤️','💗','💖','💘','💝','💞','💔','✨','🎉','🎈','🎁','🏆','✅','⚡️','💡','📌',
      '☕️','🍵','🍕','🍔','🍎','🍓','🍰','🍫',
      '📷','🖼️','🎵','🎧','📚','📝','🧠','💪','🧘','🚶','🌍','✈️',
    ],
    []
  );

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-page rounded-t-3xl px-5 pt-4 pb-8 border border-[#E9ECEF]">
          <View className="flex-row items-center justify-between">
            <Text className="text-text font-extrabold text-base">Stickers</Text>
            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center">
              <AppIcon name="close" size={22} color="#111217" />
            </Pressable>
          </View>
          <ScrollView className="mt-4" contentContainerClassName="flex-row flex-wrap gap-3 pb-6">
            {emojis.map((e) => (
              <Pressable
                key={e}
                onPress={() => onPick(e)}
                className="h-12 w-12 rounded-2xl bg-card border border-[#E9ECEF] items-center justify-center active:opacity-80"
              >
                <Text className="text-2xl">{e}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

