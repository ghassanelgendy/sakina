-- Initial schema for the standalone Quran + Azkar app. Run this against a fresh
-- Supabase project (SQL Editor, or `supabase db push` if you set up the CLI).
-- Everything is optional: without a Supabase project configured, the app runs
-- entirely on localStorage/IndexedDB for a single device.

-- ---------- Azkar ----------

create table if not exists public.azkar_favorites (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  zekr_id text not null,
  created_at timestamptz not null default now(),
  constraint azkar_favorites_pkey primary key (id),
  constraint azkar_favorites_user_zekr_unique unique (user_id, zekr_id)
);

alter table public.azkar_favorites enable row level security;

drop policy if exists "azkar_favorites_select_own" on public.azkar_favorites;
create policy "azkar_favorites_select_own" on public.azkar_favorites for select using (auth.uid() = user_id);
drop policy if exists "azkar_favorites_insert_own" on public.azkar_favorites;
create policy "azkar_favorites_insert_own" on public.azkar_favorites for insert with check (auth.uid() = user_id);
drop policy if exists "azkar_favorites_delete_own" on public.azkar_favorites;
create policy "azkar_favorites_delete_own" on public.azkar_favorites for delete using (auth.uid() = user_id);

create table if not exists public.azkar_daily_progress (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  counts jsonb not null default '{}'::jsonb,               -- zekrId -> tap count
  completed_categories jsonb not null default '{}'::jsonb, -- categoryName -> completed
  updated_at timestamptz not null default now(),
  constraint azkar_daily_progress_pkey primary key (id),
  constraint azkar_daily_progress_user_date_unique unique (user_id, date)
);

alter table public.azkar_daily_progress enable row level security;

drop policy if exists "azkar_daily_progress_select_own" on public.azkar_daily_progress;
create policy "azkar_daily_progress_select_own" on public.azkar_daily_progress for select using (auth.uid() = user_id);
drop policy if exists "azkar_daily_progress_insert_own" on public.azkar_daily_progress;
create policy "azkar_daily_progress_insert_own" on public.azkar_daily_progress for insert with check (auth.uid() = user_id);
drop policy if exists "azkar_daily_progress_update_own" on public.azkar_daily_progress;
create policy "azkar_daily_progress_update_own" on public.azkar_daily_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "azkar_daily_progress_delete_own" on public.azkar_daily_progress;
create policy "azkar_daily_progress_delete_own" on public.azkar_daily_progress for delete using (auth.uid() = user_id);

create index if not exists azkar_daily_progress_user_date_idx on public.azkar_daily_progress (user_id, date);

-- ---------- Quran memorizer ----------

create table if not exists public.quran_khatmah_plans (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  goal_type text,
  direction text,
  start_page integer,
  end_page integer,
  current_page integer,
  current_surah integer,
  current_ayah integer,
  reading_current_page integer,
  reading_current_surah integer,
  reading_current_ayah integer,
  pages_per_day integer,
  reading_pages_per_day integer,
  streak_days integer default 0,
  reading_streak_days integer default 0,
  last_completed_date date,
  reading_last_completed_date date,
  start_date timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  constraint quran_khatmah_plans_pkey primary key (id),
  constraint quran_khatmah_plans_user_unique unique (user_id)
);

alter table public.quran_khatmah_plans enable row level security;

drop policy if exists "quran_khatmah_plans_select_own" on public.quran_khatmah_plans;
create policy "quran_khatmah_plans_select_own" on public.quran_khatmah_plans for select using (auth.uid() = user_id);
drop policy if exists "quran_khatmah_plans_insert_own" on public.quran_khatmah_plans;
create policy "quran_khatmah_plans_insert_own" on public.quran_khatmah_plans for insert with check (auth.uid() = user_id);
drop policy if exists "quran_khatmah_plans_update_own" on public.quran_khatmah_plans;
create policy "quran_khatmah_plans_update_own" on public.quran_khatmah_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "quran_khatmah_plans_delete_own" on public.quran_khatmah_plans;
create policy "quran_khatmah_plans_delete_own" on public.quran_khatmah_plans for delete using (auth.uid() = user_id);

create table if not exists public.quran_hifdh_records (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surah_number integer not null,
  ayah_start integer not null,
  ayah_end integer not null,
  status text not null default 'not_started',
  mastery_score integer not null default 0,
  repeats_done integer not null default 0,
  interval_days integer not null default 1,
  ease_factor numeric not null default 2.5,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  constraint quran_hifdh_records_pkey primary key (id)
);

alter table public.quran_hifdh_records enable row level security;

drop policy if exists "quran_hifdh_records_select_own" on public.quran_hifdh_records;
create policy "quran_hifdh_records_select_own" on public.quran_hifdh_records for select using (auth.uid() = user_id);
drop policy if exists "quran_hifdh_records_insert_own" on public.quran_hifdh_records;
create policy "quran_hifdh_records_insert_own" on public.quran_hifdh_records for insert with check (auth.uid() = user_id);
drop policy if exists "quran_hifdh_records_update_own" on public.quran_hifdh_records;
create policy "quran_hifdh_records_update_own" on public.quran_hifdh_records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "quran_hifdh_records_delete_own" on public.quran_hifdh_records;
create policy "quran_hifdh_records_delete_own" on public.quran_hifdh_records for delete using (auth.uid() = user_id);

create index if not exists quran_hifdh_records_user_idx on public.quran_hifdh_records (user_id);
