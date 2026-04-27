import type { JournalEntry } from '../../features/journal/repo/types';
import { startOfDay } from './dateRange';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getCurrentStreak(entries: JournalEntry[], now = Date.now()) {
  if (entries.length === 0) return 0;

  const uniqueDays = Array.from(new Set(entries.map((entry) => startOfDay(entry.createdAt)))).sort((a, b) => b - a);
  const today = startOfDay(now);
  const yesterday = today - DAY_MS;
  const latestDay = uniqueDays[0];

  // If the user hasn't written today yet, keep the streak alive through yesterday.
  if (latestDay !== today && latestDay !== yesterday) return 0;

  let streak = 1;
  let expectedDay = latestDay - DAY_MS;

  for (let i = 1; i < uniqueDays.length; i += 1) {
    if (uniqueDays[i] !== expectedDay) break;
    streak += 1;
    expectedDay -= DAY_MS;
  }

  return streak;
}
