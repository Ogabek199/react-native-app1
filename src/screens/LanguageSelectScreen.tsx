import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import i18n from '../shared/i18n/i18n';
import { Screen } from '../shared/ui/Screen';
import { Card } from '../shared/ui/Card';
import { AppIcon } from '../shared/ui/AppIcon';
import { useSettingsStore } from '../store/useSettingsStore';

const items = [
  { code: 'en' as const, labelKey: 'languages.en' },
  { code: 'ru' as const, labelKey: 'languages.ru' },
  { code: 'uz' as const, labelKey: 'languages.uz' },
];

export function LanguageSelectScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <Screen>
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center">
            <AppIcon name="chevron-back" size={22} color="#111217" />
          </Pressable>
          <Text className="text-text font-extrabold text-base">{t('settings.language')}</Text>
          <View className="h-10 w-10" />
        </View>

        <Card>
          <View className="gap-2">
            {items.map((it) => {
              const selected = language === it.code;
              return (
                <Pressable
                  key={it.code}
                  onPress={async () => {
                    await setLanguage(it.code);
                    await i18n.changeLanguage(it.code);
                    navigation.goBack();
                  }}
                  className={[
                    'flex-row items-center justify-between rounded-2xl px-4 py-4 border',
                    selected ? 'bg-[#FCE7E7] border-[#F3D6D6]' : 'bg-page border-[#E9ECEF]',
                    'active:opacity-85',
                  ].join(' ')}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={[
                        'h-10 w-10 rounded-2xl items-center justify-center',
                        selected ? 'bg-danger' : 'bg-elevated',
                      ].join(' ')}
                    >
                      <Text className={['font-extrabold', selected ? 'text-white' : 'text-text'].join(' ')}>
                        {it.code.toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-text font-extrabold">{t(it.labelKey)}</Text>
                      <Text className="text-muted text-xs mt-1">{it.code}</Text>
                    </View>
                  </View>

                  {selected ? <AppIcon name="checkmark" size={22} color="#E04E4E" /> : null}
                </Pressable>
              );
            })}
          </View>
        </Card>
      </View>
    </Screen>
  );
}

