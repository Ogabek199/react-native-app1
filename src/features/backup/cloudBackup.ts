import { initDb } from '../journal/db/client';
import { journalRepo } from '../journal/repo/journalRepo';
import { storage } from '../../shared/firebase/firebase';
import { ref, uploadString } from 'firebase/storage';
import { useSettingsStore } from '../../store/useSettingsStore';

export async function backupJournalToFirebase(): Promise<{ path: string; size: number }> {
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

  const path = `backups/${userId}/journal-${Date.now()}.json`;
  const r = ref(storage, path);
  await uploadString(r, json, 'raw', { contentType: 'application/json' });

  return { path, size: json.length };
}

