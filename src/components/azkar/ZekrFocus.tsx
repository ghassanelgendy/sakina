import React, { useRef, useState } from 'react';
import { Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, Info, RotateCcw, Share2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AzkarItem } from '../../types/azkar';
import { useAzkarStore } from '../../stores/useAzkarStore';
import { stripTashkeel } from '../../hooks/useAzkar';
import { chime, vibrate } from './feedback';

interface ZekrFocusProps {
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
}

const R = 46;
const C = 2 * Math.PI * R;

/** One dhikr at a time, built for a thumb: big text, a big counter at the bottom, swipe to move. */
export function ZekrFocus({
  items, counts, index, onIndexChange, onIncrement, onReset, isFavorite, onToggleFavorite, onRestartAll, onNextCategory, nextCategoryName,
}: ZekrFocusProps) {
  const { fontSize, showTashkeel, hapticFeedback, soundEnabled, autoAdvance } = useAzkarStore();
  const [showDetails, setShowDetails] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const safeIndex = Math.min(index, Math.max(0, items.length - 1));
  const item = items[safeIndex];
  const done = items.filter((i) => (counts[i.id] || 0) >= i.count).length;
  const allDone = items.length > 0 && done === items.length;

  if (!item) return null;

  const current = counts[item.id] || 0;
  const finished = current >= item.count;
  const pct = Math.min(1, current / item.count);

  const go = (i: number) => {
    setShowDetails(false);
    onIndexChange(Math.max(0, Math.min(items.length - 1, i)));
  };

  // Moves to the next dhikr that still needs counting; falls back to simply the next one.
  const advance = () => {
    for (let k = 1; k <= items.length; k++) {
      const j = (safeIndex + k) % items.length;
      if ((counts[items[j].id] || 0) < items[j].count && j !== safeIndex) return go(j);
    }
    if (safeIndex < items.length - 1) go(safeIndex + 1);
  };

  const count = () => {
    if (finished) return;
    const next = current + 1;
    onIncrement(item.id, next);
    if (next >= item.count) {
      if (hapticFeedback) vibrate([30, 50, 70]);
      if (soundEnabled) chime();
      if (autoAdvance) window.setTimeout(advance, 650);
    } else if (hapticFeedback) {
      vibrate(18);
    }
  };

  const onCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    count();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = Math.abs(e.changedTouches[0].clientY - t.y);
    if (Math.abs(dx) > 60 && Math.abs(dx) > dy * 1.5) {
      // Same direction as the Quran reader: swipe right = next, left = previous
      go(dx > 0 ? safeIndex + 1 : safeIndex - 1);
    }
  };

  const share = async () => {
    const text = `${item.zekr}\n\n${item.description ? `الفضل: ${item.description}\n` : ''}${item.reference ? `المصدر: ${item.reference}` : ''}`;
    try {
      if (navigator.share) await navigator.share({ title: item.category, text });
      else await navigator.clipboard?.writeText(text);
    } catch {}
  };

  const long = item.zekr.length > 260;
  const sizeClass =
    fontSize === 'sm' ? (long ? 'text-lg' : 'text-xl')
    : fontSize === 'base' ? (long ? 'text-xl' : 'text-2xl')
    : fontSize === 'lg' ? (long ? 'text-2xl' : 'text-3xl')
    : long ? 'text-3xl' : 'text-4xl';

  if (allDone) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 rounded-2xl bg-card px-6 text-center animate-in fade-in duration-300" dir="rtl">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Check size={40} strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
          <p className="font-arabic-quran text-3xl">تَقَبَّلَ اللَّهُ مِنْكَ</p>
          <p className="text-[15px] text-muted-foreground">أتممت {items.length} من الأذكار في هذا القسم</p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          {onNextCategory && (
            <button onClick={onNextCategory} className="h-12 rounded-xl bg-primary px-5 text-[15px] font-bold text-primary-foreground cursor-pointer">
              {nextCategoryName ? `القسم التالي: ${nextCategoryName}` : 'القسم التالي'}
            </button>
          )}
          <button onClick={onRestartAll} className="h-12 rounded-xl bg-secondary px-5 text-[15px] font-bold text-foreground cursor-pointer">
            إعادة هذا القسم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3" dir="rtl">
      {/* Segments: one per dhikr, tap to jump */}
      <div className="flex gap-1" role="tablist" aria-label="أذكار هذا القسم">
        {items.map((it, i) => {
          const d = (counts[it.id] || 0) >= it.count;
          return (
            <button
              key={it.id}
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`الذكر ${i + 1}${d ? ' (مكتمل)' : ''}`}
              onClick={() => go(i)}
              className="group flex h-6 flex-1 items-center cursor-pointer"
            >
              <span className={cn('h-1.5 w-full rounded-full transition-colors duration-300', d ? 'bg-primary' : i === safeIndex ? 'bg-foreground/60' : 'bg-secondary')} />
            </button>
          );
        })}
      </div>

      <div
        key={item.id}
        onClick={onCardClick}
        onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={onTouchEnd}
        className="relative flex min-h-0 flex-1 cursor-pointer select-none flex-col rounded-2xl bg-card animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <div className="flex items-center justify-between px-4 pt-3 text-[13px] text-muted-foreground">
          <span className="tabular-nums">{safeIndex + 1} من {items.length}</span>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onToggleFavorite(item.id)}
              aria-pressed={isFavorite(item.id)}
              aria-label="حفظ في المفضلة"
              className={cn('flex size-11 items-center justify-center rounded-lg cursor-pointer', isFavorite(item.id) ? 'text-amber-500' : 'hover:text-foreground')}
            >
              <Bookmark size={19} fill={isFavorite(item.id) ? 'currentColor' : 'none'} />
            </button>
            <button type="button" onClick={share} aria-label="مشاركة الذكر" className="flex size-11 items-center justify-center rounded-lg hover:text-foreground cursor-pointer">
              <Share2 size={19} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
          <p className={cn('font-arabic-quran whitespace-pre-line text-center text-foreground leading-[2.15]', sizeClass)} lang="ar">
            {showTashkeel ? item.zekr : stripTashkeel(item.zekr)}
          </p>

          {(item.description || item.reference) && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                aria-expanded={showDetails}
                className="mx-auto flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-muted-foreground hover:text-primary cursor-pointer"
              >
                <Info size={15} />
                <span>الفضل والمصدر</span>
                <ChevronDown size={15} className={cn('transition-transform duration-200', showDetails && 'rotate-180')} />
              </button>
              {showDetails && (
                <div className="mt-1 space-y-2 rounded-xl bg-secondary/60 p-4 text-[14px] leading-7 text-foreground/90 animate-in fade-in duration-200">
                  {item.description && <p><span className="font-bold">الفضل: </span>{item.description}</p>}
                  {item.reference && <p className="text-muted-foreground"><span className="font-bold text-foreground">المصدر: </span>{item.reference}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thumb zone: previous · counter · next */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <button
          type="button"
          onClick={() => go(safeIndex - 1)}
          disabled={safeIndex === 0}
          aria-label="الذكر السابق"
          className="flex size-14 items-center justify-center rounded-xl bg-secondary text-foreground disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight size={24} />
        </button>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={count}
            aria-label={finished ? 'اكتمل الذكر' : `عدّ الذكر، ${current} من ${item.count}`}
            className="relative flex size-28 items-center justify-center rounded-full bg-card cursor-pointer active:scale-95 transition-transform duration-150"
          >
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r={R} fill="none" strokeWidth="6" className="stroke-secondary" />
              <circle
                cx="50" cy="50" r={R} fill="none" strokeWidth="6" strokeLinecap="round"
                className={finished ? 'stroke-primary' : 'stroke-primary'}
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
                style={{ transition: 'stroke-dashoffset 0.25s ease-out' }}
              />
            </svg>
            {finished ? (
              <Check size={38} strokeWidth={3} className="text-primary" />
            ) : (
              <span className="flex flex-col items-center leading-none">
                <span className="text-4xl font-extrabold tabular-nums">{item.count - current}</span>
                <span className="mt-1 text-[12px] text-muted-foreground">من {item.count}</span>
              </span>
            )}
          </button>
          {current > 0 ? (
            <button type="button" onClick={() => onReset(item.id)} className="flex h-8 items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground cursor-pointer">
              <RotateCcw size={12} /> تصفير
            </button>
          ) : (
            <span className="h-8 text-[12px] leading-8 text-muted-foreground">{finished ? '' : 'اضغط للعد'}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => go(safeIndex + 1)}
          disabled={safeIndex >= items.length - 1}
          aria-label="الذكر التالي"
          className="flex size-14 items-center justify-center rounded-xl bg-secondary text-foreground disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
    </div>
  );
}
