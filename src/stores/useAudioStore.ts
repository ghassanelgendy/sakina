import { create } from 'zustand';
import type { AudioTrack } from '../types/audio';

const STORAGE_KEY = 'sakina_audio_state_v1';
const OFFLINE_TRACKS_KEY = 'sakina_offline_tracks_v1';

export interface AudioState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  playlist: AudioTrack[];
  sleepTimerMinutes: number | null;
  sleepTimerEndsAt: number | null;
  offlineTrackIds: string[];
  isExpanded: boolean;

  // Actions
  playTrack: (track: AudioTrack, playlist?: AudioTrack[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setPlaybackRate: (rate: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  setIsExpanded: (expanded: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (dur: number) => void;
  setIsPlaying: (playing: boolean) => void;
  markTrackOffline: (id: string, offline: boolean) => void;
}

function getInitialState() {
  let offlineIds: string[] = [];
  try {
    const savedOffline = localStorage.getItem(OFFLINE_TRACKS_KEY);
    if (savedOffline) offlineIds = JSON.parse(savedOffline);
  } catch {}

  let savedRate = 1;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.playbackRate) savedRate = parsed.playbackRate;
    }
  } catch {}

  return { offlineIds, savedRate };
}

const { offlineIds: initialOffline, savedRate: initialRate } = getInitialState();

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: initialRate,
  volume: 1,
  playlist: [],
  sleepTimerMinutes: null,
  sleepTimerEndsAt: null,
  offlineTrackIds: initialOffline,
  isExpanded: false,

  playTrack: (track, playlist) => {
    const state = get();
    const list = playlist && playlist.length > 0 ? playlist : state.playlist.length > 0 ? state.playlist : [track];
    set({
      currentTrack: track,
      playlist: list,
      isPlaying: true,
      currentTime: 0,
    });
  },

  togglePlay: () => {
    const state = get();
    if (!state.currentTrack) return;
    set({ isPlaying: !state.isPlaying });
  },

  pause: () => set({ isPlaying: false }),
  resume: () => {
    const state = get();
    if (state.currentTrack) set({ isPlaying: true });
  },

  seek: (time) => set({ currentTime: time }),

  skip: (seconds) => {
    const state = get();
    const newTime = Math.max(0, Math.min(state.duration, state.currentTime + seconds));
    set({ currentTime: newTime });
  },

  nextTrack: () => {
    const { currentTrack, playlist } = get();
    if (!currentTrack || playlist.length <= 1) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    set({
      currentTrack: playlist[nextIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },

  prevTrack: () => {
    const { currentTrack, playlist, currentTime } = get();
    if (!currentTrack || playlist.length <= 1) return;
    // If we are more than 3 seconds in, restart track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    set({
      currentTrack: playlist[prevIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },

  setPlaybackRate: (rate) => {
    set({ playbackRate: rate });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ playbackRate: rate }));
    } catch {}
  },

  setSleepTimer: (minutes) => {
    if (!minutes) {
      set({ sleepTimerMinutes: null, sleepTimerEndsAt: null });
      return;
    }
    const endsAt = Date.now() + minutes * 60 * 1000;
    set({ sleepTimerMinutes: minutes, sleepTimerEndsAt: endsAt });
  },

  setIsExpanded: (expanded) => set({ isExpanded: expanded }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (dur) => set({ duration: dur }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  markTrackOffline: (id, offline) => {
    const { offlineTrackIds } = get();
    const next = offline
      ? [...new Set([...offlineTrackIds, id])]
      : offlineTrackIds.filter((tId) => tId !== id);
    set({ offlineTrackIds: next });
    try {
      localStorage.setItem(OFFLINE_TRACKS_KEY, JSON.stringify(next));
    } catch {}
  },
}));
