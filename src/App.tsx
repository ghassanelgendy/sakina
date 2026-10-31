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
import { SlidingTabs } from './components/SlidingTabs';

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
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <nav className="sticky top-0 z-30 bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-display text-[26px] font-bold leading-none text-foreground">سكينة</span>
          </div>

          <SlidingTabs
            tabs={[
              { id: 'quran' as const, label: 'القرآن الكريم' },
              { id: 'azkar' as const, label: 'الأذكار' },
            ]}
            value={tab}
            onChange={setTab}
            className="h-14 shrink-0"
            itemClassName="px-3 sm:px-5 text-[15px]"
          />

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowGuide(true)}
              aria-label="دليل الاستخدام"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer sm:flex"
              title="دليل الاستخدام"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setView('auth')}
              aria-label="الحساب"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-colors cursor-pointer',
                user ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              title={isConfigured ? (user ? user.email ?? undefined : 'تسجيل الدخول') : 'وضع محلي فقط'}
            >
              <UserCircle2 size={19} />
            </button>
          </div>
        </div>
      </nav>

      <h1 className="sr-only">{tab === 'quran' ? 'سكينة، القرآن الكريم' : 'سكينة، الأذكار'}</h1>

      <main key={tab} className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
        {tab === 'quran' ? <QuranRoute /> : <AzkarRoute />}
      </main>

      <footer className="mt-12 bg-card py-8 text-center text-xs text-muted-foreground" dir="rtl">
        <div className="mb-3 font-arabic-title text-base font-bold text-foreground">سكينة</div>
        <div className="flex items-center justify-center gap-x-5 gap-y-2 flex-wrap px-4">
          <a
            href="https://lifeos.ghassan.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 py-1 hover:text-foreground transition-colors"
          >
            <Layers size={13} />
            <span>جزء من مشروع lifeOS</span>
          </a>
          <a
            href="https://github.com/ghassanelgendy/sakina"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 py-1 hover:text-foreground transition-colors"
          >
            <Github size={13} />
            <span>الكود المصدري</span>
          </a>
          <button onClick={() => setShowGuide(true)} className="py-1 hover:text-foreground transition-colors cursor-pointer sm:hidden">
            دليل الاستخدام
          </button>
          <button onClick={() => setShowAbout(true)} className="py-1 hover:text-foreground transition-colors cursor-pointer">
            عن التطبيق والمصادر
          </button>
        </div>
      </footer>

      {showGuide && <Guide onClose={() => setShowGuide(false)} />}
      {showAbout && <About onClose={() => setShowAbout(false)} />}
    </div>
  );
}
