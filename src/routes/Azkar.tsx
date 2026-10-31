import { useState, useMemo, useCallback, useEffect } from 'react';
import { Sparkles, Search, Bookmark, RotateCcw, BookOpen, Settings2, Smartphone, Volume2, VolumeX, Type, Sun, X, GalleryHorizontal, LayoutList } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  useAllAzkar,
  useAzkarCategories,
  useTodayAzkarProgress,
  useAzkarFavorites,
  useContextualAzkarCategory,
  stripTashkeel,
} from '../hooks/useAzkar';
import { useAzkarStore } from '../stores/useAzkarStore';
import { ZekrCard } from '../components/azkar/ZekrCard';
import { ZekrFocus } from '../components/azkar/ZekrFocus';
import { TasbihCounterModal } from '../components/azkar/TasbihCounterModal';
import type { AzkarItem } from '../types/azkar';

export default function AzkarRoute() {
  const allAzkar = useAllAzkar();
  const categories = useAzkarCategories();
  const { progress, updateCount, resetCategory } = useTodayAzkarProgress();
  const { favoriteIds, isFavorite, toggleFavorite } = useAzkarFavorites();
  const contextual = useContextualAzkarCategory();

  const {
    selectedCategory,
    setSelectedCategory,
    fontSize,
    setFontSize,
    hapticFeedback,
    toggleHaptic,
    soundEnabled,
    toggleSound,
    autoAdvance,
    toggleAutoAdvance,
    showTashkeel,
    toggleTashkeel,
  } = useAzkarStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On desktop, user can toggle focus / list mode (saved in localStorage).
  // On phone, it is ALWAYS the dedicated full-screen focus mode.
  const [desktopViewMode, setDesktopViewMode] = useState<'focus' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('azkar_view_v1');
      if (saved === 'focus' || saved === 'list') return saved;
    } catch {}
    return 'focus';
  });

  const changeDesktopView = (m: 'focus' | 'list') => {
    setDesktopViewMode(m);
    try { localStorage.setItem('azkar_view_v1', m); } catch {}
  };

  const effectiveViewMode = isMobile ? 'focus' : desktopViewMode;
  const [focusIndex, setFocusIndex] = useState(0);

  const displayedAzkar = useMemo(() => {
    let list: AzkarItem[] = allAzkar;

    if (showFavoritesOnly) {
      return list.filter((item) => favoriteIds.includes(item.id));
    }

    if (searchQuery.trim()) {
      const q = stripTashkeel(searchQuery);
      return list.filter((item) => {
        const text = stripTashkeel(item.zekr);
        const cat = stripTashkeel(item.category);
        const desc = stripTashkeel(item.description);
        const ref = stripTashkeel(item.reference);
        return text.includes(q) || cat.includes(q) || desc.includes(q) || ref.includes(q);
      });
    }

    if (selectedCategory) {
      return list.filter((item) => item.category === selectedCategory);
    }

    return list.filter((item) => item.category === contextual.category);
  }, [allAzkar, selectedCategory, searchQuery, showFavoritesOnly, favoriteIds, contextual.category]);

  const activeCategoryTitle = showFavoritesOnly
    ? 'الأذكار المفضلة'
    : searchQuery
    ? `نتائج البحث عن "${searchQuery}"`
    : selectedCategory || contextual.category;

  useEffect(() => {
    setFocusIndex(0);
  }, [activeCategoryTitle]);

  const currentCategoryName = selectedCategory || contextual.category;
  const nextCategory = useMemo(() => {
    const i = categories.findIndex((c) => c.name === currentCategoryName);
    return i >= 0 && i < categories.length - 1 ? categories[i + 1].name : null;
  }, [categories, currentCategoryName]);

  const categoryStats = useMemo(() => {
    if (!displayedAzkar.length) return { completed: 0, total: 0, percent: 0 };
    let completed = 0;
    for (const item of displayedAzkar) {
      const done = progress.counts[item.id] || 0;
      if (done >= item.count) completed++;
    }
    const percent = Math.round((completed / displayedAzkar.length) * 100);
    return { completed, total: displayedAzkar.length, percent };
  }, [displayedAzkar, progress.counts]);

  const handleIncrement = useCallback(
    (id: string, count: number) => {
      const item = allAzkar.find((i) => i.id === id);
      const cat = item?.category;
      const catItems = allAzkar.filter((i) => i.category === cat);
      let allDone = true;
      for (const ci of catItems) {
        const current = ci.id === id ? count : progress.counts[ci.id] || 0;
        if (current < ci.count) {
          allDone = false;
          break;
        }
      }
      updateCount({ zekrId: id, count, categoryName: cat, categoryCompleted: allDone });
    },
    [allAzkar, progress.counts, updateCount]
  );

  const handleResetZekr = useCallback(
    (id: string) => {
      updateCount({ zekrId: id, count: 0 });
    },
    [updateCount]
  );

  const handleResetCurrentCategory = useCallback(() => {
    const ids = displayedAzkar.map((i) => i.id);
    resetCategory(ids);
  }, [displayedAzkar, resetCategory]);

  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-3.5rem)] flex flex-col bg-background overflow-hidden text-foreground">
        <ZekrFocus
          items={displayedAzkar}
          counts={progress.counts}
          index={focusIndex}
          onIndexChange={setFocusIndex}
          onIncrement={handleIncrement}
          onReset={handleResetZekr}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          onRestartAll={() => {
            handleResetCurrentCategory();
            setFocusIndex(0);
          }}
          onNextCategory={nextCategory && !searchQuery && !showFavoritesOnly ? () => setSelectedCategory(nextCategory) : undefined}
          nextCategoryName={nextCategory || undefined}
          categories={categories}
          currentCategoryName={activeCategoryTitle}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setShowFavoritesOnly(false);
            setSearchQuery('');
          }}
          onOpenTasbih={() => setIsTasbihOpen(true)}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesOnly={() => setShowFavoritesOnly((v) => !v)}
        />
        <TasbihCounterModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
      </div>
    );
  }

  return (
    <div className={cn('bg-background text-foreground', desktopViewMode === 'list' ? 'min-h-dvh pb-24 md:pb-10' : 'pb-4')}>
      <div className={cn('z-20 bg-background', desktopViewMode === 'list' && 'sticky top-14')}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
              <Sun size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight sm:text-lg">الأذكار</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => changeDesktopView(desktopViewMode === 'focus' ? 'list' : 'focus')}
              aria-label={desktopViewMode === 'focus' ? 'عرض القائمة' : 'عرض ذكر واحد'}
              title={desktopViewMode === 'focus' ? 'عرض القائمة' : 'عرض ذكر واحد'}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-150 hover:bg-secondary hover:text-foreground cursor-pointer active:scale-90"
            >
              {desktopViewMode === 'focus' ? <LayoutList size={19} /> : <GalleryHorizontal size={19} />}
            </button>
            <button
              onClick={() => { setShowSearch((v) => !v); if (showSearch) setSearchQuery(''); }}
              aria-label="بحث"
              aria-pressed={showSearch || !!searchQuery}
              className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer active:scale-90', showSearch || searchQuery ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}
            >
              <Search size={19} />
            </button>
            <button
              onClick={() => setIsTasbihOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground transition-all duration-150 hover:brightness-105 active:scale-95 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">سبحة إلكترونية</span>
              <span className="sm:hidden">سبحة</span>
            </button>

            <button
              onClick={() => setShowFavoritesOnly((v) => !v)}
              aria-pressed={showFavoritesOnly}
              aria-label="الأذكار المفضلة"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 active:scale-90 cursor-pointer',
                showFavoritesOnly
                  ? 'border-amber-500/40 bg-amber-500/20 text-amber-500'
                  : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              title="الأذكار المفضلة"
            >
              <Bookmark size={18} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={() => setShowPreferences((v) => !v)}
              aria-pressed={showPreferences}
              aria-label="إعدادات القراءة والخط"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 active:scale-90 cursor-pointer',
                showPreferences
                  ? 'border-primary/40 bg-primary/20 text-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              title="إعدادات القراءة والخط"
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>

        {showPreferences && (
          <div className="bg-card/60 px-4 py-3 sm:px-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Type size={14} /> حجم الخط:
                </span>
                {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    aria-pressed={fontSize === sz}
                    className={cn(
                      'rounded-lg border px-2.5 py-1 tabular-nums font-medium uppercase transition-all duration-150 cursor-pointer active:scale-95',
                      fontSize === sz
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleHaptic}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-2.5 py-1 transition-all duration-150 cursor-pointer active:scale-95',
                    hapticFeedback ? 'border-primary/40 bg-primary/10 font-medium text-primary' : 'border-border text-muted-foreground'
                  )}
                >
                  <Smartphone size={13} />
                  <span>الاهتزاز</span>
                </button>

                <button
                  onClick={toggleSound}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-2.5 py-1 transition-all duration-150 cursor-pointer active:scale-95',
                    soundEnabled ? 'border-primary/40 bg-primary/10 font-medium text-primary' : 'border-border text-muted-foreground'
                  )}
                >
                  {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  <span>الصوت</span>
                </button>

                <button
                  onClick={toggleAutoAdvance}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-2.5 py-1 transition-all duration-150 cursor-pointer active:scale-95',
                    autoAdvance ? 'border-primary/40 bg-primary/10 font-medium text-primary' : 'border-border text-muted-foreground'
                  )}
                >
                  <span>الانتقال التلقائي</span>
                </button>

                <button
                  onClick={toggleTashkeel}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-2.5 py-1 transition-all duration-150 cursor-pointer active:scale-95',
                    showTashkeel ? 'border-primary/40 bg-primary/10 font-medium text-primary' : 'border-border text-muted-foreground'
                  )}
                >
                  <span>إظهار التشكيل</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {desktopViewMode === 'focus' ? (
        <div className="mx-auto flex h-[calc(100dvh-7.5rem)] min-h-[32rem] max-w-3xl flex-col gap-3 px-4 pb-3 pt-1 sm:px-6">
          {(showSearch || searchQuery) && (
            <div className="relative shrink-0 animate-in fade-in duration-200">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (showFavoritesOnly) setShowFavoritesOnly(false); }}
                placeholder="ابحث: آية الكرسي، سيد الاستغفار، السفر"
                aria-label="البحث في الأذكار"
                className="h-12 w-full rounded-xl bg-card pr-11 pl-10 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring border border-border/60"
                dir="rtl"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} aria-label="مسح البحث" className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary cursor-pointer">
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {!searchQuery && !showFavoritesOnly ? (
            <div className="no-scrollbar -mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="أقسام الأذكار">
              {categories.map((cat) => {
                const isSelected = currentCategoryName === cat.name;
                const isContext = contextual.category === cat.name;
                return (
                  <button
                    key={cat.name}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(cat.name)}
                    ref={(el) => { if (el && isSelected) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }}
                    className={cn(
                      'flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-[14px] font-semibold transition-all duration-150 cursor-pointer active:scale-95',
                      isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                    )}
                  >
                    {isContext && <span className={cn('size-1.5 shrink-0 rounded-full', isSelected ? 'bg-primary-foreground' : 'bg-primary')} />}
                    <span lang="ar">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex shrink-0 items-center justify-between text-[14px]">
              <span className="font-bold" lang="ar">{activeCategoryTitle}</span>
              <span className="text-muted-foreground">{displayedAzkar.length} ذكر</span>
            </div>
          )}

          <div className="min-h-0 flex-1 rounded-2xl bg-card/50 border border-border/50 p-2 sm:p-4 overflow-hidden">
            {displayedAzkar.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-card text-center" dir="rtl">
                <BookOpen size={36} className="text-muted-foreground/60" />
                <p className="text-[15px] text-muted-foreground" lang="ar">
                  {showFavoritesOnly ? 'لم تحفظ أي أذكار في المفضلة بعد.' : 'لا توجد أذكار تطابق هذا البحث.'}
                </p>
              </div>
            ) : (
              <ZekrFocus
                items={displayedAzkar}
                counts={progress.counts}
                index={focusIndex}
                onIndexChange={setFocusIndex}
                onIncrement={handleIncrement}
                onReset={handleResetZekr}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onRestartAll={() => { handleResetCurrentCategory(); setFocusIndex(0); }}
                onNextCategory={nextCategory && !searchQuery && !showFavoritesOnly ? () => setSelectedCategory(nextCategory) : undefined}
                nextCategoryName={nextCategory || undefined}
                categories={categories}
                currentCategoryName={activeCategoryTitle}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setShowFavoritesOnly(false);
                  setSearchQuery('');
                }}
                onOpenTasbih={() => setIsTasbihOpen(true)}
                showFavoritesOnly={showFavoritesOnly}
                onToggleFavoritesOnly={() => setShowFavoritesOnly((v) => !v)}
              />
            )}
          </div>
        </div>
      ) : (
      <>
      <div className="mx-auto max-w-6xl space-y-6 px-4 pt-6 sm:px-6">
        {!searchQuery && !showFavoritesOnly && (
          <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-3xl bg-primary/10 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[13px] font-semibold text-primary-foreground">{contextual.badge}</span>
                <span className="text-[13px] text-muted-foreground">{contextual.reason}</span>
              </div>
              <h2 className="font-arabic-quran text-xl font-bold text-foreground sm:text-2xl" lang="ar" dir="rtl">
                {contextual.category}
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setSelectedCategory(contextual.category)}
                className={cn(
                  'rounded-xl px-4 py-2 text-[13px] font-semibold  transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  selectedCategory === contextual.category || !selectedCategory
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                )}
              >
                {selectedCategory === contextual.category || !selectedCategory ? 'قيد القراءة الآن' : 'عرض الآن'}
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (showFavoritesOnly) setShowFavoritesOnly(false);
            }}
            placeholder="ابحث بالاسم أو النص (مثال: آية الكرسي، سيد الاستغفار، السفر)..."
            aria-label="البحث في الأذكار"
            className="w-full rounded-xl bg-card py-3 pr-11 pl-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            dir="rtl"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
              className="absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {!searchQuery && !showFavoritesOnly && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px] text-muted-foreground">
              <span className="font-medium">التصنيفات الشائعة</span>
              <span>{categories.length} تصنيف</span>
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2 scroll-smooth">
              {categories.map((cat) => {
                const isSelected = (selectedCategory || contextual.category) === cat.name;
                const isContext = contextual.category === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      isSelected
                        ? 'border-primary bg-primary font-semibold text-primary-foreground '
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    {isContext && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />}
                    <span lang="ar" dir="rtl">{cat.name}</span>
                    <span className={cn('rounded-full px-1.5 py-0.5 tabular-nums text-xs', isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 pb-1 pt-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-arabic-quran flex items-center gap-2 text-xl font-bold text-foreground">
              <span lang="ar" dir="rtl">{activeCategoryTitle}</span>
              <span className="font-sans text-[13px] font-normal text-muted-foreground">({displayedAzkar.length} ذكر)</span>
            </h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              مكتمل اليوم: {categoryStats.completed} من {categoryStats.total} ({categoryStats.percent}%)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {categoryStats.completed > 0 && (
              <button
                onClick={handleResetCurrentCategory}
                className="flex items-center gap-1 rounded-lg text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="تصفير تكرار هذا القسم اليوم"
              >
                <RotateCcw size={13} />
                <span>إعادة تصفير القسم</span>
              </button>
            )}

            <div
              className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-secondary sm:w-36"
              role="progressbar"
              aria-valuenow={categoryStats.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`نسبة الإتمام ${categoryStats.percent}%`}
            >
              <div className="h-full rounded-full bg-primary transition duration-300" style={{ width: `${categoryStats.percent}%` }} />
            </div>
          </div>
        </div>

        {displayedAzkar.length === 0 ? (
          <div className="space-y-3 rounded-2xl bg-card/40 py-16 text-center" dir="rtl">
            <BookOpen size={36} className="mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium text-muted-foreground" lang="ar">
              {showFavoritesOnly ? 'لم تقم بحفظ أي أذكار في المفضلة بعد.' : 'لا توجد أذكار تطابق هذا البحث.'}
            </p>
            {showFavoritesOnly && (
              <p className="text-[13px] text-muted-foreground/80" lang="ar">
                انقر على أيقونة الإشارة المرجعية بجانب أي ذكر لإضافته هنا.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-5 animate-in fade-in duration-300">
            {displayedAzkar.map((item, index) => (
              <ZekrCard
                key={item.id}
                item={item}
                index={index}
                total={displayedAzkar.length}
                completedCount={progress.counts[item.id] || 0}
                isFavorite={isFavorite(item.id)}
                onIncrement={handleIncrement}
                onReset={handleResetZekr}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      </>
      )}

      <TasbihCounterModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
    </div>
  );
}
