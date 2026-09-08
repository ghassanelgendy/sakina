import { useState } from 'react';
import { LogIn, LogOut, UserCircle2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

/**
 * Optional account panel. Signing in only matters if you want progress
 * (favorites, azkar counts, khatmah plan) to follow you across devices —
 * the app works fully without an account, storing everything locally.
 */
export function AuthPanel({ onClose }: { onClose: () => void }) {
  const { user, isConfigured, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isConfigured) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md" onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-muted-foreground" dir="rtl">
            لم يتم إعداد Supabase لهذا التطبيق بعد، لذا يعمل التطبيق محلياً فقط على هذا الجهاز.
          </p>
          <button onClick={onClose} className="mt-4 rounded-xl bg-secondary px-4 py-2 text-sm">إغلاق</button>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md" onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle2 size={22} className="text-primary" />
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (err) setError(err.message);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          لمزامنة المفضلة والتقدم بين أجهزتك. بدون حساب، يعمل التطبيق محلياً على هذا الجهاز فقط.
        </p>

        <div className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60'
          )}
        >
          <LogIn size={16} />
          {loading ? 'جارٍ التحميل...' : mode === 'signin' ? 'دخول' : 'إنشاء حساب'}
        </button>

        <button
          type="button"
          onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === 'signin' ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
        </button>
      </form>
    </div>
  );
}
