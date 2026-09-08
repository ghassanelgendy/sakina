import { useState } from 'react';
import { ArrowLeft, BookOpenText, LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

// Simple 8-point Islamic star (khatam) tessellation, tiled as a subtle background pattern.
const ISLAMIC_PATTERN_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <g fill="none" stroke="white" stroke-width="1">
    <path d="M60 10 L74 46 L110 60 L74 74 L60 110 L46 74 L10 60 L46 46 Z" />
    <circle cx="60" cy="60" r="16" />
  </g>
</svg>
`)}`;

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.5 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l6-6C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.6 34.9 27 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.9l6.5 5.5C39.9 37.6 44 32 44 24c0-1.4-.1-2.7-.4-3.5z"/>
    </svg>
  );
}

export default function AuthRoute({ onBack }: { onBack: () => void }) {
  const { isConfigured, signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (err) setError(err.message);
    else onBack();
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
    // On success, Supabase redirects the page to the OAuth provider — no further action needed here.
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 grid md:grid-cols-2">
        {/* Branding panel — oriental calligraphy motif */}
        <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0c2a20] via-[#0f4a38] to-[#0a1f18] p-10 border-l border-border text-[#eafff5]">
          <div
            className="absolute inset-0 opacity-[0.15] text-[#eafff5]"
            style={{ backgroundImage: `url("${ISLAMIC_PATTERN_SVG}")`, backgroundSize: '120px 120px' }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/20 to-transparent" />

          <div className="relative flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <BookOpenText size={20} />
            </div>
            <span className="font-arabic-title text-lg font-bold">سكينة</span>
          </div>

          <div className="relative space-y-5 text-center">
            <div className="text-2xl tracking-[0.3em] text-amber-300/70">۞</div>
            <p className="font-arabic-quran text-4xl leading-[1.9] text-[#f4fff9]" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.35)' }}>
              أَلَا بِذِكْرِ ٱللَّهِ
              <br />
              تَطْمَئِنُّ ٱلْقُلُوبُ
            </p>
            <div className="text-2xl tracking-[0.3em] text-amber-300/70">۩</div>
          </div>

          <div className="relative space-y-2 text-center">
            <p className="text-sm text-[#c9f5e3]/90 leading-relaxed">
              سجّل دخولك لمزامنة تقدمك في الحفظ والمراجعة والأذكار بين أجهزتك — أو تابع بدون حساب وسيبقى كل شيء محفوظاً على هذا الجهاز فقط.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 md:px-16">
          <button
            onClick={onBack}
            className="mb-8 flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} className="rotate-180" />
            <span>العودة للتطبيق</span>
          </button>

          <div className="md:hidden mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <BookOpenText size={18} />
            </div>
            <span className="font-arabic-title text-base font-bold">سكينة</span>
          </div>

          <h1 className="text-2xl font-bold mb-1.5">
            {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {isConfigured
              ? 'لمزامنة المفضلة والتقدم بين أجهزتك.'
              : 'لم يتم إعداد المزامنة لهذا التطبيق بعد — يمكنك المتابعة بدون حساب.'}
          </p>

          {!isConfigured ? (
            <button
              onClick={onBack}
              className="rounded-xl bg-secondary px-5 py-3 text-sm font-semibold hover:bg-secondary/80 transition-colors w-fit cursor-pointer"
            >
              المتابعة بدون حساب
            </button>
          ) : (
            <div className="max-w-sm space-y-4">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card py-3 text-sm font-bold hover:bg-secondary transition-colors disabled:opacity-60 cursor-pointer"
              >
                {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon size={16} />}
                <span>{googleLoading ? 'جارٍ التحويل...' : 'المتابعة عبر Google'}</span>
              </button>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>أو بالبريد الإلكتروني</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">البريد الإلكتروني</span>
                <div className="relative">
                  <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border bg-card px-3 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">كلمة المرور</span>
                <div className="relative">
                  <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-card px-3 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </label>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60 transition-all cursor-pointer'
                )}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {loading ? 'جارٍ التحميل...' : mode === 'signin' ? 'دخول' : 'إنشاء حساب'}
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => { setMode((m) => (m === 'signin' ? 'signup' : 'signin')); setError(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {mode === 'signin' ? 'ليس لديك حساب؟ إنشاء حساب' : 'لديك حساب بالفعل؟ الدخول'}
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  المتابعة بدون حساب
                </button>
              </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
