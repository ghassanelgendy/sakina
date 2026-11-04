import { create } from 'zustand';
import type { AudioTrack, TrackPlaybackProgress } from '../types/audio';
import type { Reciter, RepeatSettings } from '../quran/types/quran';

const STORAGE_KEY = 'sakina_audio_state_v1';
const OFFLINE_TRACKS_KEY = 'sakina_offline_tracks_v1';
const PROGRESS_KEY = 'sakina_audio_progress_v1';
const FAVORITES_KEY = 'sakina_audio_favorites_v1';
const FOLLOWED_TOPICS_KEY = 'sakina_followed_topics_v1';

export type ActiveAudioSource = 'quran' | 'podcast' | null;

export interface QuranAudioControls {
  reciter: Reciter;
  surahNumber: number;
  surahName?: string;
  startAyah: number;
  endAyah: number;
  currentAyahIndex: number;
  isPlaying: boolean;
  isDelaying: boolean;
  currentVerseRepeat: number;
  currentRangeLoop: number;
  playbackRate: number;
  repeatSettings: RepeatSettings;
  onSelectReciter: (reciter: Reciter) => void;
  onTogglePlayPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onChangeSpeed: (speed: number) => void;
  onChangeRepeatSettings: (settings: RepeatSettings) => void;
}

export interface AudioState {
  // Global coordination
  activeSource: ActiveAudioSource;
  currentTab: 'quran' | 'azkar' | 'audio';
  forcedMode: 'quran' | 'podcast' | null;

  // Podcast state
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

  // Progress, Favorites & Following
  playbackProgress: Record<string, TrackPlaybackProgress>;
  lastPlayedTrackId: string | null;
  favoriteTrackIds: string[];
  followedTopicIds: string[];

  // Quran state
  quranState: QuranAudioControls | null;

  // Actions
  setCurrentTab: (tab: 'quran' | 'azkar' | 'audio') => void;
  setForcedMode: (mode: 'quran' | 'podcast' | null) => void;
  registerQuranAudio: (controls: QuranAudioControls) => void;
  unregisterQuranAudio: () => void;

  // Podcast Actions
  playTrack: (track: AudioTrack, playlist?: AudioTrack[], startPosition?: number) => void;
  resumeTrack: (track: AudioTrack, playlist?: AudioTrack[]) => void;
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

  // User Library Actions
  saveTrackProgress: (trackId: string, position: number, duration: number) => void;
  clearTrackProgress: (trackId: string) => void;
  toggleFavorite: (trackId: string) => void;
  toggleFollowTopic: (topicId: string) => void;

  // Quran direct controls from unified bar
  toggleQuranPlay: () => void;
  nextQuranAyah: () => void;
  prevQuranAyah: () => void;
  stopQuran: () => void;
}

function getInitialState() {
  let offlineIds: string[] = [];
  try {
    const savedOffline = localStorage.getItem(OFFLINE_TRACKS_KEY);
    if (savedOffline) offlineIds = JSON.parse(savedOffline);
  } catch {}

  let savedRate = 1;
  let lastTrackId: string | null = null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.playbackRate) savedRate = parsed.playbackRate;
      if (parsed.lastPlayedTrackId) lastTrackId = parsed.lastPlayedTrackId;
    }
  } catch {}

  let progressMap: Record<string, TrackPlaybackProgress> = {};
  try {
    const savedProgress = localStorage.getItem(PROGRESS_KEY);
    if (savedProgress) progressMap = JSON.parse(savedProgress);
  } catch {}

  let favIds: string[] = [];
  try {
    const savedFavs = localStorage.getItem(FAVORITES_KEY);
    if (savedFavs) favIds = JSON.parse(savedFavs);
  } catch {}

  let followedTopics: string[] = [];
  try {
    const savedTopics = localStorage.getItem(FOLLOWED_TOPICS_KEY);
    if (savedTopics) followedTopics = JSON.parse(savedTopics);
  } catch {}

  return {
    offlineIds,
    savedRate,
    lastTrackId,
    progressMap,
    favIds,
    followedTopics,
  };
}

const {
  offlineIds: initialOffline,
  savedRate: initialRate,
  lastTrackId: initialLastTrackId,
  progressMap: initialProgress,
  favIds: initialFavs,
  followedTopics: initialFollowedTopics,
} = getInitialState();

