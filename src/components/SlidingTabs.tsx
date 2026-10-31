import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

interface Tab<T extends string> {
  id: T;
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

interface SlidingTabsProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  itemClassName?: string;
}

/** Tabs with one underline that glides to the active tab instead of blinking in place. */
export function SlidingTabs<T extends string>({ tabs, value, onChange, className, itemClassName }: SlidingTabsProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    // Arabic webfonts change the tab widths once they load
    void document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [value, tabs]);

  return (
    <div role="tablist" className={cn('relative flex items-stretch', className)}>
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          ref={(el) => { refs.current[id] = el; }}
          role="tab"
          type="button"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            'flex items-center gap-2 font-bold transition-colors duration-200 cursor-pointer',
            value === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            itemClassName
          )}
        >
          {Icon && <Icon className={cn('size-4 shrink-0 transition-colors', value === id && 'text-primary')} />}
          <span>{label}</span>
        </button>
      ))}
      {bar && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 h-[3px] rounded-t bg-primary"
          style={{
            left: 0,
            width: bar.width,
            transform: `translateX(${bar.left}px)`,
            transition: 'transform 0.35s cubic-bezier(0.22,0.61,0.36,1), width 0.35s cubic-bezier(0.22,0.61,0.36,1)',
          }}
        />
      )}
    </div>
  );
}
