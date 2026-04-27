export const DEFAULT_REMINDER_SOUND = 'default' as const;

export const CUSTOM_REMINDER_SOUND_FILES = [
  'reminder-glass.wav',
  'reminder-hero.wav',
  'reminder-submarine.wav',
] as const;

export type ReminderSound = typeof DEFAULT_REMINDER_SOUND | (typeof CUSTOM_REMINDER_SOUND_FILES)[number];

const VALID_REMINDER_SOUNDS = new Set<ReminderSound>([
  DEFAULT_REMINDER_SOUND,
  ...CUSTOM_REMINDER_SOUND_FILES,
]);

export function normalizeReminderSound(value: string | null | undefined): ReminderSound {
  return VALID_REMINDER_SOUNDS.has(value as ReminderSound)
    ? (value as ReminderSound)
    : DEFAULT_REMINDER_SOUND;
}

export function getDailyReminderBody(message: string | null | undefined, fallback: string) {
  const trimmed = (message ?? '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function getReminderChannelId(sound: ReminderSound) {
  if (sound === DEFAULT_REMINDER_SOUND) return 'daily-reminders-default';
  return `daily-reminders-${sound.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
}
