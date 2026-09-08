import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { idbClearAll } from '../lib/indexedDb';

async function clearAllUserDataCache() {
  queryClient.clear();
  void idbClearAll();
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        previousUserIdRef.current = s?.user?.id ?? null;
      })
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      const nextUserId = s?.user?.id ?? null;
      const prevUserId = previousUserIdRef.current;
      setSession(s);
      setUser(s?.user ?? null);

      if (prevUserId && nextUserId && prevUserId !== nextUserId) {
        void clearAllUserDataCache();
      }
      previousUserIdRef.current = nextUserId;
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    // Vercel serves this same deployment from several domains (the canonical one,
    // the team-scoped alias, the git-branch alias, per-deploy URLs, ...). Supabase
    // only completes an OAuth redirect back to a URL on its allowlist, so we always
    // target the one canonical domain in production rather than whatever alias the
    // user happened to be browsing — otherwise it silently drops the session and
    // redirects to a bare "/#" with no tokens.
    const redirectTo = import.meta.env.PROD ? 'https://sakina-lyart.vercel.app' : window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearAllUserDataCache();
  };

  const value: AuthState = {
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
