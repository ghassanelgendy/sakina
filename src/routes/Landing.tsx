import { BookOpenText, Sparkles, WifiOff, RotateCcw, ArrowLeft, Moon } from 'lucide-react';

const FEATURES = [
  {
    Icon: BookOpenText,
    title: 'مصحف كامل مع الحفظ',
    desc: 'قراءة صفحة بصفحة مع التفسير الميسر، وتتبّع حفظك بخطة ختمة ذكية ومراجعة بالتكرار المتباعد.',
  },
  {
    Icon: Moon,
    title: 'أذكار وسبحة إلكترونية',
    desc: 'أذكار الصباح والمساء والنوم والصلاة، مع تتبع يومي للتقدم وسبحة إلكترونية لا تحتاج شيئاً سوى إصبعك.',
  },
  {
    Icon: WifiOff,
    title: 'يعمل بلا إنترنت',
    desc: 'كل شيء محفوظ على جهازك مباشرة — لا حاجة لحساب أو اتصال دائم بالشبكة لتقرأ أو تحفظ.',
  },
  {
    Icon: RotateCcw,
    title: 'مزامنة اختيارية',
    desc: 'أنشئ حساباً إن أردت متابعة تقدمك عبر أكثر من جهاز، أو تجاهل ذلك تماماً وابقَ محلياً.',
  },
];

export default function LandingRoute({ onEnter, onLogin }: { onEnter: () => void; onLogin: () => void }) {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BookOpenText size={18} />
          </div>
          <span className="font-arabic-title text-base font-bold">سكينة</span>
        </div>
        <button
          onClick={onLogin}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          تسجيل الدخول
        </button>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-[0.35]"
          style={{ background: 'radial-gradient(60% 60% at 50% 0%, var(--color-primary) 0%, transparent 70%)' }}
        />

        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
          <Sparkles size={13} />
          <span>القرآن والأذكار في مكان واحد</span>
        </span>

        <h1 className="mt-6 text-3xl sm:text-5xl font-black leading-tight max-w-2xl mx-auto">
          سكينة قلبك تبدأ
          <br />
          <span className="text-primary">بذكر الله</span>
        </h1>

        <p className="mt-5 max-w-lg mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
          احفظ القرآن، راجع ما حفظته، واقرأ أذكارك اليومية — تطبيق واحد بسيط يعمل من غير إنترنت، ويحفظ تقدمك أولاً بأول.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onEnter}
            className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>ابدأ الآن</span>
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={onLogin}
            className="rounded-xl border border-border px-7 py-3.5 text-sm font-bold text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            لدي حساب بالفعل
          </button>
        </div>
      </section>

      {/* Mushaf preview strip */}
      <section className="px-5 sm:px-8 -mt-6 mb-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
          <p className="font-arabic-quran text-xl sm:text-2xl leading-loose text-center text-foreground/90">
            ﴿ الَّذِينَ ءَامَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ ﴾
          </p>
          <p className="mt-3 text-center text-xs text-muted-foreground">سورة الرعد، الآية 28</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 sm:px-8 pb-20">
        <div className="mx-auto grid max-w-4xl grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card/50 p-5 text-right">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={17} />
              </div>
              <h3 className="text-sm font-bold mb-1.5">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-[11px] text-muted-foreground space-y-2">
        <div className="flex items-center justify-center gap-1.5 font-bold text-foreground/80">
          <BookOpenText size={12} /> سكينة
        </div>
        <div className="flex items-center justify-center gap-3">
          <a href="https://lifeos.ghassan.online/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            جزء من مشروع lifeOS
          </a>
          <span className="text-border">•</span>
          <a href="https://github.com/ghassanelgendy/sakina" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            الكود المصدري
          </a>
        </div>
      </footer>
    </div>
  );
}
