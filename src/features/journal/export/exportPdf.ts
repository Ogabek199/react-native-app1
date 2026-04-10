import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { initDb } from '../db/client';
import { journalRepo } from '../repo/journalRepo';

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function exportJournalPdf(opts: { title: string }) {
  initDb();
  const payload = journalRepo.exportAll();
  const entries = payload.entries ?? [];

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 24px; }
      h1 { margin: 0 0 6px; font-size: 20px; }
      .meta { color: #666; font-size: 12px; margin-bottom: 18px; }
      .entry { margin: 0 0 18px; padding: 14px 14px; border: 1px solid #eee; border-radius: 12px; page-break-inside: avoid; }
      .title { font-weight: 800; font-size: 14px; margin: 0 0 6px; }
      .date { color: #888; font-size: 11px; margin-bottom: 10px; }
      .body { white-space: pre-wrap; font-size: 12px; line-height: 1.45; color: #111; }
    </style>
  </head>
  <body>
    <h1>${esc(opts.title)}</h1>
    <div class="meta">Exported at ${new Date().toISOString()} · ${entries.length} entries</div>
    ${entries
      .map((e: any) => {
        const title = esc(String(e.title ?? ''));
        const body = esc(String(e.body ?? ''));
        const createdAt = e.createdAt ? new Date(Number(e.createdAt)).toLocaleString() : '';
        return `<div class="entry">
          <div class="title">${title || 'Untitled'}</div>
          <div class="date">${esc(createdAt)}</div>
          <div class="body">${body || '—'}</div>
        </div>`;
      })
      .join('')}
  </body>
</html>`;

  const filename = `journal-export-${Date.now()}.pdf`;

  // Generate PDF file
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Android SAF: let user pick folder and save there
  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (perm.granted) {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
        perm.directoryUri,
        filename,
        'application/pdf',
      );
      await FileSystem.writeAsStringAsync(destUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      Alert.alert(opts.title, 'Saved to device storage.');
      return;
    }
  }

  // Fallback: share sheet
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: opts.title,
      UTI: 'com.adobe.pdf',
    });
  } else {
    Alert.alert(opts.title, 'Export ready, but sharing is not available.');
  }
}

