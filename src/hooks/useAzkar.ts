import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import azkarDataRaw from '../data/azkar.json';
import type { AzkarItem, AzkarCategoryMeta, AzkarTimeWindow } from '../types/azkar';
import {
  idbGetAzkarFavorites,
  idbToggleAzkarFavorite,
  idbReplaceAzkarFavorites,
  idbGetAzkarDailyLog,
  idbPutAzkarDailyLog,
  idbSetAzkarCount,
  idbResetAzkarDailyLog,
  type IdbAzkarDailyRecord,
} from '../lib/indexedDb';
import { format } from 'date-fns';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';

const AZKAR_PROGRESS_SYNC_DEBOUNCE_MS = 1500;

const ALL_AZKAR: AzkarItem[] = azkarDataRaw as AzkarItem[];

// Helper to remove Arabic diacritics / tashkeel for robust searching
export function stripTashkeel(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();
}

// Map categories to time windows and icon definitions
export const CATEGORY_METADATA: Record<string, { timeWindow: AzkarTimeWindow; titleEn: string; iconName: string }> = {
  'أذكار الصباح': { timeWindow: 'morning', titleEn: 'Morning Azkar', iconName: 'Sun' },
  'أذكار المساء': { timeWindow: 'evening', titleEn: 'Evening Azkar', iconName: 'Sunset' },
  'أذكار النوم': { timeWindow: 'sleep', titleEn: 'Sleep Azkar', iconName: 'Moon' },
  'أذكار الاستيقاظ من النوم': { timeWindow: 'waking', titleEn: 'Waking Azkar', iconName: 'Sunrise' },
  'الأذكار بعد السلام من الصلاة': { timeWindow: 'prayer', titleEn: 'After Prayer', iconName: 'Sparkles' },
  'الرقية الشرعية من القرآن الكريم': { timeWindow: 'any', titleEn: 'Ruqyah from Quran', iconName: 'Shield' },
  'الرقية الشرعية من السنة النبوية': { timeWindow: 'any', titleEn: 'Ruqyah from Sunnah', iconName: 'ShieldCheck' },
  'دعاء السفر': { timeWindow: 'any', titleEn: 'Travel Supplication', iconName: 'Plane' },
  'دعاء الهم والحزن': { timeWindow: 'any', titleEn: 'Relief from Grief', iconName: 'Heart' },
  'دعاء الكرب': { timeWindow: 'any', titleEn: 'Distress & Relief', iconName: 'HeartHandshake' },
  'الاستغفار و التوبة': { timeWindow: 'any', titleEn: 'Seeking Forgiveness', iconName: 'RefreshCw' },
  'التسبيح، التحميد، التهليل، التكبير': { timeWindow: 'any', titleEn: 'Praise & Tasbih', iconName: 'Sparkles' },
  'فضل الصلاة على النبي صلى الله عليه و سلم': { timeWindow: 'any', titleEn: 'Blessings on the Prophet', iconName: 'Award' },
};

export function useAllAzkar() {
  return ALL_AZKAR;
}

export function useAzkarCategories() {
  return useMemo(() => {
    const categoryMap = new Map<string, number>();
    for (const item of ALL_AZKAR) {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
    }

    const list: AzkarCategoryMeta[] = [];
    categoryMap.forEach((count, name) => {
      const meta = CATEGORY_METADATA[name] || {
        timeWindow: 'any' as AzkarTimeWindow,
        titleEn: name,
        iconName: 'BookOpen',
      };
      list.push({ name, titleEn: meta.titleEn, timeWindow: meta.timeWindow, iconName: meta.iconName, count });
    });

    const priority = ['أذكار الصباح', 'أذكار المساء', 'أذكار النوم', 'أذكار الاستيقاظ من النوم', 'الأذكار بعد السلام من الصلاة'];
    return list.sort((a, b) => {
      const aIdx = priority.indexOf(a.name);
      const bIdx = priority.indexOf(b.name);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return b.count - a.count;
    });
  }, []);
}

export function useAzkarFavorites() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const key = ['azkar-favorites', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const local = await idbGetAzkarFavorites();
      if (!isSupabaseConfigured || !user?.id) return local;
      try {
        const { data, error } = await supabase.from('azkar_favorites').select('zekr_id').eq('user_id', user.id);
        if (error) throw error;
        const remoteIds = (data ?? []).map((r) => r.zekr_id as string);
        void idbReplaceAzkarFavorites(remoteIds);
        return remoteIds;
      } catch {
        return local;
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const nowFavorite = await idbToggleAzkarFavorite(id);
      if (isSupabaseConfigured && user?.id) {
        try {
          if (nowFavorite) {
            await supabase.from('azkar_favorites').upsert({ user_id: user.id, zekr_id: id }, { onConflict: 'user_id,zekr_id' });
          } else {
            await supabase.from('azkar_favorites').delete().eq('user_id', user.id).eq('zekr_id', id);
          }
        } catch (err) {
          console.warn('Azkar favorite sync failed (will retry on next toggle/reload):', err);
        }
      }
      return nowFavorite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    favoriteIds: query.data || [],
    isLoading: query.isLoading,
    toggleFavorite: toggleMutation.mutate,
    isFavorite: useCallback((id: string) => (query.data || []).includes(id), [query.data]),
  };
}

