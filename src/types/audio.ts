export type AudioCategory = 'minshawi' | 'podcasts' | 'historic';

export interface AudioTopic {
  id: string;
  label: string;
  category: AudioCategory;
  description?: string;
  telegramGroup?: string;
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
  isNew?: boolean;
  publishedAt?: string;
  telegramGroupUrl?: string;
}

export interface TrackPlaybackProgress {
  position: number;
  duration: number;
  updatedAt: number;
}