export const useAudioStore = create<AudioState>((set, get) => ({
  activeSource: null,
  currentTab: 'quran',
  forcedMode: null,

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

  playbackProgress: initialProgress,
  lastPlayedTrackId: initialLastTrackId,
  favoriteTrackIds: initialFavs,
  followedTopicIds: initialFollowedTopics,

  quranState: null,

  setCurrentTab: (tab) => set({ currentTab: tab, forcedMode: null }),
  setForcedMode: (mode) => set({ forcedMode: mode }),

  registerQuranAudio: (controls) => {
    const state = get();
    // If Quran audio just started playing, pause any active podcast
    if (controls.isPlaying && state.isPlaying) {
      set({ isPlaying: false, activeSource: 'quran', quranState: controls });
    } else {
      set({ quranState: controls });
      if (controls.isPlaying) {
        set({ activeSource: 'quran' });
      }
    }
  },

  unregisterQuranAudio: () => set({ quranState: null }),

  playTrack: (track, playlist, startPosition) => {
    const state = get();
    // Mutual exclusivity: stop Quran if it's currently reciting
    if (state.quranState?.isPlaying && state.quranState?.onStop) {
      state.quranState.onStop();
    }
    const list = playlist && playlist.length > 0 ? playlist : state.playlist.length > 0 ? state.playlist : [track];
    const initialPos = typeof startPosition === 'number' ? startPosition : 0;

    set({
      currentTrack: track,
      playlist: list,
      isPlaying: true,
      currentTime: initialPos,
      lastPlayedTrackId: track.id,
      activeSource: 'podcast',
      forcedMode: 'podcast',
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        playbackRate: state.playbackRate,
        lastPlayedTrackId: track.id,
      }));
    } catch {}
  },

  resumeTrack: (track, playlist) => {
    const state = get();
    const saved = state.playbackProgress[track.id];
    const resumePos = saved && saved.position > 5 && saved.position < (saved.duration - 10) ? saved.position : 0;
    get().playTrack(track, playlist, resumePos);
  },

  togglePlay: () => {
    const state = get();
    if (!state.currentTrack) return;
    if (!state.isPlaying) {
      if (state.quranState?.isPlaying && state.quranState?.onStop) {
        state.quranState.onStop();
      }
      set({ isPlaying: true, activeSource: 'podcast' });
    } else {
      set({ isPlaying: false });
    }
  },

  pause: () => set({ isPlaying: false }),
  resume: () => {
    const state = get();
    if (state.currentTrack) {
      if (state.quranState?.isPlaying && state.quranState?.onStop) {
        state.quranState.onStop();
      }
      set({ isPlaying: true, activeSource: 'podcast' });
    }
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
    get().playTrack(playlist[nextIndex], playlist, 0);
  },

  prevTrack: () => {
    const { currentTrack, playlist, currentTime } = get();
    if (!currentTrack || playlist.length <= 1) return;
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    get().playTrack(playlist[prevIndex], playlist, 0);
  },

  setPlaybackRate: (rate) => {
    set({ playbackRate: rate });
    try {
      const state = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        playbackRate: rate,
        lastPlayedTrackId: state.lastPlayedTrackId,
      }));
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

  saveTrackProgress: (trackId, position, duration) => {
    if (!trackId || isNaN(position) || position < 3) return;
    const { playbackProgress } = get();

    // If finished within last 15 seconds, mark complete or reset
    const isCompleted = duration > 0 && position >= duration - 15;
    const nextProgress = {
      ...playbackProgress,
      [trackId]: {
        position: isCompleted ? 0 : Math.floor(position),
        duration: Math.floor(duration),
        updatedAt: Date.now(),
      },
    };

    set({ playbackProgress: nextProgress });

    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(nextProgress));
    } catch {}
  },

  clearTrackProgress: (trackId) => {
    const { playbackProgress } = get();
    const next = { ...playbackProgress };
    delete next[trackId];
    set({ playbackProgress: next });
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {}
  },

  toggleFavorite: (trackId) => {
    const { favoriteTrackIds } = get();
    const isFav = favoriteTrackIds.includes(trackId);
    const next = isFav
      ? favoriteTrackIds.filter((id) => id !== trackId)
      : [...favoriteTrackIds, trackId];
    set({ favoriteTrackIds: next });
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {}
  },

  toggleFollowTopic: (topicId) => {
    const { followedTopicIds } = get();
    const isFollowed = followedTopicIds.includes(topicId);
    const next = isFollowed
      ? followedTopicIds.filter((id) => id !== topicId)
      : [...followedTopicIds, topicId];
    set({ followedTopicIds: next });
    try {
      localStorage.setItem(FOLLOWED_TOPICS_KEY, JSON.stringify(next));
    } catch {}
  },

  toggleQuranPlay: () => {
    const { quranState, isPlaying } = get();
    if (!quranState) return;
    if (isPlaying) {
      set({ isPlaying: false });
    }
    set({ activeSource: 'quran', forcedMode: 'quran' });
    quranState.onTogglePlayPause();
  },

  nextQuranAyah: () => {
    const { quranState } = get();
    if (quranState?.onNext) quranState.onNext();
  },

  prevQuranAyah: () => {
    const { quranState } = get();
    if (quranState?.onPrev) quranState.onPrev();
  },

  stopQuran: () => {
    const { quranState } = get();
    if (quranState?.onStop) quranState.onStop();
  },
}));