function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function useTodayAzkarProgress() {
  // Recomputed on focus/visibility change, not just once at mount — a backgrounded
  // tab/PWA left open across midnight never remounts, so a plain useMemo(() => ..., [])
  // would stay frozen on yesterday's date and keep showing yesterday's completed progress
  // instead of resetting when the user reopens the app the next day.
  const [todayStr, setTodayStr] = useState(getTodayStr);
  useEffect(() => {
    const refresh = () => {
      const now = getTodayStr();
      setTodayStr((prev) => (prev === now ? prev : now));
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const key = ['azkar-daily-log', todayStr, user?.id];
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery<IdbAzkarDailyRecord>({
    queryKey: key,
    queryFn: async () => {
      const local = await idbGetAzkarDailyLog(todayStr);
      if (!isSupabaseConfigured || !user?.id) return local;
      try {
        const { data, error } = await supabase
          .from('azkar_daily_progress')
          .select('counts, completed_categories, updated_at')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .maybeSingle();
        if (error) throw error;
        if (!data) return local;
        const remote: IdbAzkarDailyRecord = {
          date: todayStr,
          counts: (data.counts as Record<string, number>) || {},
          completedCategories: (data.completed_categories as Record<string, boolean>) || {},
          updatedAt: new Date(data.updated_at).getTime(),
        };
        if (remote.updatedAt >= local.updatedAt) {
          await idbPutAzkarDailyLog(remote);
          return remote;
        }
        return local;
      } catch {
        return local;
      }
    },
  });

  const syncToSupabase = useCallback(
    (record: IdbAzkarDailyRecord) => {
      if (!isSupabaseConfigured || !user?.id) return;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        void supabase
          .from('azkar_daily_progress')
          .upsert(
            {
              user_id: user.id,
              date: todayStr,
              counts: record.counts,
              completed_categories: record.completedCategories,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,date' }
          )
          .then(({ error }) => {
            if (error) console.warn('Azkar progress sync failed (will retry on next update):', error.message);
          });
      }, AZKAR_PROGRESS_SYNC_DEBOUNCE_MS);
    },
    [user?.id, todayStr]
  );

  useEffect(
    () => () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    },
    []
  );

  const defaultProgress = useMemo<IdbAzkarDailyRecord>(
    () => ({ date: todayStr, counts: {}, completedCategories: {}, updatedAt: 0 }),
    [todayStr]
  );

  const setProgressMutation = useMutation({
    mutationFn: async ({
      zekrId,
      count,
      categoryName,
      categoryCompleted,
    }: {
      zekrId: string;
      count: number;
      categoryName?: string;
      categoryCompleted?: boolean;
    }) => {
      const updated = await idbSetAzkarCount(todayStr, zekrId, count, categoryName, categoryCompleted);
      syncToSupabase(updated);
      return updated;
    },
    // Tapping to count can fire many times a second (tasbih runs to 33-100+), so we
    // update the cache directly from the write we just made instead of invalidating.
    onSuccess: (updated) => {
      queryClient.setQueryData(key, updated);
    },
  });

  const resetCategoryMutation = useMutation({
    mutationFn: async (zekrIds: string[]) => {
      const updated = await idbResetAzkarDailyLog(todayStr, zekrIds);
      syncToSupabase(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(key, updated);
    },
  });

  return {
    progress: query.data || defaultProgress,
    isLoading: query.isLoading,
    updateCount: setProgressMutation.mutate,
    resetCategory: resetCategoryMutation.mutate,
  };
}

/** Contextual recommendation based on the current clock time. */
export function useContextualAzkarCategory() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return useMemo(() => {
    if (currentMinutes >= 21 * 60 + 30 || currentMinutes < 3 * 60) {
      return {
        category: 'أذكار النوم',
        reason: 'أذكار ما قبل النوم وحفظ النفس بالليل',
        timeWindow: 'sleep' as AzkarTimeWindow,
        badge: 'وقت النوم',
      };
    }

    if (currentMinutes >= 3 * 60 + 30 && currentMinutes < 6 * 60 + 30) {
      return {
        category: 'أذكار الاستيقاظ من النوم',
        reason: 'أذكار الصباح الباكر والاستيقاظ المبارك',
        timeWindow: 'waking' as AzkarTimeWindow,
        badge: 'صباح الخير',
      };
    }

    if (currentMinutes >= 6 * 60 + 30 && currentMinutes < 12 * 60) {
      return {
        category: 'أذكار الصباح',
        reason: 'وقت أذكار الصباح المباركة حتى الظهر',
        timeWindow: 'morning' as AzkarTimeWindow,
        badge: 'أذكار الصباح',
      };
    }

    if (currentMinutes >= 15 * 60 + 30 && currentMinutes < 21 * 60 + 30) {
      return {
        category: 'أذكار المساء',
        reason: 'وقت أذكار المساء وحفظ العبد حتى الصباح',
        timeWindow: 'evening' as AzkarTimeWindow,
        badge: 'أذكار المساء',
      };
    }

    return {
      category: 'الأذكار بعد السلام من الصلاة',
      reason: 'أذكار الصلوات والاستغفار المبارك',
      timeWindow: 'prayer' as AzkarTimeWindow,
      badge: 'أذكار مستحبة',
    };
  }, [currentMinutes]);
}

/** Invalidate Azkar favorites/progress queries when another device changes them, so a tap
 * or favorite made on the phone shows up here without needing a manual refresh. */
export function useAzkarRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return;
    const channel = supabase
      .channel('azkar-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'azkar_daily_progress', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['azkar-daily-log'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'azkar_favorites', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['azkar-favorites'] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
