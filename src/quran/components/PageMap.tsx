import React from 'react';

// First mushaf page of each juz (Madani 604-page print).
const JUZ_START = [1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
const TOTAL = 604;

interface PageMapProps {
  /** Reading position: pages before this one have been read. */
  readPage: number;
  /** Memorisation position, and which way the plan runs. */
  memPage?: number;
  memReverse?: boolean;
  onOpen?: (page: number) => void;
}

/** All 604 pages as small squares, one row per juz. Tap any page to open it. */
export const PageMap: React.FC<PageMapProps> = ({ readPage, memPage, memReverse, onOpen }) => {
  const stateOf = (p: number) => {
    if (p === readPage) return 'here';
    if (memPage != null && (memReverse ? p > memPage : p < memPage)) return 'mem';
    if (p < readPage) return 'read';
    return 'none';
  };

  return (
    <div className="page-map" dir="rtl" role="grid" aria-label="خريطة صفحات المصحف">
      {JUZ_START.map((start, j) => {
        const end = j === 29 ? TOTAL : JUZ_START[j + 1] - 1;
        const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        return (
          <React.Fragment key={j}>
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{j + 1}</span>
            {pages.map((p) => (
              <button
                key={p}
                type="button"
                data-s={stateOf(p)}
                className="page-cell"
                onClick={() => onOpen?.(p)}
                aria-label={`صفحة ${p}`}
                title={`صفحة ${p}`}
              />
            ))}
            {/* juz 30 has 23 pages, the rest 20-21: pad short rows so rows stay aligned */}
            {Array.from({ length: Math.max(0, 23 - pages.length) }, (_, i) => (
              <span key={`pad-${i}`} aria-hidden />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};
