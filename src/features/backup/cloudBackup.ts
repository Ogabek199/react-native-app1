import { initDb } from '../journal/db/client';
import { journalRepo } from '../journal/repo/journalRepo';
import { storage } from '../../shared/firebase/firebase';
import { getMetadata, listAll, ref, uploadString } from 'firebase/storage';
import { useSettingsStore } from '../../store/useSettingsStore';

export type BackupInfo = {
  path: string;
  size: number;
  updatedAt: number | null;
};

function extractTimestamp(path: string) {
  const match = path.match(/journal-(\d+)\.json$/);
  return match ? Number(match[1]) : null;
}

export async function backupJournalToFirebase(): Promise<BackupInfo> {
  const userId = useSettingsStore.getState().userId;
  if (!userId) throw new Error('Not signed in');

  initDb();
  const payload = journalRepo.exportAll();
  const json = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      ...payload,
    },
    null,
    2,
  );

  const updatedAt = Date.now();
  const path = `backups/${userId}/journal-${updatedAt}.json`;
  const r = ref(storage, path);
  await uploadString(r, json, 'raw', { contentType: 'application/json' });

  return { path, size: json.length, updatedAt };
}

export async function getLatestBackupInfo(): Promise<BackupInfo | null> {
  const userId = useSettingsStore.getState().userId;
  if (!userId) return null;

  const dirRef = ref(storage, `backups/${userId}`);
  const result = await listAll(dirRef);
  if (result.items.length === 0) return null;

  const latestRef = [...result.items].sort((a, b) => {
    const aTs = extractTimestamp(a.fullPath) ?? 0;
    const bTs = extractTimestamp(b.fullPath) ?? 0;
    return bTs - aTs;
  })[0];

  const metadata = await getMetadata(latestRef);
  const updatedAt =
    (metadata.updated ? Date.parse(metadata.updated) : NaN) ||
    extractTimestamp(latestRef.fullPath) ||
    null;

  return {
    path: latestRef.fullPath,
    size: Number(metadata.size ?? 0),
    updatedAt: Number.isFinite(updatedAt) ? Number(updatedAt) : null,
  };
}
