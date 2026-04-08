import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';

export const supportedLanguages = ['uz', 'ru', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

function detectLanguage(): SupportedLanguage {
  const tag = Localization.getLocales()?.[0]?.languageCode?.toLowerCase() ?? 'en';
  if (tag === 'ru') return 'ru';
  if (tag === 'uz') return 'uz';
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false },
});

export default i18n;

