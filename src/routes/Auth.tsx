import { useState } from 'react';
import { ArrowLeft, BookOpenText, LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export default function AuthRoute({ onBack }: { onBack: () => void }) {
  const { isConfigured, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (err) setError(err.message);
    else onBack();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 grid md:grid-cols-2">
        {/* Branding panel */}
        <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-gradient-to-b from-primary/15 via-primary/5 to-background p-10 border-l border-border">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <BookOpenText size={20} />
            </div>
            <span className="font-arabic-title text-lg font-bold">سكينة</span>
          </div>

          <div className="relative space-y-4">
            <p className="font-arabic-quran text-2xl leading-loose text-foreground/90">
              ﴿ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ ﴾
            </p>
            <p className="text-sm text-muted-foreground">
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
            <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
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
          )}
        </div>
      </div>
    </div>
  );
}
