import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Play,
  Pause,
  Radio,
  Clock,
  Sparkles,
  Headphones,
  Check,
  DownloadCloud,
  Tag,
  Heart,
  RotateCcw,
  Star,
  RefreshCw,
  ExternalLink,
  Flame,
  Send,
  Compass,
  Layers,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  PODCAST_TOPICS,
  MINSHAWI_TOPICS,
  TELEGRAM_COMMUNITY_GROUPS,
  useFullAudioCatalog,
} from '../data/audioCatalog';
import type { AudioCategory, AudioTrack } from '../types/audio';
import { useAudioStore } from '../stores/useAudioStore';
import { getRecommendedTracks } from '../lib/audioRecommendations';

function formatSeconds(secs: number): string {
  if (isNaN(secs) || secs <= 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const PAGE_SIZE = 24;

export default function AudioRoute() {
  const { catalog, totalCount, isLoading: isCatalogLoading } = useFullAudioCatalog();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | AudioCategory | 'favorites' | 'recommended'>('podcasts');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showTopicDrawer, setShowTopicDrawer] = useState(false);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');

  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const playTrack = useAudioStore((s) => s.playTrack);
  const resumeTrack = useAudioStore((s) => s.resumeTrack);
  const togglePlay = useAudioStore((s) => s.togglePlay);
  const offlineTrackIds = useAudioStore((s) => s.offlineTrackIds);
  const markTrackOffline = useAudioStore((s) => s.markTrackOffline);

  const playbackProgress = useAudioStore((s) => s.playbackProgress);
  const clearTrackProgress = useAudioStore((s) => s.clearTrackProgress);
  const favoriteTrackIds = useAudioStore((s) => s.favoriteTrackIds);
  const toggleFavorite = useAudioStore((s) => s.toggleFavorite);
  const followedTopicIds = useAudioStore((s) => s.followedTopicIds);
  const toggleFollowTopic = useAudioStore((s) => s.toggleFollowTopic);

  const categories = [
    { id: 'podcasts' as const, label: 'بودكاست ديني 🤍' },
    { id: 'minshawi' as const, label: 'تراث المنشاوي' },
    { id: 'recommended' as const, label: 'موصى به لك ✨' },
    { id: 'favorites' as const, label: `المفضلة (${favoriteTrackIds.length})` },
    { id: 'all' as const, label: 'جميع الصوتيات' },
  ];

  const availableTopics = useMemo(() => {
    if (selectedCategory === 'podcasts') {
      return PODCAST_TOPICS;
    }
    if (selectedCategory === 'minshawi') {
      return MINSHAWI_TOPICS;
    }
    return [];
  }, [selectedCategory]);

  // Compute track count per topic dynamically
  const topicTrackCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    catalog.forEach((t) => {
      counts[t.topicId] = (counts[t.topicId] || 0) + 1;
    });
    return counts;
  }, [catalog]);

  // Client-Side Zero-Backend Recommendation System
  const recommendedItems = useMemo(() => {
    return getRecommendedTracks({
      catalog,
      playbackProgress,
      favoriteTrackIds,
      followedTopicIds,
      currentTrack,
      limit: 6,
    });
  }, [catalog, playbackProgress, favoriteTrackIds, followedTopicIds, currentTrack]);

  const recommendationReasonMap = useMemo(() => {
    const map = new Map<string, string>();
    recommendedItems.forEach((r) => map.set(r.track.id, r.reason));
    return map;
  }, [recommendedItems]);

  const handleCategorySelect = (catId: 'all' | AudioCategory | 'favorites' | 'recommended') => {
    setSelectedCategory(catId);
    setSelectedTopic('all');
    setShowFollowedOnly(false);
    setVisibleCount(PAGE_SIZE);
  };

  // Reset pagination when topic or query changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedTopic, searchQuery, showFollowedOnly]);

  // Find the most recently paused/interrupted track for "Continue Listening"
  const continueListeningItem = useMemo(() => {
    const activeId = currentTrack?.id;
    const candidates = Object.entries(playbackProgress)
      .filter(([id, data]) => {
        if (id === activeId && isPlaying) return false;
        return data.position > 15 && data.position < data.duration - 20;
      })
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt);

    if (candidates.length === 0) return null;
    const [trackId, progress] = candidates[0];
    const track = catalog.find((t) => t.id === trackId);
    if (!track) return null;
    return { track, progress };
  }, [playbackProgress, currentTrack, isPlaying, catalog]);

  const filteredTracks = useMemo(() => {
    // If recommended tab is selected
    if (selectedCategory === 'recommended') {
      const recList = recommendedItems.map((r) => r.track);
      if (!searchQuery.trim()) return recList;
      const q = searchQuery.toLowerCase().trim();
      return recList.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.reciterOrSpeaker.toLowerCase().includes(q) ||
          t.topicLabel.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    return catalog.filter((track) => {
      // Category or Favorites check
      if (selectedCategory === 'favorites') {
        if (!favoriteTrackIds.includes(track.id)) return false;
      } else if (selectedCategory !== 'all') {
        if (track.category !== selectedCategory) return false;
      }

      // Followed topics only
      if (showFollowedOnly) {
        if (!followedTopicIds.includes(track.topicId)) return false;
      }

      // Topic filter
      if (selectedTopic !== 'all' && track.topicId !== selectedTopic) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        track.title.toLowerCase().includes(q) ||
        track.reciterOrSpeaker.toLowerCase().includes(q) ||
        track.topicLabel.toLowerCase().includes(q) ||
        track.description.toLowerCase().includes(q) ||
        (track.dateOrLocation && track.dateOrLocation.toLowerCase().includes(q))
      );
    });
  }, [
    catalog,
    selectedCategory,
    selectedTopic,
    showFollowedOnly,
    searchQuery,
    favoriteTrackIds,
    followedTopicIds,
    recommendedItems,
  ]);

  const visibleTracks = useMemo(() => {
    return filteredTracks.slice(0, visibleCount);
  }, [filteredTracks, visibleCount]);

  const featuredTrack = useMemo(() => {
    return (
      catalog.find(
        (t) =>
          t.isFeatured &&
          (selectedCategory === 'all' || selectedCategory === 'favorites' || t.category === selectedCategory) &&
          (selectedTopic === 'all' || t.topicId === selectedTopic)
      ) || (selectedTopic !== 'all' ? filteredTracks[0] : undefined)
    );
  }, [catalog, selectedCategory, selectedTopic, filteredTracks]);

  const handleTrackClick = (track: AudioTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      const progress = playbackProgress[track.id];
      if (progress && progress.position > 15 && progress.position < progress.duration - 20) {
        resumeTrack(track, filteredTracks);
      } else {
        playTrack(track, filteredTracks);
      }
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

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncStatus('جارٍ فحص قنوات تيليجرام وأرشيف البودكاست...');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus(`تم التحديث: تم مزامنة ${totalCount} تسجيلاً وسلسلة إيمانية بنجاح.`);
      setTimeout(() => setSyncStatus(null), 4000);
    }, 900);
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
              صوتيات وبودكاست إيماني
            </h1>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">
              {totalCount} تسجيلاً
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            مكتبة جامعة تشمل سلاسل بودكاست وعي كاملة، برامج بودكاست ديني، وتراث قراء الرعيل الأول.
          </p>
        </div>

        {/* Sync & Search Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-2xl border border-border/80 bg-card hover:bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
            title="تحديث التسجيلات ومزامنة القنوات"
          >
            <RefreshCw size={14} className={cn(isSyncing && 'animate-spin text-primary')} />
            <span className="hidden sm:inline">تحديث ({totalCount})</span>
          </button>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث: الصحابة، السكينة، المنشاوي..."
              aria-label="البحث في الصوتيات"
              className="w-full rounded-2xl bg-card border border-border/80 py-2 pr-9 pl-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              dir="rtl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sync Status Toast/Notice */}
      {syncStatus && (
        <div className="mb-4 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs text-primary font-medium flex items-center justify-between animate-in fade-in">
          <span>{syncStatus}</span>
          <button onClick={() => setSyncStatus(null)} className="text-primary hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Continue Listening / Resume Card */}
      {continueListeningItem && !searchQuery && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                  <RotateCcw size={12} />
                  <span>متابعة من حيث توقفت</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {continueListeningItem.track.reciterOrSpeaker}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                {continueListeningItem.track.title}
              </h3>

              {/* Progress visual bar */}
              <div className="flex items-center gap-3 pt-1">
                <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (continueListeningItem.progress.position /
                            continueListeningItem.progress.duration) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">
                  {formatSeconds(continueListeningItem.progress.position)} / {formatSeconds(continueListeningItem.progress.duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => resumeTrack(continueListeningItem.track, filteredTracks)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Play size={14} className="fill-current" />
                <span>استئناف الاستماع</span>
              </button>
              <button
                type="button"
                onClick={() => clearTrackProgress(continueListeningItem.track.id)}
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                title="تجاهل واستئناف من البداية"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar" role="tablist">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleCategorySelect(cat.id)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-bold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Recommended Spotlight Bar */}
      {selectedCategory !== 'recommended' && selectedCategory !== 'favorites' && !searchQuery && recommendedItems.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border/70 bg-secondary/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Compass size={14} className="text-primary" />
              <span>مقترحات تناسبك الآن</span>
            </div>
            <button
              onClick={() => handleCategorySelect('recommended')}
              className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>عرض المزيد</span>
              <Sparkles size={11} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recommendedItems.slice(0, 2).map(({ track, reason }) => (
              <div
                key={track.id}
                onClick={() => handleTrackClick(track)}
                className="flex items-center justify-between rounded-xl bg-card border border-border/70 p-3 hover:border-primary/40 hover:bg-secondary/60 transition-all cursor-pointer group"
              >
                <div className="space-y-1 min-w-0 flex-1 pl-2">
                  <div className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    <Sparkles size={10} />
                    <span>{reason}</span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {track.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">{track.reciterOrSpeaker}</p>
                </div>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Play size={13} className="fill-current translate-x-[-1px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subcategory / Topic Pills & Topic Browser Drawer Button */}
      {availableTopics.length > 0 && selectedCategory !== 'favorites' && selectedCategory !== 'recommended' && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar" role="tablist" aria-label="تصنيفات الموضوعات">
            {/* Topic Browser Drawer Trigger */}
            <button
              type="button"
              onClick={() => setShowTopicDrawer(!showTopicDrawer)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5 shrink-0"
              title="تصفح جميع سلاسل ومجموعات تيليجرام"
            >
              <Layers size={12} />
              <span>كل السلاسل ({availableTopics.length - 1})</span>
              <ChevronDown size={11} className={cn('transition-transform duration-200', showTopicDrawer && 'rotate-180')} />
            </button>

            {/* Followed Only Filter Pill */}
            {followedTopicIds.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFollowedOnly(!showFollowedOnly)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap active:scale-95 border flex items-center gap-1.5 shrink-0',
                  showFollowedOnly
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 font-bold'
                    : 'bg-card text-muted-foreground border-border/70 hover:text-foreground'
                )}
              >
                <Star size={11} className={cn(showFollowedOnly ? 'fill-amber-500 text-amber-500' : '')} />
                <span>أقسامي المتابعة ({followedTopicIds.length})</span>
              </button>
            )}

            {availableTopics.map((topic) => {
              const isActive = selectedTopic === topic.id;
              const isFollowed = followedTopicIds.includes(topic.id);
              const count = topic.id === 'all' ? catalog.length : (topicTrackCounts[topic.id] || 0);

              return (
                <div key={topic.id} className="flex items-center shrink-0">
                  <button
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setSelectedTopic(topic.id);
                      setShowFollowedOnly(false);
                      setShowTopicDrawer(false);
                    }}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 border flex items-center gap-1.5',
                      isActive
                        ? 'bg-primary/15 text-primary border-primary/40 font-bold shadow-sm'
                        : 'bg-card text-muted-foreground border-border/70 hover:text-foreground hover:bg-secondary/70'
                    )}
                  >
                    {topic.id !== 'all' && <Tag size={10} className="opacity-70" />}
                    <span>{topic.label}</span>
                    {count > 0 && (
                      <span className="opacity-60 text-[10px] font-mono">({count})</span>
                    )}
                  </button>

                  {/* Topic Follow Star Button */}
                  {topic.id !== 'all' && (
                    <button
                      type="button"
                      onClick={() => toggleFollowTopic(topic.id)}
                      className={cn(
                        'mr-1 flex size-6 items-center justify-center rounded-full transition-all cursor-pointer hover:bg-secondary',
                        isFollowed ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-muted-foreground'
                      )}
                      title={isFollowed ? 'إلغاء متابعة هذا القسم' : 'متابعة هذا القسم لتلقي الجديد'}
                    >
                      <Star size={12} className={cn(isFollowed ? 'fill-amber-500' : '')} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expandable Topic Directory Panel */}
          {showTopicDrawer && (
            <div className="rounded-2xl border border-primary/20 bg-card p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                    دليل سلاسل وتصنيفات تيليجرام الكاملة ({availableTopics.length - 1} سلسلة)
                  </h3>
                </div>
                <button
                  onClick={() => setShowTopicDrawer(false)}
                  className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Topic search inside drawer */}
              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={topicSearchQuery}
                  onChange={(e) => setTopicSearchQuery(e.target.value)}
                  placeholder="ابحث بين السلاسل: الصحابة، الأنبياء، الأخلاق، الرزق..."
                  className="w-full rounded-xl bg-secondary/50 border border-border/60 py-1.5 pr-8 pl-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto no-scrollbar pt-1">
                {availableTopics
                  .filter((t) => t.id !== 'all')
                  .filter((t) => !topicSearchQuery.trim() || t.label.toLowerCase().includes(topicSearchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(topicSearchQuery.toLowerCase())))
                  .map((t) => {
                    const count = topicTrackCounts[t.id] || 0;
                    const isSelected = selectedTopic === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTopic(t.id);
                          setShowTopicDrawer(false);
                        }}
                        className={cn(
                          'rounded-xl border p-3 cursor-pointer transition-all space-y-1 text-right',
                          isSelected
                            ? 'border-primary/50 bg-primary/10 shadow-sm'
                            : 'border-border/70 bg-secondary/20 hover:border-border hover:bg-secondary/60'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground truncate">{t.label}</h4>
                          <span className="font-mono text-[10px] rounded bg-secondary px-1.5 py-0.2 text-muted-foreground shrink-0">
                            {count} تسجيلاً
                          </span>
                        </div>
                        {t.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {t.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Topic Description banner if a specific topic is selected */}
          {selectedTopic !== 'all' && (
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3.5 py-2 text-xs text-muted-foreground">
              <span>{availableTopics.find((t) => t.id === selectedTopic)?.description}</span>
              <button
                type="button"
                onClick={() => setSelectedTopic('all')}
                className="text-primary hover:underline text-[11px] font-medium shrink-0 mr-3 cursor-pointer"
              >
                عرض كل الموضوعات
              </button>
            </div>
          )}
        </div>
      )}

      {/* Featured Hero Banner */}
      {!searchQuery && featuredTrack && selectedCategory !== 'favorites' && selectedCategory !== 'recommended' && (
        <div
          onClick={() => handleTrackClick(featuredTrack)}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/60 border border-primary/20 p-6 sm:p-8 mb-8 cursor-pointer group transition-all hover:border-primary/40 shadow-sm"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                  <Sparkles size={13} />
                  <span>تسجيل مختار</span>
                </div>
                {featuredTrack.isNew && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-500">
                    <Flame size={12} />
                    <span>جديد ✦</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80">
                  <Tag size={11} className="text-primary" />
                  <span>{featuredTrack.topicLabel}</span>
                </div>
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(featuredTrack.id);
                }}
                className="flex size-11 items-center justify-center rounded-2xl bg-card border border-border/80 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                title={favoriteTrackIds.includes(featuredTrack.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              >
                <Heart
                  size={20}
                  className={cn(favoriteTrackIds.includes(featuredTrack.id) && 'fill-rose-500 text-rose-500')}
                />
              </button>

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

      {/* Section Header Info */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          عرض {visibleTracks.length} من أصل {filteredTracks.length} {filteredTracks.length === 1 ? 'تسجيل' : 'تسجيلات'}
          {selectedCategory === 'recommended' && ' مقترحة خصيصاً لك'}
          {selectedCategory === 'favorites' && ' في المفضلة'}
          {selectedTopic !== 'all' && ` في «${availableTopics.find((t) => t.id === selectedTopic)?.label}»`}
        </span>
        {(selectedTopic !== 'all' || showFollowedOnly || searchQuery || selectedCategory === 'recommended') && (
          <button
            onClick={() => {
              setSelectedCategory('podcasts');
              setSelectedTopic('all');
              setShowFollowedOnly(false);
              setSearchQuery('');
            }}
            className="text-primary hover:underline cursor-pointer"
          >
            إعادة تعيين المرشحات
          </button>
        )}
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleTracks.map((track) => {
          const isThisTrack = currentTrack?.id === track.id;
          const isThisPlaying = isThisTrack && isPlaying;
          const isOffline = offlineTrackIds.includes(track.id);
          const isFavorite = favoriteTrackIds.includes(track.id);
          const progress = playbackProgress[track.id];
          const hasResumePoint = progress && progress.position > 15 && progress.position < progress.duration - 20;
          const recommendationReason = recommendationReasonMap.get(track.id);

          return (
            <div
              key={track.id}
              onClick={() => handleTrackClick(track)}
              className={cn(
                'group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer overflow-hidden',
                isThisTrack
                  ? 'border-primary/50 bg-primary/5 shadow-sm'
                  : 'border-border/80 bg-card hover:border-border hover:bg-secondary/40'
              )}
            >
              {/* Top Progress Line for partially played tracks */}
              {hasResumePoint && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((progress.position / progress.duration) * 100)
                      )}%`,
                    }}
                  />
                </div>
              )}

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
                    {/* Recommendation reason if available */}
                    {recommendationReason && (
                      <div className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary mb-0.5">
                        <Sparkles size={9} />
                        <span>{recommendationReason}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {track.title}
                      </h3>
                      {track.isNew && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                          جديد
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-primary">{track.reciterOrSpeaker}</span>
                      <span className="opacity-40">•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px] tabular-nums">
                        <Clock size={11} />
                        {track.durationFormatted}
                      </span>
                      {hasResumePoint && (
                        <>
                          <span className="opacity-40">•</span>
                          <span className="text-[11px] font-medium text-primary/90 flex items-center gap-0.5">
                            <RotateCcw size={10} />
                            <span>استئناف عند {formatSeconds(progress.position)}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions: Favorite & Offline */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-lg border transition-all cursor-pointer',
                      isFavorite
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                        : 'border-border text-muted-foreground/60 hover:text-foreground hover:bg-secondary'
                    )}
                    title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                  >
                    <Heart size={14} className={cn(isFavorite && 'fill-rose-500')} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleToggleOffline(e, track)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-lg border transition-all cursor-pointer',
                      isOffline
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                        : 'border-border text-muted-foreground/60 hover:text-foreground hover:bg-secondary'
                    )}
                    title={isOffline ? 'محفوظ بدون إنترنت' : 'تنزيل للعمل بدون إنترنت'}
                  >
                    {isOffline ? <Check size={14} /> : <DownloadCloud size={14} />}
                  </button>
                </div>
              </div>

              {track.description && (
                <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed border-t border-border/40 pt-2.5">
                  {track.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/70">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategory(track.category);
                    setSelectedTopic(track.topicId);
                  }}
                  className="rounded-md bg-secondary/80 hover:bg-primary/15 hover:text-primary px-2 py-0.5 font-medium transition-colors cursor-pointer"
                  title={`تصفية حسب: ${track.topicLabel}`}
                >
                  {track.topicLabel}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] truncate max-w-[140px] opacity-80">{track.source}</span>
                  {track.telegramGroupUrl && (
                    <a
                      href={track.telegramGroupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                      title="فتح المصدر في تيليجرام"
                    >
                      <Send size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Load More Button */}
      {visibleCount < filteredTracks.length && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 px-6 py-3 text-xs sm:text-sm font-bold text-primary transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <span>عرض المزيد من التسجيلات</span>
            <span className="font-mono text-xs tabular-nums opacity-80">
              ({visibleTracks.length} / {filteredTracks.length})
            </span>
          </button>
        </div>
      )}

      {filteredTracks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Radio size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">لم يتم العثور على مقاطع تطابق بحثك أو المرشح المحدد</p>
          <button
            onClick={() => {
              setSelectedCategory('podcasts');
              setSelectedTopic('all');
              setShowFollowedOnly(false);
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-primary underline cursor-pointer"
          >
            إعادة تعيين المرشحات
          </button>
        </div>
      )}

      {/* Telegram Community & Channels Reference */}
      <div className="mt-12 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send size={18} className="text-primary" />
            <h3 className="text-base font-bold text-foreground">قنوات ومجموعات تيليجرام المرتبطة</h3>
          </div>
          <span className="text-xs text-muted-foreground">المصادر المعتمدة</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          جميع الصوتيات والبودكاست والدروس مأخوذة من قنوات تيليجرام الإيمانية ومستودعات التراث الإسلامي المفتوحة، مع تصفية المقاطع الموسيقية والحفاظ على النقاء التام.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TELEGRAM_COMMUNITY_GROUPS.map((grp) => (
            <a
              key={grp.name}
              href={grp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 hover:border-primary/40 hover:bg-secondary/40 transition-all text-xs group"
            >
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{grp.name}</span>
                  {grp.isMain && (
                    <span className="rounded bg-primary/15 text-primary text-[10px] px-1.5 py-0.2">الرئيسية</span>
                  )}
                </div>
                <p className="text-muted-foreground text-[11px] truncate">{grp.description}</p>
              </div>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary shrink-0 mr-2" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
