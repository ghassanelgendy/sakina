// Lightweight IndexedDB helper for local-first storage of Quran page cache and
// Azkar favorites/daily progress. Deliberately small — only the stores this
// standalone app needs, unlike lifeOS's full multi-domain indexedDb.ts.

const DB_NAME = 'quran-azkar-indexeddb';
const DB_VERSION = 1;

const STORES = {
  quranPages: 'quran_pages',
  azkarFavorites: 'azkar_favorites',
  azkarDailyLogs: 'azkar_daily_logs',
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  if (typeof indexedDB === 'undefined') {
    dbPromise = Promise.reject(new Error('IndexedDB is not available in this environment'));
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.quranPages)) {
        db.createObjectStore(STORES.quranPages, { keyPath: 'page' });
      }
      if (!db.objectStoreNames.contains(STORES.azkarFavorites)) {
        db.createObjectStore(STORES.azkarFavorites, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.azkarDailyLogs)) {
        db.createObjectStore(STORES.azkarDailyLogs, { keyPath: 'date' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });

  return dbPromise;
}

function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => T | Promise<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        Promise.resolve(fn(store)).then(resolve, reject);
        tx.onerror = () => reject(tx.error ?? new Error(`IndexedDB transaction failed on ${storeName}`));
      })
  );
}

// ---------- Quran page cache ----------

export interface IdbQuranPage {
  page: number;
  ayahs: any[];
  cachedAt: number;
}

export async function idbGetQuranPage(page: number): Promise<IdbQuranPage | null> {
  try {
    return await withStore(STORES.quranPages, 'readonly', (store) => {
      return new Promise<IdbQuranPage | null>((resolve, reject) => {
        const req = store.get(page);
        req.onsuccess = () => resolve((req.result as IdbQuranPage) ?? null);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB getQuranPage failed'));
      });
    });
  } catch {
    return null;
  }
}

export async function idbSetQuranPage(page: number, ayahs: any[]): Promise<void> {
  try {
    await withStore(STORES.quranPages, 'readwrite', (store) => {
      store.put({ page, ayahs, cachedAt: Date.now() });
    });
  } catch {
    // best-effort
  }
}

/** Number of the 604 mushaf pages currently cached on this device (used to show offline-download progress). */
export async function idbCountQuranPages(): Promise<number> {
  try {
    return await withStore(STORES.quranPages, 'readonly', (store) => {
      return new Promise<number>((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB countQuranPages failed'));
      });
    });
  } catch {
    return 0;
  }
}

export async function idbSetQuranPagesBatch(pages: { page: number; ayahs: any[] }[]): Promise<void> {
  try {
    await withStore(STORES.quranPages, 'readwrite', (store) => {
      const now = Date.now();
      for (const item of pages) {
        store.put({ page: item.page, ayahs: item.ayahs, cachedAt: now });
      }
    });
  } catch {
    // best-effort
  }
}

// ---------- Azkar helpers ----------

export async function idbGetAzkarFavorites(): Promise<string[]> {
  try {
    return await withStore(STORES.azkarFavorites, 'readonly', (store) => {
      return new Promise<string[]>((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as { id: string }[]).map((i) => i.id));
        req.onerror = () => resolve([]);
      });
    });
  } catch {
    return [];
  }
}

export async function idbToggleAzkarFavorite(id: string): Promise<boolean> {
  try {
    const favs = await idbGetAzkarFavorites();
    const exists = favs.includes(id);
    if (exists) {
      await withStore(STORES.azkarFavorites, 'readwrite', (store) => store.delete(id));
      return false;
    } else {
      await withStore(STORES.azkarFavorites, 'readwrite', (store) => store.put({ id }));
      return true;
    }
  } catch {
    return false;
  }
}

export async function idbReplaceAzkarFavorites(ids: string[]): Promise<void> {
  try {
    await withStore(STORES.azkarFavorites, 'readwrite', (store) => {
      store.clear();
      for (const id of ids) store.put({ id });
    });
  } catch {
    // best-effort
  }
}

