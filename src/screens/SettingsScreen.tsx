import * as React from 'react';
import { Alert, Image, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18n from '../shared/i18n/i18n';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { Screen } from '../shared/ui/Screen';
import { Card } from '../shared/ui/Card';
import { useSettingsStore } from '../store/useSettingsStore';
import { initDb } from '../features/journal/db/client';
import { db } from '../features/journal/db/client';
import { AppIcon } from '../shared/ui/AppIcon';
import { exportJournalPdf } from '../features/journal/export/exportPdf';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const lockEnabled = useSettingsStore((s) => s.lockEnabled);
  const setLockEnabled = useSettingsStore((s) => s.setLockEnabled);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const profileImageUri = useSettingsStore((s) => s.profileImageUri);
  const setProfileImageUri = useSettingsStore((s) => s.setProfileImageUri);
  const userName = useSettingsStore((s) => s.userName);
  const userEmail = useSettingsStore((s) => s.userEmail);
  const setUserProfile = useSettingsStore((s) => s.setUserProfile);
  const lastSyncAt = useSettingsStore((s) => s.lastSyncAt);
  const syncBusy = useSettingsStore((s) => s.syncBusy);
  const backupNow = useSettingsStore((s) => s.backupNow);
  const [passcodeLock, setPasscodeLock] = React.useState(false);
  const [editVisible, setEditVisible] = React.useState(false);
  const [editName, setEditName] = React.useState(userName);
  const [editEmail, setEditEmail] = React.useState(userEmail);

  React.useEffect(() => {
    // Ensure UI updates immediately when user changes language.
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  const onToggle = React.useCallback(
    async (v: boolean) => {
      if (!v) {
        await setLockEnabled(false);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        // If device doesn't support biometrics, don't enable.
        await setLockEnabled(false);
        return;
      }

      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: t('settings.biometricPrompt'),
      });
      if (res.success) {
        await setLockEnabled(true);
      }
    },
    [setLockEnabled, t]
  );

  const onPickProfileImage = React.useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert(t('settings.permissionTitle'), t('settings.photoPermissionBody'));
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return;

    // Persist inside app storage.
    const ext = uri.split('.').pop() || 'jpg';
    const dest = `${FileSystem.documentDirectory}profile_${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    await setProfileImageUri(dest);
  }, [setProfileImageUri]);

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 pb-24"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="items-center">
          <Text className="text-text font-extrabold text-base">{t('settings.title')}</Text>
          <View className="h-[1px] bg-elevated w-full mt-4" />
        </View>

        <View className="flex-row items-center gap-4 pt-2">
          <View className="relative">
            <Pressable
              onPress={onPickProfileImage}
              className="h-20 w-20 rounded-full bg-[#F7ECE7] items-center justify-center overflow-hidden active:opacity-90"
            >
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={{ width: 80, height: 80 }} />
              ) : (
                <AppIcon name="person" size={34} color="#111217" />
              )}
            </Pressable>
            <View
              pointerEvents="none"
              className="absolute -right-1 -bottom-1 h-8 w-8 rounded-full bg-danger items-center justify-center border-4 border-page"
            >
              <AppIcon name="shield-checkmark" size={16} color="#FFFFFF" />
            </View>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-text text-2xl font-extrabold">{userName}</Text>
              <View className="px-2 py-1 rounded-full bg-[#F3E9E6]">
                <Text className="text-muted text-[10px] font-extrabold">PRO</Text>
              </View>
            </View>
            <Text className="text-text2 text-base mt-1">{userEmail}</Text>

            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center gap-2">
                <AppIcon name="calendar-outline" size={16} color="#E04E4E" />
                <Text className="text-text font-semibold">{t('settings.streakDays', { count: 124 })}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setEditName(userName);
                  setEditEmail(userEmail);
                  setEditVisible(true);
                }}
                className="h-8 w-8 rounded-full bg-[#F3F4F6] items-center justify-center active:opacity-70"
              >
                <AppIcon name="create-outline" size={16} color="#6B6F75" />
              </Pressable>
            </View>
          </View>
        </View>

        <Modal visible={editVisible} transparent animationType="fade">
          <Pressable
            onPress={() => setEditVisible(false)}
            className="flex-1 bg-black/40 justify-center px-6"
          >
            <Pressable onPress={() => {}} className="bg-card rounded-3xl p-6">
              <Text className="text-text text-lg font-extrabold mb-4">{t('settings.editProfileTitle')}</Text>

              <Text className="text-muted text-xs font-semibold mb-1">{t('settings.nameLabel')}</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                className="border border-[#E9ECEF] rounded-2xl px-4 py-3 text-text text-base mb-3"
                placeholder={t('settings.namePlaceholder')}
                placeholderTextColor="#A9ADB2"
              />

              <Text className="text-muted text-xs font-semibold mb-1">{t('settings.emailLabel')}</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                className="border border-[#E9ECEF] rounded-2xl px-4 py-3 text-text text-base mb-4"
                placeholder={t('settings.emailPlaceholder')}
                placeholderTextColor="#A9ADB2"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setEditVisible(false)}
                  className="flex-1 rounded-2xl bg-[#F3F4F6] py-3 items-center active:opacity-85"
                >
                  <Text className="text-text font-bold">{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    const name = editName.trim() || userName;
                    const email = editEmail.trim() || userEmail;
                    await setUserProfile(name, email);
                    setEditVisible(false);
                  }}
                  className="flex-1 rounded-2xl bg-[#E04E4E] py-3 items-center active:opacity-85"
                >
                  <Text className="text-white font-bold">{t('common.save')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Card>
          <RowNav
            iconName="language-outline"
            title={t('settings.language')}
            subtitle={t(`languages.${language}`)}
            onPress={() => navigation.navigate('LanguageSelect')}
          />
        </Card>

        <Text className="text-muted text-xs font-semibold px-1">{t('settings.accountSecurity')}</Text>
        <Card>
          <RowToggle
            iconName="lock-closed-outline"
            title={t('settings.passcodeLock')}
            subtitle={t('settings.passcodeLockSub')}
            value={passcodeLock}
            onValueChange={setPasscodeLock}
          />
          <Divider />
          <RowToggle
            iconName="finger-print-outline"
            title={t('settings.biometric')}
            subtitle={t('settings.biometricSub')}
            value={lockEnabled}
            onValueChange={onToggle}
          />
          <Divider />
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 pr-3">
              <View className="h-10 w-10 rounded-full bg-[#FDEAEA] items-center justify-center">
                <AppIcon name="sync-outline" size={20} color="#E04E4E" />
              </View>
              <View>
                <Text className="text-text font-extrabold">{t('settings.syncStatusTitle')}</Text>
                <Text className="text-muted text-xs mt-0.5">
                  {syncBusy
                    ? t('settings.syncing')
                    : lastSyncAt
                      ? t('settings.syncStatusSubtitle', { minutes: Math.max(1, Math.floor((Date.now() - lastSyncAt) / 60000)) })
                      : t('settings.notSyncedYet')}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={async () => {
                const ok = await backupNow();
                if (!ok) {
                  Alert.alert(t('settings.backupNow'), t('settings.backupFailed'));
                }
              }}
              disabled={syncBusy}
              className="rounded-full bg-[#E04E4E] px-4 py-2 active:opacity-85"
              style={syncBusy ? { opacity: 0.6 } : undefined}
            >
              <Text className="text-white text-xs font-bold">{t('settings.backupNow')}</Text>
            </Pressable>
          </View>
        </Card>

        <Text className="text-muted text-xs font-semibold px-1">{t('settings.journalPrefs')}</Text>
        <Card>
          <RowNav
            iconName="notifications-outline"
            title={t('settings.dailyReminders')}
            subtitle={(() => {
              const r = useSettingsStore.getState().dailyReminders.filter((x) => x.enabled);
              if (r.length === 0) return t('settings.dailyRemindersSub');
              return r.map((x) => `${String(x.hour).padStart(2, '0')}:${String(x.minute).padStart(2, '0')}`).join(', ');
            })()}
            onPress={() => navigation.navigate('DailyReminders')}
          />
          <Divider />
          <ThemeRow />
          <Divider />
          <RowNav
            iconName="download-outline"
            title={t('settings.dataExport')}
            subtitle={t('settings.dataExportSub')}
            onPress={async () => {
              try {
                await exportJournalPdf({ title: t('settings.dataExport') });
              } catch (e: any) {
                Alert.alert(t('settings.dataExport'), e?.message ?? t('settings.exportFailed'));
              }
            }}
          />
        </Card>

        <Text className="text-muted text-xs font-semibold px-1">{t('settings.support')}</Text>
        <Card>
          <RowNav
            iconName="help-circle-outline"
            title={t('settings.helpCenter')}
            subtitle={t('settings.helpCenterSub')}
            onPress={async () => {
              const url = 'https://t.me/otaxonov_o17';
              const can = await Linking.canOpenURL(url);
              if (can) await Linking.openURL(url);
            }}
          />
          <Divider />
          <RowNav
            iconName="chatbubble-ellipses-outline"
            title={t('settings.feedback')}
            subtitle={t('settings.feedbackSub')}
            onPress={async () => {
              const url = 'https://t.me/otaxonov_o17';
              const can = await Linking.canOpenURL(url);
              if (can) await Linking.openURL(url);
            }}
          />
        </Card>

        <Card className="bg-[#FFF2F2]">
          <View className="flex-row items-center gap-2">
            <AppIcon name="warning-outline" size={18} color="#E04E4E" />
            <Text className="text-danger font-extrabold">{t('settings.dangerZone')}</Text>
          </View>
          <Text className="text-text2 text-xs mt-2 leading-5">
            {t('settings.deleteAllWarning')}
          </Text>
          <Pressable
            onPress={() => {
              Alert.alert(t('settings.deleteAllConfirmTitle'), t('settings.deleteAllConfirmBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: () => {
                    initDb();
                    db.execSync('DELETE FROM attachments;');
                    db.execSync('DELETE FROM entries;');
                  },
                },
              ]);
            }}
            className="mt-4 rounded-2xl bg-danger px-4 py-3 items-center active:opacity-85"
          >
            <Text className="text-card font-extrabold">{t('settings.deleteAll')}</Text>
          </Pressable>
        </Card>

        <Pressable
          onPress={() => {
            Alert.alert(
              t('settings.signOutTitle'),
              t('settings.signOutBody'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('settings.signOutCta'),
                  style: 'destructive',
                  onPress: async () => {
                    await useSettingsStore.getState().signOut();
                    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
                  },
                },
              ],
            );
          }}
          className="mt-2 rounded-2xl border border-[#E9ECEF] bg-card py-4 flex-row items-center justify-center gap-2 active:opacity-85"
        >
          <AppIcon name="log-out-outline" size={20} color="#E04E4E" />
          <Text className="text-[#E04E4E] font-extrabold text-base">{t('settings.signOutCta')}</Text>
        </Pressable>

        <Text className="text-muted text-center text-xs mt-4">{'SERENE JOURNAL\nVersion 1.0.0'}</Text>
      </ScrollView>
    </Screen>
  );
}

function Divider() {
  return <View className="h-[1px] bg-elevated my-4" />;
}

function RowToggle({
  iconName,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  iconName: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void | Promise<void>;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3 flex-1 pr-4">
        <View className="h-10 w-10 rounded-2xl bg-[#F3F4F6] items-center justify-center">
          <AppIcon name={iconName} size={20} color="#E04E4E" />
        </View>
        <View className="flex-1">
          <Text className="text-text font-extrabold">{title}</Text>
          <Text className="text-muted text-xs mt-1">{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange as any}
        trackColor={{ false: '#E6E2E0', true: '#E04E4E' }}
        ios_backgroundColor="#E6E2E0"
        thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      />
    </View>
  );
}

function ThemeRow() {
  const { t } = useTranslation();
  const [active, setActive] = React.useState<'light' | 'dark'>('light');
  const isLight = active === 'light';

  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 rounded-2xl bg-[#F3F4F6] items-center justify-center">
          <AppIcon name="settings-outline" size={20} color="#6B6F75" />
        </View>
        <Text className="text-text font-extrabold">{t('settings.appTheme')}</Text>
      </View>

      <View className="flex-row rounded-full bg-[#F3F4F6] p-1">
        <Pressable
          onPress={() => setActive('light')}
          style={[
            { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
            isLight && { backgroundColor: '#FFFFFF', elevation: 1 },
          ]}
        >
          <AppIcon name="sunny-outline" size={14} color={isLight ? '#E04E4E' : '#A9ADB2'} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: isLight ? '#111217' : '#A9ADB2' }}>{t('settings.themeLight')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setActive('dark')}
          style={[
            { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
            !isLight && { backgroundColor: '#FFFFFF', elevation: 1 },
          ]}
        >
          <AppIcon name="moon-outline" size={14} color={!isLight ? '#E04E4E' : '#A9ADB2'} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: !isLight ? '#111217' : '#A9ADB2' }}>{t('settings.themeDark')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RowNav({
  iconName,
  title,
  subtitle,
  onPress,
}: {
  iconName: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-85">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1 pr-4">
          <View className="h-10 w-10 rounded-2xl bg-[#F3F4F6] items-center justify-center">
            <AppIcon name={iconName} size={20} color="#6B6F75" />
          </View>
          <View className="flex-1">
            <Text className="text-text font-extrabold">{title}</Text>
            <Text className="text-muted text-xs mt-1">{subtitle}</Text>
          </View>
        </View>
        <AppIcon name="chevron-forward" size={18} color="#A9ADB2" />
      </View>
    </Pressable>
  );
}

