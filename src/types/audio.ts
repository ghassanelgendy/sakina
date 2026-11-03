export type AudioCategory = 'minshawi' | 'podcasts' | 'historic';

export interface AudioTopic {
  id: string;
  label: string;
  category: AudioCategory;
}

export interface AudioTrack {
  id: string;
  title: string;
  category: AudioCategory;
  categoryLabel: string;
  topicId: string;
  topicLabel: string;
  reciterOrSpeaker: string;
  duration: number; // in seconds
  durationFormatted: string;
  audioUrl: string;
  source: string;
  description: string;
  dateOrLocation?: string;
  isFeatured?: boolean;
}
