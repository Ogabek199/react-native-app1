import * as SQLite from 'expo-sqlite';

import schemaV1, { DB_NAME } from './schema';

export const db = SQLite.openDatabaseSync(DB_NAME);

export function initDb() {
  db.execSync('PRAGMA foreign_keys = ON;');
  for (const stmt of schemaV1) db.execSync(stmt);

  // Lightweight migrat ion for older installs (before `mood` column existed).
  try {
    const cols = db.getAllSync(`PRAGMA table_info(entries);`) as any[];
    const hasMood = cols.some((c) => String(c.name) === 'mood');
    if (!hasMood) {
      db.execSync(`ALTER TABLE entries ADD COLUMN mood TEXT NOT NULL DEFAULT 'Calm';`);
    }
  } catch {
    // Ignore migration errors; schemaV1 will cover fresh installs.
  }
}

