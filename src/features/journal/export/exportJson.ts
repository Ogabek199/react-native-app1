import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { initDb } from '../db/client';
import { journalRepo } from '../repo/journalRepo';

export async function exportJournalJson(opts: { title: string }) {
  initDb();
  const payload = journalRepo.exportAll();
  const json = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      ...payload,
    },
    null,
    2
  );

  const filename = `journal-export-${Date.now()}.json`;

  // 1) Write temp file (works on both platforms)
  const tmpPath = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(tmpPath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // 2) Android: let user pick folder and save there (device storage)
  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (perm.granted) {
      const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
        perm.directoryUri,
        filename,
        'application/json'
      );
      await FileSystem.writeAsStringAsync(destUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      Alert.alert(opts.title, 'Saved to device storage.');
      return;
    }
  }

  // 3) Fallback: share sheet (iOS Files / Android share)
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(tmpPath, {
      mimeType: 'application/json',
      dialogTitle: opts.title,
    });
  } else {
    Alert.alert(opts.title, 'Export ready, but sharing is not available.');
  }
}

