import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { initDb } from '../features/journal/db/client';
import { journalRepo } from '../features/journal/repo/journalRepo';
import { Screen } from '../shared/ui/Screen';
import { AppIcon } from '../shared/ui/AppIcon';
import { AppDialog } from '../shared/ui/AppDialog';
import { AppSheet } from '../shared/ui/AppSheet';

type Props = NativeStackScreenProps<RootStackParamList, 'EntryEditor'>;

const MOODS = ['Happy', 'Calm', 'Neutral', 'Sad'] as const;
const MOOD_ICON: Record<string, string> = {
  Happy: 'happy-outline',
  Calm: 'happy-outline',
  Neutral: 'remove-outline',
  Sad: 'rainy-outline',
};

const PROMPTS = [
  'What made me smile today?',
  'One thing I learned...',
  'I am grateful for...',
  'Today I felt...',
];

function fmtDate() {
  const d = new Date();
  const day = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const rest = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${rest} • ${time}`;
}

export function EntryEditorScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const entryId = route.params?.entryId;
  const [savedId, setSavedId] = React.useState<string | null>(entryId ?? null);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [mood, setMood] = React.useState<(typeof MOODS)[number]>('Calm');
  const [tags, setTags] = React.useState<string[]>(['Reflection', 'Grateful']);
  const [stickersOpen, setStickersOpen] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');
  const [tagOpen, setTagOpen] = React.useState(false);

  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(0);

  React.useEffect(() => {
    initDb();
    if (!entryId) return;
    const entry = journalRepo.getEntry(entryId);
    if (!entry) return;
    setTitle(entry.title);
    setBody(entry.body);
    setMood(entry.mood ?? 'Calm');
    const found = `${entry.title} ${entry.body}`.match(/#(\w+)/g);
    if (found) setTags([...new Set(found.map((t) => t.slice(1)))]);
  }, [entryId]);

  React.useEffect(() => {
    if (!isRecording) return;
    const iv = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
    return () => clearInterval(iv);
  }, [isRecording]);

  React.useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  const ensureSaved = React.useCallback((): string | null => {
    if (savedId) return savedId;
    const tt = title.trim();
    const b = body.trim();
    if (!tt && !b) {
      Alert.alert(t('entryEditor.enterTextTitle'), t('entryEditor.enterTextBody'));
      return null;
    }
    const saved = journalRepo.upsertEntry({ title: tt || t('entryEditor.untitled'), body: b, mood });
    setSavedId(saved.id);
    return saved.id;
  }, [savedId, title, body, mood, t]);

  const onSave = React.useCallback(() => {
    const tt = title.trim();
    const b = body.trim();
    if (!tt && !b) {
      Alert.alert(t('entryEditor.emptyEntryTitle'), t('entryEditor.emptyEntryBody'));
      return;
    }
    const tagStr = tags.map((tg) => `#${tg}`).join(' ');
    const finalBody = b + (tagStr ? `\n\n${tagStr}` : '');
    const saved = journalRepo.upsertEntry({ id: savedId ?? entryId, title: tt || t('entryEditor.untitled'), body: finalBody, mood });
    setSavedId(saved.id);
    navigation.replace('EntryDetail', { entryId: saved.id });
  }, [title, body, tags, mood, savedId, entryId, navigation, t]);

  const addFromGallery = React.useCallback(async () => {
    try {
      const id = ensureSaved();
      if (!id) return;
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert(t('entryEditor.permissionTitle'), t('entryEditor.galleryPermissionBody')); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true, aspect: [1, 1] });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      journalRepo.addImageAttachment(id, uri);
      Alert.alert(t('entryEditor.savedTitle'), t('entryEditor.imageAttached'));
    } catch (e: any) { Alert.alert(t('entryEditor.galleryTitle'), e?.message ?? t('entryEditor.failed')); }
  }, [ensureSaved, t]);

  const takePhoto = React.useCallback(async () => {
    try {
      const id = ensureSaved();
      if (!id) return;
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert(t('entryEditor.permissionTitle'), t('entryEditor.cameraPermissionBody')); return; }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: true, aspect: [1, 1] });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      journalRepo.addImageAttachment(id, uri);
      Alert.alert(t('entryEditor.savedTitle'), t('entryEditor.photoAttached'));
    } catch (e: any) { Alert.alert(t('entryEditor.cameraTitle'), e?.message ?? t('entryEditor.failed')); }
  }, [ensureSaved, t]);

  const startRecording = React.useCallback(async () => {
    try {
      const id = ensureSaved();
      if (!id) return;
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert(t('entryEditor.permissionTitle'), t('entryEditor.micPermissionBody')); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (e: any) { Alert.alert(t('entryEditor.audioTitle'), e?.message ?? t('entryEditor.recordingFailed')); }
  }, [ensureSaved, t]);

  const stopRecording = React.useCallback(async () => {
    if (!recording) return;
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) return;
      const id = savedId ?? ensureSaved();
      if (!id) return;
      journalRepo.addAudioAttachment(id, uri);
      Alert.alert(t('entryEditor.savedTitle'), t('entryEditor.audioAttached'));
    } catch (e: any) { Alert.alert(t('entryEditor.audioTitle'), e?.message ?? t('entryEditor.stopFailed')); }
  }, [recording, savedId, ensureSaved, t]);

  const addLocation = React.useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert(t('entryEditor.permissionTitle'), t('entryEditor.locationPermissionBody')); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (place) {
        const parts = [place.name, place.city, place.region].filter(Boolean);
        const label = parts.join(', ') || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
        setBody((prev) => (prev ? `${prev}\n📍 ${label}` : `📍 ${label}`));
      }
    } catch (e: any) { Alert.alert(t('entryEditor.locationTitle'), e?.message ?? t('entryEditor.failed')); }
  }, [t]);

  const onAddTag = React.useCallback(() => {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
    setTagOpen(false);
  }, [tagInput, tags]);

  const removeTag = React.useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  return (
    <View className="flex-1 bg-page">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {/* Top bar */}
        <View className="px-5 pt-12 pb-3 mb-3 border-b border-elevated">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 rounded-full bg-elevated items-center justify-center active:opacity-70">
              <AppIcon name="arrow-back" size={20} color="#A9ADB2" />
            </Pressable>
            <Pressable onPress={onSave} className="rounded-full bg-[#E04E4E] px-5 py-2 active:opacity-85">
              <Text className="text-white text-sm font-extrabold">Save</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* CURRENT VIBE */}
          <View className="flex-row items-center justify-between">
            <Text className="text-muted text-xs font-extrabold tracking-widest">CURRENT VIBE</Text>
            <View className="h-1 w-8 rounded-full bg-[#E04E4E]" />
          </View>

          <View className="flex-row gap-3 mt-4">
            {MOODS.map((m) => {
              const selected = mood === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMood(m)}
                  style={[
                    { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 20 },
                    selected
                      ? { backgroundColor: '#E04E4E' }
                      : { backgroundColor: undefined },
                  ]}
                  className={['active:opacity-85', selected ? '' : 'bg-elevated'].join(' ')}
                >
                  <View
                    style={[
                      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
                      selected
                        ? { borderColor: 'rgba(255,255,255,0.5)' }
                        : { borderColor: '#DADDE2' },
                    ]}
                  >
                    <AppIcon name={MOOD_ICON[m] as any} size={20} color={selected ? '#FFFFFF' : '#A9ADB2'} />
                  </View>
                  <Text
                    style={[
                      { marginTop: 6, fontSize: 11, fontWeight: '700' },
                      selected ? { color: '#FFFFFF' } : { color: '#8B919A' },
                    ]}
                  >
                    {m.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-elevated mt-5 mb-4" />

          {/* Tags */}
          <View className="flex-row flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Pressable key={tag} onLongPress={() => removeTag(tag)} className="active:opacity-70">
                <Text className="text-[#E04E4E] text-sm font-bold">#{tag}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setTagOpen(true)} className="flex-row items-center gap-1 active:opacity-70">
              <AppIcon name="add" size={16} color="#A9ADB2" />
              <Text className="text-muted text-sm font-semibold">Add Tag</Text>
            </Pressable>
          </View>

          {/* Title */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Untitled Reflection"
            placeholderTextColor="#8B919A"
            className="text-text text-2xl font-extrabold mt-5"
            style={{ lineHeight: 32 }}
          />

          {/* Date */}
          <Text className="text-muted text-xs font-bold tracking-wide mt-2">{fmtDate()}</Text>

          {/* Recording indicator */}
          {isRecording ? (
            <View className="flex-row items-center gap-3 rounded-2xl bg-elevated border border-elevated px-4 py-3 mt-4">
              <View className="h-3 w-3 rounded-full bg-[#E04E4E]" />
              <Text className="text-[#E04E4E] font-bold text-sm">
                Recording {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
              </Text>
              <Pressable onPress={stopRecording} className="ml-auto rounded-full bg-[#E04E4E] px-4 py-1.5 active:opacity-80">
                <Text className="text-white text-xs font-bold">Stop</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Body */}
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="What's on your mind? Take a moment to reflect..."
            placeholderTextColor="#8B919A"
            multiline
            textAlignVertical="top"
            className="text-text text-base mt-4"
            style={{ minHeight: 200, lineHeight: 26 }}
          />

          {/* Prompts */}
          <View className="mt-8">
            <View className="flex-row items-center gap-2">
              <Text className="text-base">✨</Text>
              <Text className="text-muted text-xs font-extrabold tracking-widest">NEED A PROMPT?</Text>
            </View>
            <View className="flex-row flex-wrap gap-2 mt-3">
              {PROMPTS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setBody((prev) => (prev ? `${prev}\n\n${p}` : p))}
                  className="rounded-full border border-elevated bg-card px-4 py-2.5 active:opacity-70"
                >
                  <Text className="text-text text-xs font-semibold">{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Bottom toolbar */}
        <View
          className="px-5 pb-6 pt-3 bg-page border-t border-elevated"
        >
          <View className="flex-row items-center">
            <View className="flex-row items-center gap-5">
              <Pressable onPress={addFromGallery} hitSlop={8} className="active:opacity-70">
                <AppIcon name="image-outline" size={22} color="#A9ADB2" />
              </Pressable>
              <Pressable onPress={takePhoto} hitSlop={8} className="active:opacity-70">
                <AppIcon name="camera-outline" size={22} color="#A9ADB2" />
              </Pressable>
              <Pressable onPress={isRecording ? stopRecording : startRecording} hitSlop={8} className="active:opacity-70">
                <AppIcon name={isRecording ? 'stop-circle' : 'mic-outline'} size={22} color={isRecording ? '#E04E4E' : '#A9ADB2'} />
              </Pressable>
              <Pressable onPress={addLocation} hitSlop={8} className="active:opacity-70">
                <AppIcon name="location-outline" size={22} color="#A9ADB2" />
              </Pressable>
              <Pressable onPress={() => setStickersOpen(true)} hitSlop={8} className="active:opacity-70">
                <AppIcon name="happy-outline" size={22} color="#A9ADB2" />
              </Pressable>
            </View>

            <View className="ml-auto flex-row items-center gap-3">
              <View className="items-end">
                <Text className="text-muted text-[10px] font-semibold">Draft saved</Text>
                <Text className="text-muted text-[10px] font-bold">{wordCount} words</Text>
              </View>
              <Pressable
                onPress={onSave}
                className="rounded-2xl bg-card border border-elevated px-5 py-2.5 active:opacity-85"
              >
                <Text className="text-text text-sm font-extrabold">Draft</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <StickerModal open={stickersOpen} onClose={() => setStickersOpen(false)} onPick={(e) => { setBody((p) => (p ? `${p} ${e}` : e)); setStickersOpen(false); }} />

      <AppDialog
        visible={tagOpen}
        onClose={() => setTagOpen(false)}
        title="Add Tag"
        iconName="pricetag-outline"
        footer={(
          <Pressable onPress={onAddTag} className="rounded-2xl bg-danger py-3 items-center active:opacity-85">
            <Text className="text-white font-extrabold">Add</Text>
          </Pressable>
        )}
      >
        <View className="rounded-2xl bg-elevated px-4 py-3">
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="e.g. gratitude"
            placeholderTextColor="#8B919A"
            className="text-text"
            autoCapitalize="none"
            onSubmitEditing={onAddTag}
          />
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {['daily', 'thoughts', 'work', 'family', 'travel', 'nature', 'grateful'].map((t) => (
            <Pressable key={t} onPress={() => { if (!tags.includes(t)) setTags((p) => [...p, t]); setTagOpen(false); }} className="px-3 py-2 rounded-full bg-elevated active:opacity-70">
              <Text className="text-text2 text-xs font-semibold">#{t}</Text>
            </Pressable>
          ))}
        </View>
      </AppDialog>
    </View>
  );
}

function StickerModal({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (emoji: string) => void }) {
  const emojis = React.useMemo(() => [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😍','😘','😗','😙','😚','😋','😜','😝','😛','🤪','🤩','🥳','😎','🤓','🧐','😤','😭','😡','😴','😌','🤗','🤔','🫠','😶‍🌫️',
    '☀️','🌤️','⛅️','🌧️','⛈️','🌈','⭐️','🌙','🔥','💧','🌊','🍀','🌸','🌻','🍁','❄️',
    '❤️','💗','💖','💘','💝','💞','💔','✨','🎉','🎈','🎁','🏆','✅','⚡️','💡','📌',
    '☕️','🍵','🍕','🍔','🍎','🍓','🍰','🍫',
    '📷','🖼️','🎵','🎧','📚','📝','🧠','💪','🧘','🚶','🌍','✈️',
  ], []);

  return (
    <AppSheet visible={open} onClose={onClose} title="Stickers" eyebrow="Editor">
      <View className="flex-row flex-wrap gap-3 pb-6">
        {emojis.map((e) => (
          <Pressable key={e} onPress={() => onPick(e)} className="h-12 w-12 rounded-2xl bg-elevated items-center justify-center active:opacity-70">
            <Text className="text-2xl">{e}</Text>
          </Pressable>
        ))}
      </View>
    </AppSheet>
  );
}
