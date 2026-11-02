import { useEffect, useState, lazy, Suspense } from 'react';
import { BookOpenText, Sun, Moon, UserCircle2, HelpCircle, Github, Layers, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import { useAuth } from './hooks/useAuth';
import { useAzkarRealtime } from './hooks/useAzkar';

const QuranRoute = lazy(() => import('./routes/Quran'));
const AzkarRoute = lazy(() => import('./routes/Azkar'));
const LandingRoute = lazy(() => import('./routes/Landing'));
const AuthRoute = lazy(() => import('./routes/Auth'));
const Guide = lazy(() => import('./components/Guide').then(m => ({ default: m.Guide })));
const About = lazy(() => import('./components/About').then(m => ({ default: m.About })));

type Tab = 'quran' | 'azkar';
type View = 'landing' | 'auth' | 'app';

const ENTERED_KEY = 'sakina_entered_v1';
const GUIDE_SEEN_KEY = 'sakina_guide_seen_v1';

function getInitialRoute(): { view: View; tab: Tab } {
  if (typeof window === 'undefined') {
    return { view: 'app', tab: 'quran' };
  }
  const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (cleanPath === 'azkar') {
    return { view: 'app', tab: 'azkar' };
  }
  if (cleanPath === 'quran') {
    return { view: 'app', tab: 'quran' };
  }
  if (cleanPath === 'auth') {
    return { view: 'auth', tab: (localStorage.getItem('active_tab') as Tab) || 'quran' };
  }
  const entered = localStorage.getItem(ENTERED_KEY);
  const savedTab = (localStorage.getItem('active_tab') as Tab) || 'quran';
  return {
    view: entered ? 'app' : 'landing',
    tab: savedTab,
  };
}

function shouldShowGuideOnEntry(): boolean {
  try {
    return !localStorage.getItem(GUIDE_SEEN_KEY);
  } catch {
    return false;
  }
}

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
        <Loader2 className="size-7 animate-spin text-primary" />
        <span className="font-arabic text-sm">جاري التحميل...</span>
      </div>
    </div>
  );
}

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
  const [initial] = useState(() => getInitialRoute());
  const [tab, setTab] = useState<Tab>(initial.tab);
  const [view, setView] = useState<View>(initial.view);
  const { theme, toggleTheme } = useTheme();
  const { user, isConfigured } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  useAzkarRealtime();

  const navigate = (newView: View, newTab: Tab) => {
    setView(newView);
    setTab(newTab);
    localStorage.setItem('active_tab', newTab);
    let path = '/';
    if (newView === 'auth') path = '/auth';
    else if (newView === 'app') path = `/${newTab}`;
    if (window.location.pathname !== path) {
      window.history.pushState({ view: newView, tab: newTab }, '', path);
    }
  };

  useEffect(() => {
    const onPopState = () => {
      const current = getInitialRoute();
      setView(current.view);
      setTab(current.tab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (view === 'app' && shouldShowGuideOnEntry()) {
      setShowGuide(true);
    }
  }, [view]);

  const enterApp = () => {
    try { localStorage.setItem(ENTERED_KEY, '1'); } catch {}
    navigate('app', tab);
  };

  if (view === 'landing') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <LandingRoute onEnter={enterApp} onLogin={() => navigate('auth', tab)} />
      </Suspense>
    );
  }

  if (view === 'auth') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AuthRoute onBack={enterApp} />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <nav className="sticky top-0 z-30 bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <BookOpenText size={17} />
            </div>
            <span className="hidden font-arabic-title text-base font-bold text-foreground sm:inline">سكينة</span>
          </div>

          <div role="tablist" className="flex items-center gap-1 rounded-full bg-secondary p-1 shrink-0">
            {([
              { id: 'quran' as const, label: 'القرآن الكريم' },
              { id: 'azkar' as const, label: 'الأذكار' },
            ]).map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => navigate('app', id)}
                className={cn(
                  'rounded-full px-4 sm:px-5 h-9 text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95',
                  tab === id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowGuide(true)}
              aria-label="دليل الاستخدام"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer sm:flex active:scale-90"
              title="دليل الاستخدام"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 cursor-pointer active:scale-90"
            >
              <span key={theme} className="inline-flex animate-icon-pop">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </span>
            </button>
            <button
              onClick={() => navigate('auth', tab)}
              aria-label="الحساب"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 cursor-pointer active:scale-90',
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
        <Suspense fallback={<RouteLoadingFallback />}>
          {tab === 'quran' ? <QuranRoute /> : <AzkarRoute />}
        </Suspense>
      </main>

      <footer className={cn("mt-12 bg-card py-8 text-center text-xs text-muted-foreground", tab === 'azkar' && 'hidden md:block')} dir="rtl">
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

      <Suspense fallback={null}>
        {showGuide && <Guide onClose={() => setShowGuide(false)} />}
        {showAbout && <About onClose={() => setShowAbout(false)} />}
      </Suspense>
    </div>
  );
}
