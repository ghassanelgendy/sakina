import { useEffect, useState } from 'react';
import { BookOpen, Sun, Moon, UserCircle2 } from 'lucide-react';
import { cn } from './lib/utils';
import { useAuth } from './hooks/useAuth';
import { useAzkarRealtime } from './hooks/useAzkar';
import { AuthPanel } from './components/auth/AuthPanel';
import QuranRoute from './routes/Quran';
import AzkarRoute from './routes/Azkar';

type Tab = 'quran' | 'azkar';

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}

export default function App() {
  const [tab, setTab] = useState<Tab>(() => (localStorage.getItem('active_tab') as Tab) || 'quran');
  const [showAuth, setShowAuth] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isConfigured } = useAuth();
  useAzkarRealtime();

  useEffect(() => {
    localStorage.setItem('active_tab', tab);
  }, [tab]);

  return (
    <div className="flex h-full min-h-screen flex-col bg-background text-foreground">
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-3 py-2 backdrop-blur-md sm:px-5">
        <div className="flex items-center gap-1 rounded-xl bg-secondary/60 p-1">
          <button
            onClick={() => setTab('quran')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              tab === 'quran' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            القرآن الكريم
          </button>
          <button
            onClick={() => setTab('azkar')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              tab === 'azkar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            الأذكار
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="تبديل المظهر"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setShowAuth(true)}
            aria-label="الحساب"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border transition-colors',
              user ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
            title={isConfigured ? (user ? user.email ?? undefined : 'تسجيل الدخول') : 'وضع محلي فقط'}
          >
            <UserCircle2 size={18} />
          </button>
        </div>
      </nav>

      <main className="flex-1">{tab === 'quran' ? <QuranRoute /> : <AzkarRoute />}</main>

      {showAuth && <AuthPanel onClose={() => setShowAuth(false)} />}

      <footer className="border-t border-border py-3 text-center text-[11px] text-muted-foreground" dir="rtl">
        <span className="inline-flex items-center gap-1"><BookOpen size={12} /> سكينة</span>
      </footer>
    </div>
  );
}
