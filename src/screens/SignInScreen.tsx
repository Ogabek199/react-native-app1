import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { AppIcon } from '../shared/ui/AppIcon';
import { useSettingsStore } from '../store/useSettingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export function SignInScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const mode = (route.params as any)?.mode === 'signup' ? 'signup' : 'signin';
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const signUp = useSettingsStore((s) => s.signUp);
  const signIn = useSettingsStore((s) => s.signIn);

  const handleSubmit = React.useCallback(async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert(t('auth.errorTitle'), t('auth.fillAllFields'));
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      Alert.alert(t('auth.errorTitle'), t('auth.enterYourName'));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(name.trim(), trimmedEmail, trimmedPassword);
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        const ok = await signIn(trimmedEmail, trimmedPassword);
        if (ok) {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } else {
          Alert.alert(t('auth.errorTitle'), t('auth.invalidEmailOrPassword'));
        }
      }
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim().length > 0
          ? e.message
          : t('common.pleaseWait');
      Alert.alert(t('auth.errorTitle'), msg);
    } finally {
      setLoading(false);
    }
  }, [email, password, name, mode, signUp, signIn, navigation, t]);

  const isSignUp = mode === 'signup';

  return (
    <View className="flex-1 bg-page">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-10 w-10 rounded-full bg-[#F3F4F6] items-center justify-center active:opacity-70 mt-3"
          >
            <AppIcon name="chevron-back" size={20} color="#1A1C20" />
          </Pressable>

          {/* Logo */}
          <View className="items-center mt-8">
            <View
              className="h-16 w-16 rounded-full bg-[#E04E4E] items-center justify-center"
              style={{ shadowColor: '#E04E4E', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
            >
              <AppIcon name="flash" size={28} color="#FFFFFF" />
            </View>
          </View>

          {/* Heading */}
          <Text className="text-center mt-6 text-3xl font-extrabold" style={{ color: '#1A1C20' }}>
            {isSignUp ? t('auth.createAccountTitle') : t('auth.welcomeBackTitle')}
          </Text>
          <Text className="text-center mt-2 text-base" style={{ color: '#8B8F95' }}>
            {isSignUp ? t('auth.subtitleSignup') : t('auth.subtitleSignin')}
          </Text>

          {/* Form */}
          <View className="mt-10 gap-5">
            {isSignUp && (
              <View>
                <Text className="text-sm font-bold mb-2" style={{ color: '#1A1C20' }}>{t('auth.fullName')}</Text>
                <View
                  className="flex-row items-center rounded-2xl border border-[#E9ECEF] px-4"
                  style={{ height: 52, backgroundColor: '#FAFAFA' }}
                >
                  <AppIcon name="person-outline" size={18} color="#A9ADB2" />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('auth.namePlaceholder')}
                    placeholderTextColor="#A9ADB2"
                    className="flex-1 ml-3 text-base"
                    style={{ color: '#1A1C20' }}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View>
              <Text className="text-sm font-bold mb-2" style={{ color: '#1A1C20' }}>{t('auth.emailAddress')}</Text>
              <View
                className="flex-row items-center rounded-2xl border border-[#E9ECEF] px-4"
                style={{ height: 52, backgroundColor: '#FAFAFA' }}
              >
                <AppIcon name="mail-outline" size={18} color="#A9ADB2" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor="#A9ADB2"
                  className="flex-1 ml-3 text-base"
                  style={{ color: '#1A1C20' }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-bold mb-2" style={{ color: '#1A1C20' }}>{t('auth.password')}</Text>
              <View
                className="flex-row items-center rounded-2xl border border-[#E9ECEF] px-4"
                style={{ height: 52, backgroundColor: '#FAFAFA' }}
              >
                <AppIcon name="lock-closed-outline" size={18} color="#A9ADB2" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor="#A9ADB2"
                  secureTextEntry={!showPassword}
                  className="flex-1 ml-3 text-base"
                  style={{ color: '#1A1C20' }}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <AppIcon
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#A9ADB2"
                  />
                </Pressable>
              </View>

              {null}
            </View>
          </View>

          <View className="flex-1" />

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="rounded-2xl bg-[#E04E4E] py-4 items-center justify-center mt-10 active:opacity-85"
            style={{
              shadowColor: '#E04E4E', shadowOpacity: 0.3, shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 }, elevation: 5,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Text className="text-white text-base font-extrabold">
              {isSignUp ? t('auth.createAccountCta') : t('auth.signInCta')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
