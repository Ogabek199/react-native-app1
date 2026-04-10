import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { Button } from '../shared/ui/Button';
import { exportJournalPdf } from '../features/journal/export/exportPdf';

export function DataExportScreen() {
  const { t } = useTranslation();
  const [busy, setBusy] = React.useState(false);

  const exportPdf = React.useCallback(async () => {
    try {
      setBusy(true);
      await exportJournalPdf({ title: t('settings.dataExport') });
    } catch (e: any) {
      Alert.alert(t('settings.dataExport'), e?.message ?? t('settings.exportFailed'));
    } finally {
      setBusy(false);
    }
  }, [t]);

  return (
    <Screen>
      <View className="gap-3">
        <Card>
          <Text className="text-text text-lg font-extrabold">{t('settings.dataExport')}</Text>
          <Text className="text-text2 mt-2">{t('settings.dataExportSub')}</Text>
          <Text className="text-muted text-xs mt-3">{t('settings.dataExportSub')}</Text>
        </Card>

        <Button title={busy ? t('common.pleaseWait') : t('dataExport.exportPdf')} onPress={exportPdf} disabled={busy} />
      </View>
    </Screen>
  );
}

