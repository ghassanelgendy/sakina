import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ChevronUp,
  ChevronDown,
  X,
  SkipBack,
  SkipForward,
  Radio,
  BookOpen,
  SlidersHorizontal,
  Clock,
  Gauge,
  Repeat,
  Volume2,
  Sparkles,
  DownloadCloud,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAudioStore } from '../../stores/useAudioStore';
import { RECITERS } from '../../quran/services/quranData';
import type { Reciter } from '../../quran/types/quran';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pMins = mins.toString().padStart(2, '0');
  const pSecs = secs.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pMins}:${pSecs}`;
  }
  return `${pMins}:${pSecs}`;
}

function getSheikhLastName(reciter: Reciter): string {
  const map: Record<string, string> = {
    husary: 'الحصري',
    alafasy: 'العفاسي',
    minshawi: 'المنشاوي',
    minshawi_mujawwad: 'المنشاوي (مجود)',
    abdulbasit: 'عبد الباسط',
    shatri: 'الشاطري',
    ghamadi: 'الغامدي',
  };
  if (map[reciter.id]) return map[reciter.id];
  return reciter.name.split(' ').pop() || reciter.name;
}

export function UnifiedAudioBar() {
  const activeSource = useAudioStore((s) => s.activeSource);
  const currentTab = useAudioStore((s) => s.currentTab);
  const forcedMode = useAudioStore((s) => s.forcedMode);
  const setForcedMode = useAudioStore((s) => s.setForcedMode);

  // Podcast State & Actions
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPodcastPlaying = useAudioStore((s) => s.isPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const podcastPlaybackRate = useAudioStore((s) => s.playbackRate);
  const sleepTimerMinutes = useAudioStore((s) => s.sleepTimerMinutes);
  const offlineTrackIds = useAudioStore((s) => s.offlineTrackIds);
  const isExpanded = useAudioStore((s) => s.isExpanded);

  const togglePodcastPlay = useAudioStore((s) => s.togglePlay);
  const skipPodcast = useAudioStore((s) => s.skip);
  const seekPodcast = useAudioStore((s) => s.seek);
  const nextPodcastTrack = useAudioStore((s) => s.nextTrack);
  const prevPodcastTrack = useAudioStore((s) => s.prevTrack);
  const setPodcastPlaybackRate = useAudioStore((s) => s.setPlaybackRate);
  const setPodcastSleepTimer = useAudioStore((s) => s.setSleepTimer);
  const setIsExpanded = useAudioStore((s) => s.setIsExpanded);
  const markTrackOffline = useAudioStore((s) => s.markTrackOffline);

  // Quran State & Actions
  const quranState = useAudioStore((s) => s.quranState);
  const toggleQuranPlay = useAudioStore((s) => s.toggleQuranPlay);
  const nextQuranAyah = useAudioStore((s) => s.nextQuranAyah);
  const prevQuranAyah = useAudioStore((s) => s.prevQuranAyah);

  const [showQuranSettings, setShowQuranSettings] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Determine Effective Display Mode
  let displayMode: 'quran' | 'podcast' | 'hidden' = 'hidden';

  if (forcedMode) {
    displayMode = forcedMode;
  } else if (currentTab === 'quran') {
    if (isPodcastPlaying && activeSource === 'podcast') {
      displayMode = 'podcast';
    } else if (quranState) {
      displayMode = 'quran';
    }
  } else if (currentTab === 'audio') {
    if (quranState?.isPlaying && activeSource === 'quran') {
      displayMode = 'quran';
    } else if (currentTrack) {
      displayMode = 'podcast';
    }
  } else if (currentTab === 'azkar') {
    if (quranState?.isPlaying) {
      displayMode = 'quran';
    } else if (isPodcastPlaying && currentTrack) {
      displayMode = 'podcast';
    } else {
      displayMode = 'hidden';
    }
  }

  if (displayMode === 'hidden') return null;

  const podcastProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isTrackOffline = currentTrack ? offlineTrackIds.includes(currentTrack.id) : false;

  const handleDownload = async () => {
    if (!currentTrack) return;
    if (isTrackOffline) {
      markTrackOffline(currentTrack.id, false);
      return;
    }
    try {
      setIsDownloading(true);
      if ('caches' in window) {
        const cache = await caches.open('sakina-audio-cache');
        await cache.add(currentTrack.audioUrl);
      }
      markTrackOffline(currentTrack.id, true);
    } catch {
      markTrackOffline(currentTrack.id, true);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* =========================================================================
          THE UNIFIED DOCKED PLAYER BAR
         ========================================================================= */}
      <div
        className={cn(
          'fixed z-40 max-w-xl mx-auto transition-all duration-300',
          'bottom-3 right-3 left-3 sm:right-6 sm:left-6',
          isExpanded ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        )}
        dir="rtl"
      >
        <div className="relative overflow-hidden rounded-2xl bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl">
          {/* Progress Bar Top Edge (shown in podcast mode) */}
          {displayMode === 'podcast' && (
            <div className="absolute top-0 right-0 left-0 h-1 bg-secondary/80">
              <div
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${Math.min(100, Math.max(0, podcastProgress))}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5">
            {/* -----------------------------------------------------------------
                MODE 1: QURAN RECITER & AYAH CONTROLS
               ----------------------------------------------------------------- */}
            {displayMode === 'quran' && quranState && (
              <>
                {/* Reciter & Ayah Info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setShowQuranSettings(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 border border-border/40"
                    title="تغيير القارئ وإعدادات التكرار"
                  >
                    <BookOpen size={13} className="text-primary" />
                    <span>{getSheikhLastName(quranState.reciter)}</span>
                  </button>

                  <div className="min-w-0 flex-1 text-right">
                    <div className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                      {quranState.surahName ? <span>سورة {quranState.surahName}</span> : null}
                      <span className="font-arabic-title text-primary text-[11px] tabular-nums">
                        (آية {quranState.currentAyahIndex})
                      </span>
                    </div>
                    {quranState.repeatSettings.verseRepeats > 1 && (
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Repeat size={10} className="text-primary" />
                        <span>تكرار: {quranState.currentVerseRepeat} من {quranState.repeatSettings.verseRepeats}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Playback Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={prevQuranAyah}
                    aria-label="الآية السابقة"
                    className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-all cursor-pointer"
                    title="الآية السابقة"
                  >
                    <SkipForward size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={toggleQuranPlay}
                    aria-label={quranState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                    className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {quranState.isPlaying ? <Pause size={17} /> : <Play size={17} className="translate-x-[-1px]" />}
                  </button>

                  <button
                    type="button"
                    onClick={nextQuranAyah}
                    aria-label="الآية التالية"
                    className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-all cursor-pointer"
                    title="الآية التالية"
                  >
                    <SkipBack size={16} />
                  </button>

                  {/* Settings Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowQuranSettings(true)}
                    aria-label="خيارات التكرار والصوت"
                    className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-all cursor-pointer"
                    title="خيارات الصوت والتكرار"
                  >
                    <SlidersHorizontal size={15} />
                  </button>

                  {/* Mode switcher if podcast is loaded */}
                  {currentTrack && (
                    <button
                      type="button"
                      onClick={() => setForcedMode('podcast')}
                      className="px-2 py-1 rounded-lg bg-secondary/80 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer ml-1"
                      title="التبديل إلى مشغل البودكاست"
                    >
                      البودكاست
                    </button>
                  )}
                </div>
              </>
            )}

            {/* -----------------------------------------------------------------
                MODE 2: PODCAST & HISTORIC RECITER CONTROLS
               ----------------------------------------------------------------- */}
            {displayMode === 'podcast' && currentTrack && (
              <>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-right cursor-pointer"
                >
                  <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Radio size={18} className={cn(isPodcastPlaying && 'animate-pulse text-primary')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {currentTrack.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                      <span>{currentTrack.reciterOrSpeaker}</span>
                      <span className="opacity-40">•</span>
                      <span className="tabular-nums font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => skipPodcast(-15)}
                    aria-label="تأخير 15 ثانية"
                    className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-all cursor-pointer"
                    title="تأخير 15 ثانية"
                  >
                    <RotateCcw size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={togglePodcastPlay}
                    aria-label={isPodcastPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                    className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPodcastPlaying ? <Pause size={17} /> : <Play size={17} className="translate-x-[-1px]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => skipPodcast(15)}
                    aria-label="تقديم 15 ثانية"
                    className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-all cursor-pointer"
                    title="تقديم 15 ثانية"
                  >
                    <RotateCw size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    aria-label="تكبير المشغل"
                    className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-all cursor-pointer"
                  >
                    <ChevronUp size={16} />
                  </button>

                  {/* Mode switcher if user is on Quran tab */}
                  {quranState && currentTab === 'quran' && (
                    <button
                      type="button"
                      onClick={() => setForcedMode('quran')}
                      className="px-2 py-1 rounded-lg bg-secondary/80 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer ml-1"
                      title="التبديل إلى تلاوة المصحف"
                    >
                      المصحف
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          PODCAST EXPANDED FULL PLAYER MODAL
         ========================================================================= */}
      {isExpanded && currentTrack && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl p-6 flex flex-col gap-5 animate-in slide-in-from-bottom-6 duration-300 max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>{currentTrack.categoryLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-all cursor-pointer"
              >
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Artwork */}
            <div className="relative mx-auto my-2 flex size-36 sm:size-44 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-secondary border border-primary/20 shadow-inner">
              <Radio size={56} className={cn('text-primary transition-transform duration-300', isPodcastPlaying && 'scale-110 animate-pulse')} />
              {currentTrack.dateOrLocation && (
                <div className="absolute bottom-2.5 px-2.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[11px] font-medium text-muted-foreground border border-border/40">
                  {currentTrack.dateOrLocation}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="text-center space-y-1">
              <h2 className="font-arabic text-lg sm:text-xl font-bold text-foreground leading-snug">
                {currentTrack.title}
              </h2>
              <p className="text-sm font-medium text-primary">
                {currentTrack.reciterOrSpeaker}
              </p>
              {currentTrack.description && (
                <p className="text-xs text-muted-foreground pt-1 leading-relaxed max-w-sm mx-auto">
                  {currentTrack.description}
                </p>
              )}
            </div>

            {/* Scrubber */}
            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekPodcast(Number(e.target.value))}
                className="w-full accent-primary h-2 rounded-lg bg-secondary cursor-pointer"
                aria-label="شريط وقت التلاوة"
              />
              <div className="flex justify-between text-xs font-mono tabular-nums text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 py-1">
              <button
                type="button"
                onClick={prevPodcastTrack}
                aria-label="المقطع السابق"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
              >
                <SkipForward size={20} />
              </button>

              <button
                type="button"
                onClick={() => skipPodcast(-15)}
                aria-label="تأخير 15 ثانية"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
              >
                <RotateCcw size={19} />
              </button>

              <button
                type="button"
                onClick={togglePodcastPlay}
                aria-label={isPodcastPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                className="flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPodcastPlaying ? <Pause size={28} /> : <Play size={28} className="translate-x-[-2px]" />}
              </button>

              <button
                type="button"
                onClick={() => skipPodcast(15)}
                aria-label="تقديم 15 ثانية"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
              >
                <RotateCw size={19} />
              </button>

              <button
                type="button"
                onClick={nextPodcastTrack}
                aria-label="المقطع التالي"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
              >
                <SkipBack size={20} />
              </button>
            </div>

            {/* Speed & Sleep Timer & Offline */}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Gauge size={13} />
                </span>
                {[1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPodcastPlaybackRate(rate)}
                    className={cn(
                      'px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer',
                      podcastPlaybackRate === rate
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const options = [null, 15, 30, 45, 60];
                    const currIndex = options.indexOf(sleepTimerMinutes);
                    const nextOpt = options[(currIndex + 1) % options.length];
                    setPodcastSleepTimer(nextOpt);
                  }}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer border',
                    sleepTimerMinutes
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  )}
                  title="مؤقت النوم"
                >
                  <Clock size={13} />
                  <span>{sleepTimerMinutes ? `${sleepTimerMinutes} د` : 'مؤقت'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer border',
                    isTrackOffline
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  )}
                  title={isTrackOffline ? 'محفوظ بدون إنترنت' : 'تنزيل للعمل بدون إنترنت'}
                >
                  {isTrackOffline ? <Check size={13} /> : <DownloadCloud size={13} />}
                  <span>{isTrackOffline ? 'محفوظ' : 'حفظ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          QURAN OPTIONS & REPEAT DRAWER MODAL
         ========================================================================= */}
      {showQuranSettings && quranState && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowQuranSettings(false)}
          dir="rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-popover border border-border p-6 space-y-4 text-right animate-in slide-in-from-bottom duration-300 max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                <span>خيارات الصوت وتكرار الحفظ</span>
              </h3>
              <button
                onClick={() => setShowQuranSettings(false)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Reciter Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="size-3.5 text-muted-foreground" />
                <span>القارئ الصوتي:</span>
              </label>
              <select
                value={quranState.reciter.id}
                onChange={(e) => {
                  const found = RECITERS.find((r) => r.id === e.target.value);
                  if (found) quranState.onSelectReciter(found);
                }}
                className="w-full bg-secondary/80 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary border border-border/40"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.style ? `(${r.style})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Verse Repeat Count */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Repeat className="size-3.5 text-muted-foreground" />
                  <span>تكرار كل آية:</span>
                </label>
                <span className="text-xs font-bold text-primary font-mono tabular-nums">
                  {quranState.repeatSettings.verseRepeats} مرات
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 5, 7, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      quranState.onChangeRepeatSettings({
                        ...quranState.repeatSettings,
                        verseRepeats: num,
                      })
                    }
                    className={cn(
                      'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      quranState.repeatSettings.verseRepeats === num
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Silence Period for Recitation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span>فترة سكوت للتسميع الذاتي:</span>
                </label>
                <span className="text-xs font-bold text-primary font-mono tabular-nums">
                  {quranState.repeatSettings.delaySeconds} ثوانٍ
                </span>
              </div>
              <div className="flex gap-1.5">
                {[0, 2, 4, 6, 8].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() =>
                      quranState.onChangeRepeatSettings({
                        ...quranState.repeatSettings,
                        delaySeconds: sec,
                      })
                    }
                    className={cn(
                      'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      quranState.repeatSettings.delaySeconds === sec
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    {sec === 0 ? 'بدون' : `${sec}ث`}
                  </button>
                ))}
              </div>
            </div>

            {/* Playback Speed */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Gauge className="size-3.5 text-muted-foreground" />
                <span>سرعة التلاوة:</span>
              </label>
              <div className="flex gap-1.5">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => quranState.onChangeSpeed(speed)}
                    className={cn(
                      'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      quranState.playbackRate === speed
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQuranSettings(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:brightness-105 active:scale-95 transition-all mt-2"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </>
  );
}