export interface IdbAzkarDailyRecord {
  date: string; // yyyy-MM-dd
  counts: Record<string, number>; // zekrId -> count
  completedCategories: Record<string, boolean>;
  updatedAt: number;
}

export async function idbGetAzkarDailyLog(date: string): Promise<IdbAzkarDailyRecord> {
  const fallback: IdbAzkarDailyRecord = { date, counts: {}, completedCategories: {}, updatedAt: Date.now() };
  try {
    return await withStore(STORES.azkarDailyLogs, 'readonly', (store) => {
      return new Promise<IdbAzkarDailyRecord>((resolve) => {
        const req = store.get(date);
        req.onsuccess = () => resolve((req.result as IdbAzkarDailyRecord) ?? fallback);
        req.onerror = () => resolve(fallback);
      });
    });
  } catch {
    return fallback;
  }
}

export async function idbPutAzkarDailyLog(record: IdbAzkarDailyRecord): Promise<void> {
  try {
    await withStore(STORES.azkarDailyLogs, 'readwrite', (store) => {
      store.put(record);
    });
  } catch {
    // best-effort
  }
}

// Reads and writes in a single readwrite transaction so rapid tasbih tapping
// (which can run to 33-100+ taps in a few seconds) only pays for one
// IndexedDB round trip per tap.
export async function idbSetAzkarCount(
  date: string,
  zekrId: string,
  count: number,
  categoryName?: string,
  categoryCompleted?: boolean
): Promise<IdbAzkarDailyRecord> {
  const fallback: IdbAzkarDailyRecord = {
    date,
    counts: { [zekrId]: count },
    completedCategories: {},
    updatedAt: Date.now(),
  };
  try {
    return await withStore(STORES.azkarDailyLogs, 'readwrite', (store) => {
      return new Promise<IdbAzkarDailyRecord>((resolve) => {
        const req = store.get(date);
        req.onsuccess = () => {
          const record: IdbAzkarDailyRecord =
            (req.result as IdbAzkarDailyRecord) || { date, counts: {}, completedCategories: {}, updatedAt: Date.now() };
          record.counts[zekrId] = count;
          if (categoryName && categoryCompleted !== undefined) {
            record.completedCategories[categoryName] = categoryCompleted;
          }
          record.updatedAt = Date.now();
          store.put(record);
          resolve(record);
        };
        req.onerror = () => {
          store.put(fallback);
          resolve(fallback);
        };
      });
    });
  } catch {
    return fallback;
  }
}

export async function idbResetAzkarDailyLog(date: string, zekrIds?: string[]): Promise<IdbAzkarDailyRecord> {
  const fallback: IdbAzkarDailyRecord = { date, counts: {}, completedCategories: {}, updatedAt: Date.now() };
  try {
    return await withStore(STORES.azkarDailyLogs, 'readwrite', (store) => {
      return new Promise<IdbAzkarDailyRecord>((resolve) => {
        const req = store.get(date);
        req.onsuccess = () => {
          const record: IdbAzkarDailyRecord =
            (req.result as IdbAzkarDailyRecord) || { date, counts: {}, completedCategories: {}, updatedAt: Date.now() };
          if (zekrIds && zekrIds.length > 0) {
            zekrIds.forEach((id) => delete record.counts[id]);
          } else {
            record.counts = {};
            record.completedCategories = {};
          }
          record.updatedAt = Date.now();
          store.put(record);
          resolve(record);
        };
        req.onerror = () => {
          store.put(fallback);
          resolve(fallback);
        };
      });
    });
  } catch {
    return fallback;
  }
}

/** Clears all locally-cached data — called on sign-out to prevent data leakage between users. */
export async function idbClearAll(): Promise<void> {
  try {
    await withStore(STORES.quranPages, 'readwrite', (store) => store.clear());
    await withStore(STORES.azkarFavorites, 'readwrite', (store) => store.clear());
    await withStore(STORES.azkarDailyLogs, 'readwrite', (store) => store.clear());
  } catch {
    // best-effort
  }
}
