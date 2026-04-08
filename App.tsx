import { StatusBar } from 'expo-status-bar';
import * as React from 'react';

import './global.css';
import './src/shared/i18n/i18n';
import { AppProviders } from './src/application/AppProviders';

export default function App() {
  return (
    <>
      <AppProviders />
      <StatusBar style="auto" />
    </>
  );
}
