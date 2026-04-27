export const DB_NAME = 'journal.db';
export const DB_VERSION = 1;

const schemaV1 = [
  `CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    mood TEXT NOT NULL DEFAULT 'Calm',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries (created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_entries_updated_at ON entries (updated_at DESC);`,
  `CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY NOT NULL,
    entry_id TEXT NOT NULL,
    uri TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(entry_id) REFERENCES entries(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_attachments_entry_id ON attachments (entry_id);`,
];
export default schemaV1

