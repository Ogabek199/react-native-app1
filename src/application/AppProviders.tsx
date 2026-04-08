import { NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';

import { RootNavigator } from './navigation/RootNavigator';
import { useSettingsStore } from '../store/useSettingsStore';
import i18n from '../shared/i18n/i18n';

export function AppProviders() {
  const lockEnabled = useSettingsStore((s) => s.lockEnabled);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const language = useSettingsStore((s) => s.language);
  const [unlocked, setUnlocked] = React.useState(false);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [hydrated, language]);

  const authIfNeeded = React.useCallback(async () => {
    if (!lockEnabled) {
      setUnlocked(true);
      return;
    }
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ilovani ochish',
    });
    setUnlocked(res.success);
  }, [lockEnabled]);

  React.useEffect(() => {
    if (!hydrated) return;
    authIfNeeded();
  }, [hydrated, authIfNeeded]);

  React.useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') authIfNeeded();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [authIfNeeded]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {unlocked ? <RootNavigator /> : null}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

