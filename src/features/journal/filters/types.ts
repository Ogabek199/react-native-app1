export type JournalMood = 'Happy' | 'Calm' | 'Neutral' | 'Sad';

export type JournalDateRange = {
  start?: number; // inclusive, ms epoch at local day start
  end?: number; // inclusive, ms epoch at local day end
};

export type JournalFilters = {
  query: string;
  moods: JournalMood[]; // empty => all
  dateRange: JournalDateRange;
  withPhotos: boolean;
  withAudio: boolean;
  tags: string[]; // lowercase, without '#'
};

export const defaultJournalFilters: JournalFilters = {
  query: '',
  moods: [],
  dateRange: {},
  withPhotos: false,
  withAudio: false,
  tags: [],
};

