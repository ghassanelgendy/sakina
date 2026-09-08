import { useEffect } from 'react';
import { QuranMemorizerMain } from '../quran';
import { downloadAndCacheFullQuran } from '../quran/services/quranApi';
import { useQuranCloudSync } from '../hooks/useQuranCloudSync';

export default function QuranRoute() {
  useQuranCloudSync();

  // Silently warm up the Quran IndexedDB cache in background when online
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    try {
      if (window.sessionStorage.getItem('quran_prefill_v1')) return;
      window.sessionStorage.setItem('quran_prefill_v1', '1');
    } catch {}

    const prefill = async () => {
      try {
        await downloadAndCacheFullQuran();
      } catch (e) {
        console.debug('Background Quran prefill skipped:', e);
      }
    };
    void prefill();
  }, []);

  return <QuranMemorizerMain />;
}
