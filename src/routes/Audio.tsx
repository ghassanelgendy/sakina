import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Play,
  Pause,
  Radio,
  Clock,
  Sparkles,
  BookOpen,
  Headphones,
  Check,
  DownloadCloud,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AUDIO_CATALOG } from '../data/audioCatalog';
import type { AudioCategory, AudioTrack } from '../types/audio';
import { useAudioStore } from '../stores/useAudioStore';

export default function AudioRoute() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | AudioCategory>('all');

  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const playTrack = useAudioStore((s) => s.playTrack);
  const togglePlay = useAudioStore((s) => s.togglePlay);
  const offlineTrackIds = useAudioStore((s) => s.offlineTrackIds);
  const markTrackOffline = useAudioStore((s) => s.markTrackOffline);

  const categories = [
    { id: 'all' as const, label: 'الكل' },
    { id: 'minshawi' as const, label: 'تراث المنشاوي' },
    { id: 'podcasts' as const, label: 'بودكاست ديني' },
  ];

  const filteredTracks = useMemo(() => {
    return AUDIO_CATALOG.filter((track) => {
      const matchesCategory = selectedCategory === 'all' || track.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        track.title.toLowerCase().includes(q) ||
        track.reciterOrSpeaker.toLowerCase().includes(q) ||
        track.description.toLowerCase().includes(q) ||
        (track.dateOrLocation && track.dateOrLocation.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const featuredTrack = useMemo(() => {
    return AUDIO_CATALOG.find((t) => t.isFeatured && (selectedCategory === 'all' || t.category === selectedCategory));
  }, [selectedCategory]);

  const handleTrackClick = (track: AudioTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, filteredTracks);
    }
  };

  const handleToggleOffline = async (e: React.MouseEvent, track: AudioTrack) => {
    e.stopPropagation();
    const isOffline = offlineTrackIds.includes(track.id);
    if (isOffline) {
      markTrackOffline(track.id, false);
      return;
    }

    try {
      if ('caches' in window) {
        const cache = await caches.open('sakina-audio-cache');
        await cache.add(track.audioUrl);
      }
      markTrackOffline(track.id, true);
    } catch {
      markTrackOffline(track.id, true);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 pb-28" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Headphones size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-arabic text-foreground">
              صوتيات وبودكاست
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            تراث قراء الرعيل الأول والبرامج الإيمانية المختارة من قنوات تيليجرام وأرشيف التلاوات النادرة.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث: سورة يوسف، المنشاوي، الصلاة..."
            aria-label="البحث في الصوتيات"
            className="w-full rounded-2xl bg-card border border-border/80 py-2.5 pr-10 pl-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            dir="rtl"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-bold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95',
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured Hero Banner (if not searching) */}
      {!searchQuery && featuredTrack && (
        <div
          onClick={() => handleTrackClick(featuredTrack)}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/60 border border-primary/20 p-6 sm:p-8 mb-8 cursor-pointer group transition-all hover:border-primary/40 shadow-sm"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles size={13} />
                <span>تسجيل مختار</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-arabic text-foreground group-hover:text-primary transition-colors">
                {featuredTrack.title}
              </h2>
              <p className="text-sm text-primary font-medium">
                {featuredTrack.reciterOrSpeaker} {featuredTrack.dateOrLocation ? `— ${featuredTrack.dateOrLocation}` : ''}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {featuredTrack.description}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
                {currentTrack?.id === featuredTrack.id && isPlaying ? (
                  <Pause size={28} />
                ) : (
                  <Play size={28} className="translate-x-[-2px]" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTracks.map((track) => {
          const isThisTrack = currentTrack?.id === track.id;
          const isThisPlaying = isThisTrack && isPlaying;
          const isOffline = offlineTrackIds.includes(track.id);

          return (
            <div
              key={track.id}
              onClick={() => handleTrackClick(track)}
              className={cn(
                'group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer',
                isThisTrack
                  ? 'border-primary/50 bg-primary/5 shadow-sm'
                  : 'border-border/80 bg-card hover:border-border hover:bg-secondary/40'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
                      isThisTrack
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary text-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    )}
                  >
                    {isThisPlaying ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} className="translate-x-[-1px]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-primary">{track.reciterOrSpeaker}</span>
                      <span className="opacity-40">•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px] tabular-nums">
                        <Clock size={11} />
                        {track.durationFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Offline Download button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleOffline(e, track)}
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer',
                    isOffline
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : 'border-border text-muted-foreground/60 hover:text-foreground hover:bg-secondary'
                  )}
                  title={isOffline ? 'محفوظ بدون إنترنت' : 'تنزيل للعمل بدون إنترنت'}
                >
                  {isOffline ? <Check size={14} /> : <DownloadCloud size={14} />}
                </button>
              </div>

              {track.description && (
                <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed border-t border-border/40 pt-2.5">
                  {track.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/70">
                <span className="rounded-md bg-secondary/80 px-2 py-0.5 font-medium">
                  {track.categoryLabel}
                </span>
                <span>{track.source}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTracks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Radio size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">لم يتم العثور على مقاطع تطابق بحثك</p>
        </div>
      )}
    </div>
  );
}
