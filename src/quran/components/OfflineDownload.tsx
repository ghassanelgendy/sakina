import { useCallback, useEffect, useState } from 'react';
import { CloudDownload, CheckCircle2, WifiOff, Loader2 } from 'lucide-react';
import { downloadAndCacheFullQuran } from '../services/quranApi';
import { idbCountQuranPages } from '../../lib/indexedDb';

const TOTAL_PAGES = 604;

type Progress = { step: 'idle' | 'fetching' | 'processing' | 'saving' | 'done' | 'error'; percent: number; text: string };

export function OfflineDownload() {
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  const [progress, setProgress] = useState<Progress>({ step: 'idle', percent: 0, text: '' });
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  const refreshCount = useCallback(() => {
    idbCountQuranPages().then(setCachedCount);
  }, []);

  useEffect(() => {
    refreshCount();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshCount]);

  const isComplete = cachedCount !== null && cachedCount >= TOTAL_PAGES;
  const isDownloading = progress.step !== 'idle' && progress.step !== 'done' && progress.step !== 'error';

  const handleDownload = async () => {
    setProgress({ step: 'fetching', percent: 5, text: 'جاري التحضير...' });
    try {
      await downloadAndCacheFullQuran((step, percent, text) => setProgress({ step, percent, text }));
      refreshCount();
    } catch (err: any) {
      setProgress({ step: 'error', percent: 0, text: err?.message || 'تعذر إكمال التنزيل، تحقق من اتصالك بالإنترنت.' });
    }
  };

  if (cachedCount === null) return null;

  if (isComplete && !isDownloading) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 text-xs font-bold text-emerald-500">
        <CheckCircle2 size={16} className="shrink-0" />
        <span>المصحف كامل (604 صفحة) متاح بدون إنترنت على هذا الجهاز</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 px-4 py-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground min-w-0">
          {!isOnline ? (
            <WifiOff size={15} className="text-muted-foreground shrink-0" />
          ) : isDownloading ? (
            <Loader2 size={15} className="text-primary shrink-0 animate-spin" />
          ) : (
            <CloudDownload size={15} className="text-primary shrink-0" />
          )}
          <span className="truncate">
            {isDownloading
              ? progress.text
              : cachedCount > 0
              ? `تم تنزيل ${cachedCount} من ${TOTAL_PAGES} صفحة — أكمل التنزيل ليعمل المصحف بالكامل بدون إنترنت`
              : 'نزّل المصحف كاملاً مع التفسير الميسر ليعمل التطبيق بدون إنترنت نهائياً'}
          </span>
        </div>

        {!isDownloading && (
          <button
            onClick={handleDownload}
            disabled={!isOnline}
            className="shrink-0 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={!isOnline ? 'يلزم الاتصال بالإنترنت لبدء التنزيل' : undefined}
          >
            تنزيل الآن
          </button>
        )}
      </div>

      {(isDownloading || progress.step === 'error') && (
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progress.step === 'error' ? 'bg-destructive' : 'bg-primary'}`}
            style={{ width: `${progress.step === 'error' ? 100 : progress.percent}%` }}
          />
        </div>
      )}

      {progress.step === 'error' && (
        <p className="text-[11px] text-destructive font-semibold">{progress.text}</p>
      )}
    </div>
  );
}
