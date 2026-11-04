import { useEffect, useRef } from 'react';
import { useAudioStore } from '../../stores/useAudioStore';

export function GlobalAudioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSavedPosRef = useRef<number>(0);

  const activeSource = useAudioStore((s) => s.activeSource);
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const playbackRate = useAudioStore((s) => s.playbackRate);
  const currentTime = useAudioStore((s) => s.currentTime);
  const sleepTimerEndsAt = useAudioStore((s) => s.sleepTimerEndsAt);
  const quranState = useAudioStore((s) => s.quranState);

  const setIsPlaying = useAudioStore((s) => s.setIsPlaying);
  const setCurrentTime = useAudioStore((s) => s.setCurrentTime);
  const setDuration = useAudioStore((s) => s.setDuration);
  const nextTrack = useAudioStore((s) => s.nextTrack);
  const prevTrack = useAudioStore((s) => s.prevTrack);
  const skip = useAudioStore((s) => s.skip);
  const setSleepTimer = useAudioStore((s) => s.setSleepTimer);
  const toggleQuranPlay = useAudioStore((s) => s.toggleQuranPlay);
  const nextQuranAyah = useAudioStore((s) => s.nextQuranAyah);
  const prevQuranAyah = useAudioStore((s) => s.prevQuranAyah);
  const saveTrackProgress = useAudioStore((s) => s.saveTrackProgress);

  // Initialize HTML5 Audio element for Podcasts & Historic Tracks
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      const cur = audio.currentTime;
      setCurrentTime(cur);

      // Periodically persist playback progress for resume option
      if (currentTrack && Math.abs(cur - lastSavedPosRef.current) >= 3) {
        lastSavedPosRef.current = cur;
        saveTrackProgress(currentTrack.id, cur, audio.duration || currentTrack.duration);
      }
    };

    const onDurationChange = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      if (currentTrack) {
        saveTrackProgress(currentTrack.id, 0, audio.duration || currentTrack.duration);
      }
      nextTrack();
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      if (currentTrack && audio.currentTime > 3) {
        saveTrackProgress(currentTrack.id, audio.currentTime, audio.duration || currentTrack.duration);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audioRef.current = null;
    };
  }, [currentTrack, nextTrack, setCurrentTime, setDuration, setIsPlaying, saveTrackProgress]);

  // Handle Track Source Changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.playbackRate = playbackRate;

      // Handle seeking to resume position if currentTime was pre-set
      const targetTime = currentTime;
      const handleCanPlay = () => {
        if (targetTime > 0 && Math.abs(audio.currentTime - targetTime) > 1.5) {
          audio.currentTime = targetTime;
        }
        audio.removeEventListener('canplay', handleCanPlay);
      };
      audio.addEventListener('canplay', handleCanPlay);

      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrack]);

  // Handle Play / Pause for Podcast Audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying && audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, currentTrack, setIsPlaying]);

  // Handle Playback Rate
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Handle Seek from Store
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const diff = Math.abs(audio.currentTime - currentTime);
    if (diff > 1.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  // Media Session API for Lockscreen and System Media Controls (Dynamic: Quran vs Podcast)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (activeSource === 'quran' && quranState) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `سورة ${quranState.surahName || quranState.surahNumber} — آية ${quranState.currentAyahIndex}`,
        artist: quranState.reciter.name,
        album: 'القرآن الكريم — سكينة',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => toggleQuranPlay());
      navigator.mediaSession.setActionHandler('pause', () => toggleQuranPlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevQuranAyah());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextQuranAyah());
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    } else if (activeSource === 'podcast' && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.reciterOrSpeaker,
        album: currentTrack.categoryLabel,
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('seekbackward', () => skip(-15));
      navigator.mediaSession.setActionHandler('seekforward', () => skip(15));
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    }

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [
    activeSource,
    currentTrack,
    quranState,
    nextTrack,
    prevTrack,
    setIsPlaying,
    skip,
    toggleQuranPlay,
    nextQuranAyah,
    prevQuranAyah,
  ]);

  // Sleep Timer Check
  useEffect(() => {
    if (!sleepTimerEndsAt) return;

    const interval = setInterval(() => {
      if (Date.now() >= sleepTimerEndsAt) {
        setIsPlaying(false);
        setSleepTimer(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerEndsAt, setIsPlaying, setSleepTimer]);

  return null;
}
