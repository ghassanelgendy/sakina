# Sakina (سكينة)

A free, open-source, offline-first web app for reading, memorizing and reviewing the Quran, plus daily Azkar tracking with a digital tasbih counter — extracted from [lifeOS](https://lifeos.ghassan.online/), a personal productivity project by [@ghassanelgendy](https://github.com/ghassanelgendy), into its own standalone app.

Live app: **https://sakina-lyart.vercel.app/**

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

#### Google sign-in

The login screen also offers "المتابعة عبر Google" (continue with Google), which calls `supabase.auth.signInWithOAuth({ provider: 'google' })` — no app-side config beyond the Supabase URL/key above. To enable it, add a Google OAuth client and turn on the Google provider under **Authentication → Providers** in your Supabase project dashboard, and add your site's URL (and `http://localhost:5174` for local dev) to the provider's authorized redirect URIs.

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
  App.tsx                 top-level nav (Quran / Azkar tabs, theme, account, guide, about)
  routes/                 Landing.tsx, Auth.tsx, Quran.tsx, Azkar.tsx
  components/Guide.tsx    first-run usage guide (reopenable from the "؟" nav icon)
  components/About.tsx    credits / data-source attribution modal
  quran/                  the Quran reader/memorizer engine (self-contained)
  components/azkar/       ZekrCard, TasbihCounterModal
  hooks/useAzkar.ts       azkar data, favorites, daily progress (local + Supabase)
  hooks/useQuranCloudSync.ts  syncs khatmah plan/records with Supabase
  stores/useAzkarStore.ts Zustand store for azkar display preferences
  contexts/AuthContext.tsx Supabase auth: email/password + Google OAuth
  lib/                    supabase client, IndexedDB helper, utils
```

## Credits & attribution

Sakina is a personal, non-commercial, open-source project — not affiliated with any company.

- **Part of [lifeOS](https://lifeos.ghassan.online/)** — Sakina was extracted from lifeOS, a personal productivity project, into its own standalone app.
- **Built by** [Ghassan](https://github.com/ghassanelgendy) — [source code](https://github.com/ghassanelgendy/sakina).
- **Quran text (Uthmani script, Hafs recitation) and Tafsir Al-Muyassar** — [alquran.cloud](https://alquran.cloud) API.
- **Recitation audio** — [everyayah.com](https://everyayah.com).
- **Azkar text** — the widely-circulated Hisn al-Muslim ("Fortress of the Muslim") azkar collection, bundled locally in `src/data/azkar.json`.
- **Fonts** — Cairo, Amiri, and Scheherazade New via [Google Fonts](https://fonts.google.com/).

This same attribution, plus SEO/AI-answer-engine-facing context, is also published at `/llms.txt` on the live site.
