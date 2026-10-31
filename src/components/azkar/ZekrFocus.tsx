import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
  Type,
  Smartphone,
  Sparkles,
  Search,
  X,
  Layers,
  Settings2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AzkarItem } from '../../types/azkar';
import { useAzkarStore } from '../../stores/useAzkarStore';
import { stripTashkeel } from '../../hooks/useAzkar';
import { chime, vibrate } from './feedback';

export interface ZekrFocusProps {
  items: AzkarItem[];
  counts: Record<string, number>;
  index: number;
  onIndexChange: (i: number) => void;
  onIncrement: (id: string, count: number) => void;
  onReset: (id: string) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onRestartAll: () => void;
  onNextCategory?: () => void;
  nextCategoryName?: string;
  categories?: { name: string; count: number }[];
  currentCategoryName?: string;
  onSelectCategory?: (name: string) => void;
  onOpenTasbih?: () => void;
  showFavoritesOnly?: boolean;
  onToggleFavoritesOnly?: () => void;
}

const R = 44;
const C = 2 * Math.PI * R;

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function ZekrFocus({
  items,
  counts,
  index,
  onIndexChange,
  onIncrement,
  onReset,
  isFavorite,
  onToggleFavorite,
  onRestartAll,
  onNextCategory,
  nextCategoryName,
  categories = [],
  currentCategoryName = '',
  onSelectCategory,
  onOpenTasbih,
  showFavoritesOnly = false,
  onToggleFavoritesOnly,
}: ZekrFocusProps) {
  const {
    fontSize,
    setFontSize,
    showTashkeel,
    toggleTashkeel,
    hapticFeedback,
    toggleHaptic,
    soundEnabled,
    toggleSound,
    autoAdvance,
    toggleAutoAdvance,
  } = useAzkarStore();

  const [showDetails, setShowDetails] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);
  const [isPopping, setIsPopping] = useState(false);
  const [isCompletedNow, setIsCompletedNow] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const touch = useRef<{ x: number; y: number } | null>(null);
  const safeIndex = Math.min(index, Math.max(0, items.length - 1));
  const item = items[safeIndex];

  const doneCount = items.filter((i) => (counts[i.id] || 0) >= i.count).length;
  const allDone = items.length > 0 && doneCount === items.length;

  const current = item ? counts[item.id] || 0 : 0;
  const target = item ? item.count : 1;
  const finished = current >= target;
  const pct = Math.min(1, current / target);

  const go = useCallback(
    (i: number, dir?: 'next' | 'prev') => {
      setShowDetails(false);
      const targetIndex = Math.max(0, Math.min(items.length - 1, i));
      const direction = dir || (targetIndex >= safeIndex ? 'next' : 'prev');
      setSlideDirection(direction);
      onIndexChange(targetIndex);
    },
    [items.length, safeIndex, onIndexChange]
  );

  // Moves to next unfinished dhikr or next sequentially
  const advance = useCallback(() => {
    for (let k = 1; k <= items.length; k++) {
      const j = (safeIndex + k) % items.length;
      if ((counts[items[j].id] || 0) < items[j].count && j !== safeIndex) {
        return go(j, 'next');
      }
    }
    if (safeIndex < items.length - 1) {
      go(safeIndex + 1, 'next');
    }
  }, [items, safeIndex, counts, go]);

  const addRipple = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev.slice(-3), { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const count = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      if (!item || finished) return;

      if (e) {
        const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;
        addRipple(clientX, clientY, e.currentTarget as HTMLElement);
      }

      setIsPopping(true);
      window.setTimeout(() => setIsPopping(false), 240);

      const next = current + 1;
      onIncrement(item.id, next);

      if (next >= item.count) {
        setIsCompletedNow(true);
        if (hapticFeedback) vibrate([40, 60, 80]);
        if (soundEnabled) chime();
        if (autoAdvance) {
          window.setTimeout(() => {
            setIsCompletedNow(false);
            advance();
          }, 650);
        } else {
          window.setTimeout(() => setIsCompletedNow(false), 800);
        }
      } else {
        if (hapticFeedback) vibrate(22);
      }
    },
    [item, finished, current, onIncrement, hapticFeedback, soundEnabled, autoAdvance, advance]
  );

  const onCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    count(e);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = Math.abs(e.changedTouches[0].clientY - t.y);
    if (Math.abs(dx) > 55 && Math.abs(dx) > dy * 1.4) {
      // In RTL: swipe right (dx > 0) goes forward to next dhikr, swipe left goes prev
      if (dx > 0) {
        if (safeIndex < items.length - 1) go(safeIndex + 1, 'next');
      } else {
        if (safeIndex > 0) go(safeIndex - 1, 'prev');
      }
    }
  };

  const share = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item) return;
    const text = `${item.zekr}\n\n${item.description ? `الفضل: ${item.description}\n` : ''}${item.reference ? `المصدر: ${item.reference}` : ''}`;
    try {
      if (navigator.share) await navigator.share({ title: item.category, text });
      else await navigator.clipboard?.writeText(text);
    } catch {}
  };

  const long = item ? item.zekr.length > 240 : false;
  const sizeClass =
    fontSize === 'sm'
      ? long
        ? 'text-lg sm:text-xl'
        : 'text-xl sm:text-2xl'
      : fontSize === 'base'
      ? long
        ? 'text-xl sm:text-2xl'
        : 'text-2xl sm:text-3xl'
      : fontSize === 'lg'
      ? long
        ? 'text-2xl sm:text-3xl'
        : 'text-3xl sm:text-4xl'
      : long
      ? 'text-3xl sm:text-4xl'
      : 'text-4xl sm:text-5xl';

  const filteredCategories = categories.filter((c) =>
    stripTashkeel(c.name).includes(stripTashkeel(categorySearch))
  );

  // All completed view
  if (allDone) {
    return (
      <div
        className="flex h-full min-h-[26rem] flex-col items-center justify-center gap-5 px-6 text-center animate-in fade-in duration-300"
        dir="rtl"
      >
        <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary animate-celebrate">
          <Check size={38} strokeWidth={3} className="animate-float" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-arabic-quran text-2xl sm:text-3xl font-bold text-foreground">تَقَبَّلَ اللَّهُ مِنْكَ</h2>
          <p className="text-sm text-muted-foreground">
            أتممت جميع أذكار {currentCategoryName ? `(${currentCategoryName})` : 'هذا القسم'} بنجاح ({items.length} ذكراً)
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2 pt-1">
          {onNextCategory && (
            <button
              onClick={onNextCategory}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <span>{nextCategoryName ? `الانتقال إلى ${nextCategoryName}` : 'القسم التالي'}</span>
              <ChevronLeft size={18} />
            </button>
          )}
          <button
            onClick={onRestartAll}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-sm font-bold text-foreground transition-all duration-200 hover:bg-secondary/80 active:scale-95 cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>إعادة قراءة هذا القسم</span>
          </button>
          {onSelectCategory && (
            <button
              onClick={() => setShowCategorySheet(true)}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Layers size={15} />
              <span>اختيار قسم آخر</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center" dir="rtl">
        <p className="text-muted-foreground">لا توجد أذكار لعرضها</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden select-none" dir="rtl">
      {/* Top Header Bar - sleek and compact */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-1.5 pb-1">
        {/* Category button (tap to open switcher bottom sheet) */}
        <button
          type="button"
          onClick={() => setShowCategorySheet(true)}
          className="flex items-center gap-1.5 rounded-full bg-secondary/80 hover:bg-secondary px-3 py-1 text-xs font-bold text-foreground transition-all active:scale-95 cursor-pointer border border-border/40 max-w-[190px] sm:max-w-xs truncate"
          aria-label="اختيار قسم الأذكار"
        >
          <span className="truncate">{showFavoritesOnly ? 'المفضلة' : currentCategoryName || item.category}</span>
          <ChevronDown size={13} className="shrink-0 text-muted-foreground" />
        </button>

        {/* Counter Badge */}
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
          <span>{safeIndex + 1}</span>
          <span className="opacity-50">/</span>
          <span>{items.length}</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-0.5">
          {onOpenTasbih && (
            <button
              type="button"
              onClick={onOpenTasbih}
              aria-label="السبحة الإلكترونية"
              title="السبحة الإلكترونية"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90 cursor-pointer"
            >
              <Sparkles size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت الإتمام'}
            title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت الإتمام'}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90 cursor-pointer"
          >
            {soundEnabled ? <Volume2 size={16} className="text-primary" /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(item.id)}
            aria-pressed={isFavorite(item.id)}
            aria-label="حفظ في المفضلة"
            title="حفظ في المفضلة"
            className={cn(
              'flex size-8 items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer',
              isFavorite(item.id) ? 'text-amber-500 bg-amber-500/15' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <Bookmark size={16} fill={isFavorite(item.id) ? 'currentColor' : 'none'} className={isFavorite(item.id) ? 'animate-celebrate' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsSheet(true)}
            aria-label="إعدادات القراءة والخط"
            title="إعدادات القراءة والخط"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90 cursor-pointer"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      {/* Segment progress bar at the top - thin line */}
      <div className="shrink-0 px-3 py-0.5" role="tablist" aria-label="أذكار هذا القسم">
        <div className="flex gap-1 overflow-x-hidden">
          {items.map((it, i) => {
            const isDone = (counts[it.id] || 0) >= it.count;
            const isCurrent = i === safeIndex;
            return (
              <button
                key={it.id}
                role="tab"
                aria-selected={isCurrent}
                aria-label={`الذكر ${i + 1}${isDone ? ' (مكتمل)' : ''}`}
                onClick={() => go(i)}
                className="group flex h-3 flex-1 items-center cursor-pointer"
              >
                <span
                  className={cn(
                    'h-1 w-full rounded-full transition-all duration-300',
                    isDone
                      ? 'bg-primary'
                      : isCurrent
                      ? 'bg-foreground/80'
                      : 'bg-secondary'
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Thekr Reading Area - Takes MAXIMUM room */}
      <div
        key={item.id}
        onClick={onCardClick}
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={onTouchEnd}
        className={cn(
          'relative flex flex-1 min-h-0 flex-col items-center justify-center px-4 py-1 sm:px-6 cursor-pointer overflow-hidden transition-all duration-200',
          slideDirection === 'next'
            ? 'animate-slide-in-right'
            : slideDirection === 'prev'
            ? 'animate-slide-in-left'
            : 'animate-in fade-in duration-200'
        )}
      >
        {/* Ripple effects */}
        {ripples.map((r) => (
          <span
            key={r.id}
            className="pointer-events-none absolute rounded-full bg-primary/20 animate-ripple z-0"
            style={{
              left: r.x - 30,
              top: r.y - 30,
              width: 60,
              height: 60,
            }}
          />
        ))}

        {/* Scrollable container for the text - spacious & centered */}
        <div className="relative z-10 flex w-full max-w-2xl flex-1 flex-col items-center justify-center overflow-y-auto overscroll-contain px-2 sm:px-6 py-2 text-center my-auto">
          <p
            className={cn(
              'font-arabic-quran whitespace-pre-line text-foreground select-none leading-[2.1] sm:leading-[2.25] tracking-normal transition-all duration-150',
              sizeClass
            )}
            lang="ar"
          >
            {showTashkeel ? item.zekr : stripTashkeel(item.zekr)}
          </p>

          {/* Collapsible Fadl & Reference */}
          {(item.description || item.reference) && (
            <div className="mt-2.5 w-full max-w-md pt-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                aria-expanded={showDetails}
                className="mx-auto flex h-7 items-center gap-1.5 rounded-full bg-secondary/60 hover:bg-secondary px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <Info size={12} className="text-primary" />
                <span>الفضل والمصدر</span>
                <ChevronDown
                  size={12}
                  className={cn('transition-transform duration-200', showDetails && 'rotate-180')}
                />
              </button>

              {showDetails && (
                <div className="mt-1.5 space-y-1 rounded-2xl bg-secondary/80 p-3 text-xs leading-5 text-foreground/90 text-right animate-in fade-in zoom-in-95 duration-200 border border-border/40">
                  {item.description && (
                    <p>
                      <span className="font-bold text-primary">الفضل: </span>
                      {item.description}
                    </p>
                  )}
                  {item.reference && (
                    <p className="text-muted-foreground text-[11px] pt-1 border-t border-border/40">
                      <span className="font-semibold text-foreground">المصدر: </span>
                      {item.reference}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick share button under text */}
          <button
            type="button"
            onClick={share}
            aria-label="مشاركة الذكر"
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer py-0.5 px-2 rounded-lg"
          >
            <Share2 size={11} />
            <span>مشاركة</span>
          </button>
        </div>
      </div>

      {/* Compact Tactile Counter & Bottom Navigation */}
      <div className="shrink-0 flex flex-col items-center justify-center px-4 pt-1 pb-2 sm:pb-3 gap-0.5">
        <div className="flex w-full max-w-xs items-center justify-between gap-3">
          {/* Previous Dhikr Button */}
          <button
            type="button"
            onClick={() => go(safeIndex - 1, 'prev')}
            disabled={safeIndex === 0}
            aria-label="الذكر السابق"
            className="flex size-10 sm:size-11 items-center justify-center rounded-xl bg-secondary text-foreground disabled:opacity-20 transition-all duration-150 active:scale-90 cursor-pointer hover:bg-secondary/80"
          >
            <ChevronRight size={20} />
          </button>

          {/* Compact Counter Button */}
          <div className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={count}
              aria-label={finished ? 'اكتمل الذكر' : `عدّ الذكر، ${current} من ${item.count}`}
              className="relative flex size-[72px] sm:size-[78px] items-center justify-center rounded-full bg-card border border-border/60 cursor-pointer transition-transform duration-150 active:scale-90 tap-press select-none"
            >
              {/* SVG Circular Progress Ring - clean without cut-off glow */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90 pointer-events-none" aria-hidden>
                <circle cx="50" cy="50" r={R} fill="none" strokeWidth="4.5" className="stroke-secondary/60" />
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  className="stroke-primary"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - pct)}
                  style={{
                    transition: 'stroke-dashoffset 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </svg>

              {/* Inside Counter Content */}
              {finished ? (
                <div className="flex flex-col items-center justify-center animate-celebrate text-primary">
                  <Check size={26} strokeWidth={3} />
                  <span className="text-[10px] font-bold mt-0.5">مكتمل</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center leading-none">
                  <span
                    className={cn(
                      'text-2xl sm:text-3xl font-black font-sans tabular-nums text-foreground select-none transition-transform',
                      isPopping && 'animate-counter-pop text-primary'
                    )}
                  >
                    {item.count - current}
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold text-muted-foreground select-none">
                    من {item.count}
                  </span>
                </div>
              )}
            </button>

            {/* Sub-label under counter: Reset or Tap hint */}
            <div className="h-5 flex items-center justify-center">
              {current > 0 ? (
                <button
                  type="button"
                  onClick={() => onReset(item.id)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95 px-2 py-0.5 rounded-full hover:bg-secondary"
                >
                  <RotateCcw size={10} />
                  <span>تصفير</span>
                </button>
              ) : (
                <span className="text-[10px] text-muted-foreground/60">
                  {finished ? '' : 'اضغط للعدّ'}
                </span>
              )}
            </div>
          </div>

          {/* Next Dhikr Button */}
          <button
            type="button"
            onClick={() => go(safeIndex + 1, 'next')}
            disabled={safeIndex >= items.length - 1}
            aria-label="الذكر التالي"
            className="flex size-10 sm:size-11 items-center justify-center rounded-xl bg-secondary text-foreground disabled:opacity-20 transition-all duration-150 active:scale-90 cursor-pointer hover:bg-secondary/80"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {/* Category Bottom Sheet Modal for Mobile */}
      {showCategorySheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowCategorySheet(false)}
        >
          <div
            className="flex max-h-[82dvh] w-full flex-col rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Sheet Handle */}
            <div className="mx-auto h-1.5 w-12 rounded-full bg-border/80 mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-primary" />
                <h3 className="text-base font-bold text-foreground">أقسام الأذكار</h3>
              </div>
              <button
                onClick={() => setShowCategorySheet(false)}
                className="flex size-8 items-center justify-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Category Search Input */}
            <div className="relative mt-3">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="ابحث عن قسم..."
                className="h-10 w-full rounded-xl bg-secondary/80 pr-9 pl-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category List */}
            <div className="mt-3 overflow-y-auto space-y-1.5 pr-1 flex-1">
              {filteredCategories.map((cat) => {
                const isSelected = currentCategoryName === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat.name);
                      setShowCategorySheet(false);
                      setCategorySearch('');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-4 py-3 text-right text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98]',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary/50 hover:bg-secondary text-foreground'
                    )}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={cn(
                        'text-xs rounded-full px-2 py-0.5',
                        isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {cat.count} ذكر
                    </span>
                  </button>
                );
              })}
              {filteredCategories.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">لا يوجد قسم يطابق البحث</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings & Font Size Sheet */}
      {showSettingsSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowSettingsSheet(false)}
        >
          <div
            className="flex w-full flex-col rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-250 max-h-[80dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-border/80 mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-primary" />
                <h3 className="text-base font-bold text-foreground">إعدادات القراءة والتجربة</h3>
              </div>
              <button
                onClick={() => setShowSettingsSheet(false)}
                className="flex size-8 items-center justify-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Font Size */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Type size={14} /> حجم الخط
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      className={cn(
                        'h-11 rounded-xl text-sm font-bold uppercase transition-all duration-150 cursor-pointer active:scale-95 border',
                        fontSize === sz
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-secondary/60 text-muted-foreground border-border hover:text-foreground'
                      )}
                    >
                      {sz === 'sm' ? 'صغير' : sz === 'base' ? 'متوسط' : sz === 'lg' ? 'كبير' : 'كبير جداً'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={toggleTashkeel}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl p-3.5 text-sm font-semibold transition-all cursor-pointer border',
                    showTashkeel
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/40 text-foreground'
                  )}
                >
                  <span>إظهار التشكيل والحركات</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary">
                    {showTashkeel ? 'مفعل' : 'معطل'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleHaptic}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl p-3.5 text-sm font-semibold transition-all cursor-pointer border',
                    hapticFeedback
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/40 text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Smartphone size={16} />
                    <span>الاهتزاز اللمسي مع كل عدّة</span>
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary">
                    {hapticFeedback ? 'مفعل' : 'معطل'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleAutoAdvance}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl p-3.5 text-sm font-semibold transition-all cursor-pointer border',
                    autoAdvance
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/40 text-foreground'
                  )}
                >
                  <span>الانتقال التلقائي عند اكتمال العدد</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary">
                    {autoAdvance ? 'مفعل' : 'معطل'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
