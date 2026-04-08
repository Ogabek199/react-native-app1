import * as React from 'react';
import { Text, View } from 'react-native';

import { Screen } from '../shared/ui/Screen';
import { Card } from '../shared/ui/Card';
import { useTranslation } from 'react-i18next';

export function HelpCenterScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <View className="gap-3">
        <Card>
          <Text className="text-text text-lg font-extrabold">{t('settings.helpCenter')}</Text>
          <Text className="text-text2 mt-2">
            {t('settings.helpCenterSub')}
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

