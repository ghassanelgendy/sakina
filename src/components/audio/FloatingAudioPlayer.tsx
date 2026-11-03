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
  Clock,
  Gauge,
  Sparkles,
  DownloadCloud,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAudioStore } from '../../stores/useAudioStore';

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

export function FloatingAudioPlayer() {
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const playbackRate = useAudioStore((s) => s.playbackRate);
  const sleepTimerMinutes = useAudioStore((s) => s.sleepTimerMinutes);
  const offlineTrackIds = useAudioStore((s) => s.offlineTrackIds);
  const isExpanded = useAudioStore((s) => s.isExpanded);

  const togglePlay = useAudioStore((s) => s.togglePlay);
  const skip = useAudioStore((s) => s.skip);
  const seek = useAudioStore((s) => s.seek);
  const nextTrack = useAudioStore((s) => s.nextTrack);
  const prevTrack = useAudioStore((s) => s.prevTrack);
  const setPlaybackRate = useAudioStore((s) => s.setPlaybackRate);
  const setSleepTimer = useAudioStore((s) => s.setSleepTimer);
  const setIsExpanded = useAudioStore((s) => s.setIsExpanded);
  const markTrackOffline = useAudioStore((s) => s.markTrackOffline);

  const [isDownloading, setIsDownloading] = useState(false);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isOffline = offlineTrackIds.includes(currentTrack.id);

  const handleDownload = async () => {
    if (isOffline) {
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
      // Fallback
      markTrackOffline(currentTrack.id, true);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Floating Mini Player (Pinned Bottom) */}
      <div
        className={cn(
          'fixed bottom-3 right-3 left-3 sm:right-6 sm:left-6 z-40 max-w-xl mx-auto transition-all duration-300',
          isExpanded ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        )}
        dir="rtl"
      >
        <div className="relative overflow-hidden rounded-2xl bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl">
          {/* Progress Bar Top Edge */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-secondary/80">
            <div
              className="h-full bg-primary transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3">
            {/* Track Info (Clickable to expand) */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-3 min-w-0 flex-1 text-right cursor-pointer"
            >
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Radio size={20} className={cn(isPlaying && 'animate-pulse text-primary')} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-foreground truncate">
                  {currentTrack.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                  <span>{currentTrack.reciterOrSpeaker}</span>
                  <span className="opacity-40">•</span>
                  <span className="tabular-nums font-mono text-[11px]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </button>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => skip(-15)}
                aria-label="تأخير 15 ثانية"
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
                title="تأخير 15 ثانية"
              >
                <RotateCcw size={17} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-[-1px]" />}
              </button>

              <button
                type="button"
                onClick={() => skip(15)}
                aria-label="تقديم 15 ثانية"
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
                title="تقديم 15 ثانية"
              >
                <RotateCw size={17} />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                aria-label="تكبير المشغل"
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
              >
                <ChevronUp size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Expanded Player Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl p-6 flex flex-col gap-5 animate-in slide-in-from-bottom-6 duration-300 max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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

            {/* Artwork / Iconic Centerpiece */}
            <div className="relative mx-auto my-2 flex size-36 sm:size-44 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-secondary border border-primary/20 shadow-inner">
              <Radio size={56} className={cn('text-primary transition-transform duration-300', isPlaying && 'scale-110 animate-pulse')} />
              {currentTrack.dateOrLocation && (
                <div className="absolute bottom-2.5 px-2.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[11px] font-medium text-muted-foreground border border-border/40">
                  {currentTrack.dateOrLocation}
                </div>
              )}
            </div>

            {/* Track Metadata */}
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

            {/* Scrubber Slider */}
            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full accent-primary h-2 rounded-lg bg-secondary cursor-pointer"
                aria-label="شريط وقت التلاوة"
              />
              <div className="flex justify-between text-xs font-mono tabular-nums text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Playback Controls */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 py-1">
              <button
                type="button"
                onClick={prevTrack}
                aria-label="المقطع السابق"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
              >
                <SkipForward size={20} />
              </button>

              <button
                type="button"
                onClick={() => skip(-15)}
                aria-label="تأخير 15 ثانية"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
              >
                <RotateCcw size={19} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                className="flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} className="translate-x-[-2px]" />}
              </button>

              <button
                type="button"
                onClick={() => skip(15)}
                aria-label="تقديم 15 ثانية"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
              >
                <RotateCw size={19} />
              </button>

              <button
                type="button"
                onClick={nextTrack}
                aria-label="المقطع التالي"
                className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground hover:bg-secondary/80 active:scale-90 transition-all cursor-pointer"
              >
                <SkipBack size={20} />
              </button>
            </div>

            {/* Speed & Sleep Timer & Offline Row */}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs">
              {/* Playback Speed */}
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Gauge size={13} />
                </span>
                {[1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPlaybackRate(rate)}
                    className={cn(
                      'px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer',
                      playbackRate === rate
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Sleep Timer */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const options = [null, 15, 30, 45, 60];
                    const currIndex = options.indexOf(sleepTimerMinutes);
                    const nextOpt = options[(currIndex + 1) % options.length];
                    setSleepTimer(nextOpt);
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

                {/* Offline Download Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer border',
                    isOffline
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  )}
                  title={isOffline ? 'محفوظ بدون إنترنت' : 'تنزيل للعمل بدون إنترنت'}
                >
                  {isOffline ? <Check size={13} /> : <DownloadCloud size={13} />}
                  <span>{isOffline ? 'محفوظ' : 'حفظ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
