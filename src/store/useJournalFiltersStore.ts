import { create } from 'zustand';

import { defaultJournalFilters, type JournalFilters, type JournalMood } from '../features/journal/filters/types';

type State = {
  filters: JournalFilters;
  setQuery: (q: string) => void;
  toggleMood: (m: JournalMood) => void;
  toggleTag: (tag: string) => void;
  addTag: (tag: string) => void;
  setDateRange: (range: JournalFilters['dateRange']) => void;
  setWithPhotos: (v: boolean) => void;
  setWithAudio: (v: boolean) => void;
  reset: () => void;
};

export const useJournalFiltersStore = create<State>((set, get) => ({
  filters: defaultJournalFilters,

  setQuery: (q) => set((s) => ({ filters: { ...s.filters, query: q } })),

  toggleMood: (m) =>
    set((s) => {
      const has = s.filters.moods.includes(m);
      const moods = has ? s.filters.moods.filter((x) => x !== m) : [...s.filters.moods, m];
      return { filters: { ...s.filters, moods } };
    }),

  setDateRange: (range) => set((s) => ({ filters: { ...s.filters, dateRange: range } })),

  setWithPhotos: (v) => set((s) => ({ filters: { ...s.filters, withPhotos: v } })),

  setWithAudio: (v) => set((s) => ({ filters: { ...s.filters, withAudio: v } })),

  toggleTag: (tag) =>
    set((s) => {
      const t = tag.trim().toLowerCase().replace(/^#/, '');
      if (!t) return s;
      const has = s.filters.tags.includes(t);
      const tags = has ? s.filters.tags.filter((x) => x !== t) : [...s.filters.tags, t];
      return { filters: { ...s.filters, tags } };
    }),

  addTag: (tag) =>
    set((s) => {
      const t = tag.trim().toLowerCase().replace(/^#/, '');
      if (!t) return s;
      if (s.filters.tags.includes(t)) return s;
      return { filters: { ...s.filters, tags: [...s.filters.tags, t] } };
    }),

  reset: () => set({ filters: defaultJournalFilters }),
}));

