import { useEffect, useState } from 'react';
import { BookOpenText, Sun, Moon, UserCircle2, HelpCircle, Github, Layers } from 'lucide-react';
import { cn } from './lib/utils';
import { useAuth } from './hooks/useAuth';
import { useAzkarRealtime } from './hooks/useAzkar';
import QuranRoute from './routes/Quran';
import AzkarRoute from './routes/Azkar';
import LandingRoute from './routes/Landing';
import AuthRoute from './routes/Auth';
import { Guide, shouldShowGuideOnEntry } from './components/Guide';
import { About } from './components/About';

type Tab = 'quran' | 'azkar';
type View = 'landing' | 'auth' | 'app';

const ENTERED_KEY = 'sakina_entered_v1';

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
  const [view, setView] = useState<View>(() => {
    try {
      return localStorage.getItem(ENTERED_KEY) ? 'app' : 'landing';
    } catch {
      return 'app';
    }
  });
  const { theme, toggleTheme } = useTheme();
  const { user, isConfigured } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  useAzkarRealtime();

  useEffect(() => {
    localStorage.setItem('active_tab', tab);
  }, [tab]);

  useEffect(() => {
    if (view === 'app' && shouldShowGuideOnEntry()) {
      setShowGuide(true);
    }
  }, [view]);

  const enterApp = () => {
    try { localStorage.setItem(ENTERED_KEY, '1'); } catch {}
    setView('app');
  };

  if (view === 'landing') {
    return <LandingRoute onEnter={enterApp} onLogin={() => setView('auth')} />;
  }

  if (view === 'auth') {
    return <AuthRoute onBack={enterApp} />;
  }

  return (
    <div className="flex h-full min-h-screen flex-col bg-background text-foreground">
      <nav className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BookOpenText size={16} />
            </div>
            <span className="hidden font-arabic-title text-sm font-bold text-foreground sm:inline">سكينة</span>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-secondary/70 p-1 shrink-0">
            {([
              { id: 'quran' as const, label: 'القرآن الكريم' },
              { id: 'azkar' as const, label: 'الأذكار' },
            ]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-bold transition-all cursor-pointer',
                  tab === id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 rounded-full border border-border/70 bg-secondary/40 p-1 shrink-0">
            <button
              onClick={() => setShowGuide(true)}
              aria-label="دليل الاستخدام"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground transition-colors cursor-pointer"
              title="دليل الاستخدام"
            >
              <HelpCircle size={15} />
            </button>
            <button
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={() => setView('auth')}
              aria-label="الحساب"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer',
                user ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-background hover:text-foreground'
              )}
              title={isConfigured ? (user ? user.email ?? undefined : 'تسجيل الدخول') : 'وضع محلي فقط'}
            >
              <UserCircle2 size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main key={tab} className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
        {tab === 'quran' ? <QuranRoute /> : <AzkarRoute />}
      </main>

      <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground space-y-2" dir="rtl">
        <div className="flex items-center justify-center gap-1.5 font-bold text-foreground/80">
          <BookOpenText size={12} /> سكينة
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap px-4">
          <a
            href="https://lifeos.ghassan.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Layers size={11} />
            <span>جزء من مشروع lifeOS</span>
          </a>
          <span className="text-border">•</span>
          <a
            href="https://github.com/ghassanelgendy/sakina"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Github size={11} />
            <span>الكود المصدري</span>
          </a>
          <span className="text-border">•</span>
          <button onClick={() => setShowAbout(true)} className="hover:text-foreground transition-colors cursor-pointer">
            عن التطبيق والمصادر
          </button>
        </div>
      </footer>

      {showGuide && <Guide onClose={() => setShowGuide(false)} />}
      {showAbout && <About onClose={() => setShowAbout(false)} />}
    </div>
  );
}
