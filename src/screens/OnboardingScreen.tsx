import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { AppIcon } from '../shared/ui/AppIcon';
import i18n from '../shared/i18n/i18n';
import { useSettingsStore } from '../store/useSettingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const FEATURES: { icon: string; color: string; title: string; desc: string }[] = [
  {
    icon: 'shield-checkmark-outline',
    color: '#E04E4E',
    title: 'Private & Secure',
    desc: 'Your thoughts are protected with end-to-end encryption and biometric lock.',
  },
  {
    icon: 'sparkles-outline',
    color: '#E04E4E',
    title: 'Daily Prompts',
    desc: 'Get inspired every day with mindful questions that help you reflect deeper.',
  },
  {
    icon: 'search-outline',
    color: '#E04E4E',
    title: 'Easy Search',
    desc: 'Quickly find past memories using tags, moods, and semantic keywords.',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const features: { icon: string; color: string; title: string; desc: string }[] = [
    {
      icon: 'shield-checkmark-outline',
      color: '#E04E4E',
      title: t('onboarding.features.privateSecure.title'),
      desc: t('onboarding.features.privateSecure.desc'),
    },
    {
      icon: 'sparkles-outline',
      color: '#E04E4E',
      title: t('onboarding.features.dailyPrompts.title'),
      desc: t('onboarding.features.dailyPrompts.desc'),
    },
    {
      icon: 'search-outline',
      color: '#E04E4E',
      title: t('onboarding.features.easySearch.title'),
      desc: t('onboarding.features.easySearch.desc'),
    },
  ];
  return (
    <View className="flex-1 bg-page">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language */}
        <View className="w-full flex-row justify-end mb-2">
          <View className="flex-row items-center rounded-full bg-[#F3F4F6] p-1">
            {(['uz', 'ru', 'en'] as const).map((lng) => {
              const active = language === lng;
              return (
                <Pressable
                  key={lng}
                  onPress={async () => {
                    await setLanguage(lng);
                    if (i18n.language !== lng) {
                      await i18n.changeLanguage(lng);
                    }
                  }}
                  style={[
                    {
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      minWidth: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    active && { backgroundColor: '#FFFFFF', elevation: 1 },
                  ]}
                  className="active:opacity-80"
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#111217' : '#A9ADB2' }}>
                    {lng.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Logo */}
        <View className="items-center">
          <View
            className="h-16 w-16 rounded-full bg-[#E04E4E] items-center justify-center"
            style={{ shadowColor: '#E04E4E', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
          >
            <AppIcon name="flash" size={28} color="#FFFFFF" />
          </View>
        </View>

        {/* Heading */}
        <Text className="text-center mt-6 text-3xl font-extrabold" style={{ color: '#1A1C20', lineHeight: 38 }}>
          {t('onboarding.titleLine1')}{'\n'}
          <Text style={{ color: '#E04E4E' }}>{t('onboarding.titleLine2')}</Text>
        </Text>

        <Text className="text-center mt-3 text-base" style={{ color: '#8B8F95', lineHeight: 24 }}>
          {t('onboarding.subtitle')}
        </Text>

        {/* Hero image */}
        <View className="mt-7 items-center">
          <View
            className="w-full rounded-3xl overflow-hidden"
            style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 }}
          >
            <Image
              source={require('../../assets/onboarding-hero.png')}
              style={{ width: '100%', height: 200, borderRadius: 24 }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Features */}
        <View className="mt-8 gap-5">
          {features.map((f) => (
            <View key={f.title} className="flex-row gap-4">
              <View
                className="h-11 w-11 rounded-full items-center justify-center"
                style={{ backgroundColor: f.color + '12' }}
              >
                <AppIcon name={f.icon as any} size={20} color={f.color} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold" style={{ color: '#1A1C20' }}>{f.title}</Text>
                <Text className="mt-1 text-sm" style={{ color: '#8B8F95', lineHeight: 20 }}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Accent line */}
        <View className="items-center mt-8">
          <View className="h-1 w-8 rounded-full bg-[#E04E4E]" />
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* CTA */}
        <View className="mt-8">
          <Pressable
            onPress={() => navigation.navigate('SignIn', { mode: 'signup' })}
            className="rounded-2xl bg-[#E04E4E] py-4 flex-row items-center justify-center gap-2 active:opacity-85"
            style={{ shadowColor: '#E04E4E', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}
          >
            <Text className="text-white text-base font-extrabold">{t('onboarding.getStarted')}</Text>
            <AppIcon name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>

          <Pressable onPress={() => navigation.navigate('SignIn', { mode: 'signin' })}>
            <Text className="text-center mt-4 text-sm" style={{ color: '#8B8F95' }}>
              {t('onboarding.alreadyHaveAccount')}{' '}
              <Text style={{ color: '#E04E4E', fontWeight: '700' }}>{t('onboarding.signIn')}</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
