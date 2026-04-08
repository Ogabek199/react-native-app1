import { db } from '../db/client';
import { makeId } from '../../../shared/lib/id';
import type { Attachment, JournalEntry } from './types';

function rowToEntry(row: any): JournalEntry {
  const moodRaw = String(row.mood ?? 'Calm');
  const mood: JournalEntry['mood'] =
    moodRaw === 'Happy'
      ? 'Happy'
      : moodRaw === 'Sad'
        ? 'Sad'
        : moodRaw === 'Neutral'
          ? 'Neutral'
          : moodRaw === 'Loved'
            ? 'Neutral'
          : 'Calm';
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    mood,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function rowToAttachment(row: any): Attachment {
  const typeRaw = String(row.type ?? 'image');
  const type: Attachment['type'] = typeRaw === 'audio' ? 'audio' : 'image';
  return {
    id: String(row.id),
    entryId: String(row.entry_id),
    uri: String(row.uri),
    type,
    createdAt: Number(row.created_at),
  };
}

export const journalRepo = {
  listEntries(): JournalEntry[] {
    const rows = db.getAllSync(
      `SELECT id, title, body, mood, created_at, updated_at
       FROM entries
       ORDER BY created_at DESC`
    );
    return rows.map(rowToEntry);
  },

  searchEntries(query: string): JournalEntry[] {
    const q = `%${query.trim()}%`;
    const rows = db.getAllSync(
      `SELECT id, title, body, mood, created_at, updated_at
       FROM entries
       WHERE title LIKE ? OR body LIKE ?
       ORDER BY created_at DESC`,
      [q, q]
    );
    return rows.map(rowToEntry);
  },

  getEntry(id: string): JournalEntry | null {
    const row = db.getFirstSync(
      `SELECT id, title, body, mood, created_at, updated_at FROM entries WHERE id = ?`,
      [id]
    );
    return row ? rowToEntry(row) : null;
  },

  upsertEntry(input: { id?: string; title: string; body: string; mood?: JournalEntry['mood'] }): JournalEntry {
    const now = Date.now();
    const existingId = input.id?.trim();
    const mood = input.mood ?? 'Calm';
    if (existingId) {
      db.runSync(
        `UPDATE entries SET title = ?, body = ?, mood = ?, updated_at = ? WHERE id = ?`,
        [input.title, input.body, mood, now, existingId]
      );
      const updated = this.getEntry(existingId);
      if (!updated) {
        // If it didn't exist, fall back to create.
        return this.upsertEntry({ title: input.title, body: input.body, mood });
      }
      return updated;
    }

    const id = makeId('entry');
    db.runSync(
      `INSERT INTO entries (id, title, body, mood, created_at, updated_at) VALUES (?,?,?,?,?,?)`,
      [id, input.title, input.body, mood, now, now]
    );
    return this.getEntry(id)!;
  },

  deleteEntry(id: string) {
    db.runSync(`DELETE FROM entries WHERE id = ?`, [id]);
  },

  listAttachments(entryId: string): Attachment[] {
    const rows = db.getAllSync(
      `SELECT id, entry_id, uri, type, created_at
       FROM attachments
       WHERE entry_id = ?
       ORDER BY created_at DESC`,
      [entryId]
    );
    return rows.map(rowToAttachment);
  },

  getFirstImageUri(entryId: string): string | null {
    const row = db.getFirstSync(
      `SELECT uri FROM attachments WHERE entry_id = ? AND type = 'image' ORDER BY created_at DESC LIMIT 1`,
      [entryId]
    );
    const uri = (row as any)?.uri;
    return uri ? String(uri) : null;
  },

  hasAttachment(entryId: string, type: Attachment['type']): boolean {
    const row = db.getFirstSync(
      `SELECT 1 as ok FROM attachments WHERE entry_id = ? AND type = ? LIMIT 1`,
      [entryId, type]
    );
    return Boolean((row as any)?.ok);
  },

  addImageAttachment(entryId: string, uri: string): Attachment {
    const now = Date.now();
    const id = makeId('att');
    db.runSync(
      `INSERT INTO attachments (id, entry_id, uri, type, created_at) VALUES (?,?,?,?,?)`,
      [id, entryId, uri, 'image', now]
    );
    const row = db.getFirstSync(
      `SELECT id, entry_id, uri, type, created_at FROM attachments WHERE id = ?`,
      [id]
    );
    return rowToAttachment(row);
  },

  deleteAttachment(id: string) {
    db.runSync(`DELETE FROM attachments WHERE id = ?`, [id]);
  },

  exportAll(): { entries: JournalEntry[]; attachments: Attachment[] } {
    const entryRows = db.getAllSync(
      `SELECT id, title, body, mood, created_at, updated_at FROM entries ORDER BY created_at DESC`
    );
    const attachmentRows = db.getAllSync(
      `SELECT id, entry_id, uri, type, created_at FROM attachments ORDER BY created_at DESC`
    );
    return {
      entries: entryRows.map(rowToEntry),
      attachments: attachmentRows.map(rowToAttachment),
    };
  },
};

