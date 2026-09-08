# Sakina (سكينة)

A standalone web app for reading, memorizing and reviewing the Quran, plus daily Azkar tracking with a digital tasbih counter — extracted from [lifeOS](https://github.com) into its own project.

## Features

- **Quran**: page-by-page Mushaf reader with Tafsir Al-Muyassar, audio recitation (multiple reciters), spaced-repetition memorization tracker (khatmah planner, revision scheduler, blind-recitation mode), and a one-tap "download for offline" that caches the full 604-page mushaf + tafsir locally (also starts automatically in the background the first time you're online).
- **Azkar**: full morning/evening/sleep/prayer azkar library with tap-to-count cards, favorites, a standalone digital tasbih (سبحة إلكترونية), and daily progress tracking.
- **Installable PWA**: the app shell itself (not just the Quran data) is precached by a service worker, so once it's been opened online, it launches and works with zero network at all — not just the Quran text/tafsir, which live in IndexedDB.
- Works fully offline/local-only out of the box (localStorage + IndexedDB). Optionally connect a Supabase project to sync favorites, azkar progress, and khatmah plans across devices.

## Getting started

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5174`.

### Optional: cross-device sync via Supabase

1. Create a new Supabase project.
2. Run `supabase/migrations/0001_init.sql` against it (SQL Editor, or `supabase db push` with the CLI).
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from your project's API settings.
4. Restart `npm run dev`. Sign in from the account icon in the top nav to start syncing.

Without a `.env`, the app runs entirely locally — no account needed.

## Build

```bash
npm run build
npm run preview
```

## Data sources

- Azkar text is bundled locally (`src/data/azkar.json`) — no network dependency.
- Quran text, translation (Tafsir Al-Muyassar), and audio are fetched from [alquran.cloud](https://alquran.cloud) and [everyayah.com](https://everyayah.com), cached in IndexedDB after first load, and can be bulk-downloaded in full from the "تنزيل المصحف كاملاً" card on the home (الخاتمة) screen.
- The service worker (`vite-plugin-pwa`) precaches the built app shell and runtime-caches the Quran API and recitation audio, so a production build (`npm run build && npm run preview`, or any static host) keeps working with no network once it's been loaded once. `npm run dev` does not register a service worker — test offline behavior against a built/served copy.

## Project structure

```
src/
  App.tsx                 top-level nav (Quran / Azkar tabs, theme, account)
  routes/                 Quran.tsx, Azkar.tsx — the two screens
  quran/                  the Quran reader/memorizer engine (self-contained)
  components/azkar/       ZekrCard, TasbihCounterModal
  hooks/useAzkar.ts       azkar data, favorites, daily progress (local + Supabase)
  hooks/useQuranCloudSync.ts  syncs khatmah plan/records with Supabase
  stores/useAzkarStore.ts Zustand store for azkar display preferences
  contexts/AuthContext.tsx minimal Supabase email/password auth
  lib/                    supabase client, IndexedDB helper, utils
```
