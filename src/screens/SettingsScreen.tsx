import * as React from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
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
import { journalRepo } from '../features/journal/repo/journalRepo';
import type { JournalEntry } from '../features/journal/repo/types';
import { getCurrentStreak } from '../shared/lib/streak';
import { AppIcon } from '../shared/ui/AppIcon';
import { exportJournalPdf } from '../features/journal/export/exportPdf';
import { AppDialog } from '../shared/ui/AppDialog';
import { ConfirmDialog } from '../shared/ui/ConfirmDialog';
import { TextField } from '../shared/ui/TextField';

type BackupDialogState = {
  title: string;
  description: string;
  tone: 'default' | 'danger';
  iconName: React.ComponentProps<typeof AppIcon>['name'];
};

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
  const isLoggedIn = useSettingsStore((s) => s.isLoggedIn);
  const lastSyncAt = useSettingsStore((s) => s.lastSyncAt);
  const syncBusy = useSettingsStore((s) => s.syncBusy);
  const backupNow = useSettingsStore((s) => s.backupNow);
  const refreshSyncStatus = useSettingsStore((s) => s.refreshSyncStatus);
  const [passcodeLock, setPasscodeLock] = React.useState(false);
  const [editVisible, setEditVisible] = React.useState(false);
  const [editName, setEditName] = React.useState(userName);
  const [editEmail, setEditEmail] = React.useState(userEmail);
  const [deleteAllVisible, setDeleteAllVisible] = React.useState(false);
  const [signOutVisible, setSignOutVisible] = React.useState(false);
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [backupDialog, setBackupDialog] = React.useState<BackupDialogState | null>(null);

  const loadEntries = React.useCallback(() => {
    initDb();
    setEntries(journalRepo.listEntries());
  }, []);

  React.useEffect(() => {
    // Ensure UI updates immediately when user changes language.
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  React.useEffect(() => {
    const unsub = navigation.addListener?.('focus', loadEntries);
    if (typeof unsub === 'function') return unsub;
    loadEntries();
    return undefined;
  }, [navigation, loadEntries]);

  React.useEffect(() => {
    const unsub = navigation.addListener?.('focus', refreshSyncStatus);
    if (typeof unsub === 'function') return unsub;
    void refreshSyncStatus();
    return undefined;
  }, [navigation, refreshSyncStatus]);

  const currentStreak = React.useMemo(() => getCurrentStreak(entries), [entries]);

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
              className="h-20 w-20 rounded-full bg-elevated items-center justify-center overflow-hidden active:opacity-90"
            >
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={{ width: 80, height: 80 }} />
              ) : (
                <AppIcon name="person" size={34} color="#A9ADB2" />
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
              <View className="px-2 py-1 rounded-full bg-elevated">
                <Text className="text-muted text-[10px] font-extrabold">PRO</Text>
              </View>
            </View>
            <Text className="text-text2 text-base mt-1">{userEmail}</Text>

            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center gap-2">
                <AppIcon name="calendar-outline" size={16} color="#E04E4E" />
                <Text className="text-text font-semibold">{t('settings.streakDays', { count: currentStreak })}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setEditName(userName);
                  setEditEmail(userEmail);
                  setEditVisible(true);
                }}
                className="h-8 w-8 rounded-full bg-elevated items-center justify-center active:opacity-70"
              >
                <AppIcon name="create-outline" size={16} color="#A9ADB2" />
              </Pressable>
            </View>
          </View>
        </View>

        <AppDialog
          visible={editVisible}
          onClose={() => setEditVisible(false)}
          title={t('settings.editProfileTitle')}
          iconName="create-outline"
          footer={(
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setEditVisible(false)}
                className="flex-1 rounded-2xl bg-elevated py-3 items-center active:opacity-85"
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
                className="flex-1 rounded-2xl bg-danger py-3 items-center active:opacity-85"
              >
                <Text className="text-white font-bold">{t('common.save')}</Text>
              </Pressable>
            </View>
          )}
        >
          <View className="gap-3">
            <TextField
              label={t('settings.nameLabel')}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('settings.namePlaceholder')}
            />
            <TextField
              label={t('settings.emailLabel')}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder={t('settings.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </AppDialog>

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
                    : !isLoggedIn
                      ? t('settings.syncSignInRequired')
                    : lastSyncAt
                      ? t('settings.syncStatusSubtitle', { minutes: Math.max(1, Math.floor((Date.now() - lastSyncAt) / 60000)) })
                      : t('settings.notSyncedYet')}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={async () => {
                const ok = await backupNow();
                if (ok) {
                  setBackupDialog({
                    title: t('settings.backupSuccessTitle'),
                    description: t('settings.backupSuccessBody'),
                    tone: 'default',
                    iconName: 'cloud-done-outline',
                  });
                  return;
                }
                setBackupDialog({
                  title: t('settings.backupNow'),
                  description: isLoggedIn ? t('settings.backupFailed') : t('settings.syncSignInRequired'),
                  tone: 'danger',
                  iconName: 'cloud-offline-outline',
                });
              }}
              disabled={syncBusy || !isLoggedIn}
              className="rounded-full bg-[#E04E4E] px-4 py-2 active:opacity-85"
              style={syncBusy || !isLoggedIn ? { opacity: 0.6 } : undefined}
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
            onPress={() => setDeleteAllVisible(true)}
            className="mt-4 rounded-2xl bg-danger px-4 py-3 items-center active:opacity-85"
          >
            <Text className="text-card font-extrabold">{t('settings.deleteAll')}</Text>
          </Pressable>
        </Card>

        <Pressable
          onPress={() => setSignOutVisible(true)}
          className="mt-2 rounded-2xl border border-elevated bg-card py-4 flex-row items-center justify-center gap-2 active:opacity-85"
        >
          <AppIcon name="log-out-outline" size={20} color="#E04E4E" />
          <Text className="text-[#E04E4E] font-extrabold text-base">{t('settings.signOutCta')}</Text>
        </Pressable>

        <Text className="text-muted text-center text-xs mt-4">{'SERENE JOURNAL\nVersion 1.0.0'}</Text>
      </ScrollView>

      <ConfirmDialog
        visible={deleteAllVisible}
        onClose={() => setDeleteAllVisible(false)}
        title={t('settings.deleteAllConfirmTitle')}
        description={t('settings.deleteAllWarning')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        onConfirm={async () => {
          initDb();
          db.execSync('DELETE FROM attachments;');
          db.execSync('DELETE FROM entries;');
          setEntries([]);
        }}
      />

      <ConfirmDialog
        visible={signOutVisible}
        onClose={() => setSignOutVisible(false)}
        title={t('settings.signOutTitle')}
        description={t('settings.signOutBody')}
        confirmLabel={t('settings.signOutCta')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        iconName="log-out-outline"
        onConfirm={async () => {
          await useSettingsStore.getState().signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        }}
      />

      <AppDialog
        visible={Boolean(backupDialog)}
        onClose={() => setBackupDialog(null)}
        title={backupDialog?.title}
        description={backupDialog?.description}
        tone={backupDialog?.tone}
        iconName={backupDialog?.iconName}
        footer={(
          <Pressable
            onPress={() => setBackupDialog(null)}
            className={[
              'rounded-2xl py-3 items-center active:opacity-85',
              backupDialog?.tone === 'danger' ? 'bg-danger' : 'bg-accent',
            ].join(' ')}
          >
            <Text className={backupDialog?.tone === 'danger' ? 'text-white font-bold' : 'text-text font-bold'}>
              {t('common.ok')}
            </Text>
          </Pressable>
        )}
      />
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
        <View className="h-10 w-10 rounded-2xl bg-elevated items-center justify-center">
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
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [selectVisible, setSelectVisible] = React.useState(false);
  const options = React.useMemo(
    () => [
      { value: 'system' as const, label: t('settings.themeSystem'), iconName: 'phone-portrait-outline' as const },
      { value: 'light' as const, label: t('settings.themeLight'), iconName: 'sunny-outline' as const },
      { value: 'dark' as const, label: t('settings.themeDark'), iconName: 'moon-outline' as const },
    ],
    [t]
  );
  const selectedOption = options.find((option) => option.value === theme) ?? options[0];

  return (
    <>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-3 flex-1 pr-2">
          <View className="h-10 w-10 rounded-2xl bg-elevated items-center justify-center">
            <AppIcon name="settings-outline" size={20} color="#6B6F75" />
          </View>
          <View className="flex-1">
            <Text className="text-text font-extrabold">{t('settings.appTheme')}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setSelectVisible(true)}
          className="min-w-[132px] flex-row items-center justify-between gap-2 rounded-2xl border border-elevated bg-elevated px-3 py-2 active:opacity-85"
        >
          <View className="flex-row items-center gap-2 flex-1">
            <AppIcon name={selectedOption.iconName} size={15} color="#E04E4E" />
            <Text numberOfLines={1} className="text-text text-xs font-bold">
              {selectedOption.label}
            </Text>
          </View>
          <AppIcon name="chevron-down" size={16} color="#8B919A" />
        </Pressable>
      </View>

      <AppDialog
        visible={selectVisible}
        onClose={() => setSelectVisible(false)}
        title={t('settings.appTheme')}
        iconName="color-palette-outline"
      >
        <View className="gap-2">
          {options.map((option) => {
            const selected = option.value === theme;
            return (
              <Pressable
                key={option.value}
                onPress={async () => {
                  await setTheme(option.value);
                  setSelectVisible(false);
                }}
                className={[
                  'flex-row items-center justify-between rounded-2xl border px-4 py-4 active:opacity-85',
                  selected ? 'border-danger bg-elevated' : 'border-elevated bg-card',
                ].join(' ')}
              >
                <View className="flex-row items-center gap-3 flex-1 pr-3">
                  <View
                    className={[
                      'h-10 w-10 rounded-2xl items-center justify-center',
                      selected ? 'bg-danger' : 'bg-elevated',
                    ].join(' ')}
                  >
                    <AppIcon name={option.iconName} size={18} color={selected ? '#FFFFFF' : '#A9ADB2'} />
                  </View>
                  <Text className="text-text font-extrabold">{option.label}</Text>
                </View>

                {selected ? <AppIcon name="checkmark" size={20} color="#E04E4E" /> : null}
              </Pressable>
            );
          })}
        </View>
      </AppDialog>
    </>
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
          <View className="h-10 w-10 rounded-2xl bg-elevated items-center justify-center">
            <AppIcon name={iconName} size={20} color="#A9ADB2" />
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
