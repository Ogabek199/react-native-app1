export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  mood: 'Happy' | 'Calm' | 'Neutral' | 'Sad';
  createdAt: number;
  updatedAt: number;
};

export type Attachment = {
  id: string;
  entryId: string;
  uri: string;
  type: 'image' | 'audio';
  createdAt: number;
};

