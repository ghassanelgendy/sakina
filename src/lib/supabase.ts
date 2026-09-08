import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Both are optional: without them the app still works fully offline/local-only
// (favorites, progress, and khatmah plans just live in this browser only).
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

const storage = typeof window !== 'undefined' ? window.localStorage : undefined;

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    ...(storage ? { storage } : {}),
  },
});
