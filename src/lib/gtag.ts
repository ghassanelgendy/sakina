/**
 * Sakina - Google Analytics (gtag.js) Integration
 *
 * Provides typed, defensive event tracking for Quran reading, Khatmah progress,
 * Azkar completions, and offline-aware analytics.
 */

export const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-E33S655RMQ').trim();

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Defensive wrapper around window.gtag
 */
export function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  } else if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }
}

/**
 * Initializes Google Analytics dynamically if a measurement ID is available and online.
 */
export function initGA() {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;
  if (document.getElementById('ga-gtag-script')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    anonymize_ip: true,
  });

  const script = document.createElement('script');
  script.id = 'ga-gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/**
 * Tracks a pageview with path and optional title
 */
export function trackPageView(path: string, title?: string) {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', 'page_view', {
    page_path: path,
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
    send_to: GA_MEASUREMENT_ID,
  });
}

/**
 * Tracks a custom event
 */
export function trackEvent(action: string, params: Record<string, any> = {}) {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', action, params);
}

/**
 * Sakina Domain-Specific Tracking Functions
 */
export function trackSurahSelected(surahNumber: number, surahName: string, page: number) {
  trackEvent('surah_selected', {
    surah_number: surahNumber,
    surah_name: surahName,
    page_number: page,
  });
}

export function trackKhatmahProgress(currentPage: number, totalPages = 604) {
  trackEvent('khatmah_progress', {
    current_page: currentPage,
    total_pages: totalPages,
    progress_percentage: Math.round((currentPage / totalPages) * 100),
  });
}

export function trackZekrCompleted(zekrId: string, category: string, count: number) {
  trackEvent('zekr_completed', {
    zekr_id: zekrId,
    zekr_category: category,
    target_count: count,
  });
}

export function trackCategoryCompleted(categoryName: string, totalItems: number) {
  trackEvent('category_completed', {
    category_name: categoryName,
    total_items: totalItems,
  });
}

export function trackTasbihSession(count: number, target: number) {
  trackEvent('tasbih_session', {
    tasbih_count: count,
    tasbih_target: target,
  });
}
