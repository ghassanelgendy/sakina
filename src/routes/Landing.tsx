import { useState } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { Reveal } from '../components/Reveal';

const VERSE = 'ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ'.split(' ');

const FEATURES = [
  {
    title: 'مصحف كامل للقراءة والحفظ',
    desc: 'اقرأ صفحة بصفحة مع التفسير الميسر، وتابع حفظك بخطة ختمة ومراجعة بالتكرار المتباعد.',
  },
  {
    title: 'أذكار وسبحة إلكترونية',
    desc: 'أذكار الصباح والمساء والنوم والصلاة، مع تتبّع يومي لتقدّمك وسبحة لا تحتاج سوى إصبعك.',
  },
  {
    title: 'يعمل بلا إنترنت',
    desc: 'كل شيء محفوظ على جهازك. لا حاجة لحساب ولا لاتصال دائم لتقرأ أو تحفظ.',
  },
  {
    title: 'مزامنة اختيارية',
    desc: 'أنشئ حساباً إن أردت متابعة تقدّمك على أكثر من جهاز، أو ابقَ محلياً تماماً.',
  },
];

const SIZES = [1.5, 1.75, 2, 2.35, 2.75];

export default function LandingRoute({ onEnter, onLogin }: { onEnter: () => void; onLogin: () => void }) {
  const [size, setSize] = useState(2);

  return (
    <div dir="rtl" className="min-h-dvh bg-background text-foreground animate-in fade-in duration-500">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <span className="font-display text-2xl font-bold">سكينة</span>
        <button
          onClick={onLogin}
          className="h-11 rounded-lg px-4 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          تسجيل الدخول
        </button>
      </header>

      <main>
        {/* Hero: the words on the left of the eye, the real reading page on the right */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-8 sm:px-8 md:grid-cols-2 md:gap-14 md:pb-28 md:pt-16">
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 ease-out">
            <h1 className="text-5xl font-bold leading-[1.3] sm:text-7xl">
              اقرأ القرآن
              <br />
              <span>بسكينة.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-foreground/80">
              مصحف للقراءة والحفظ والمراجعة، وأذكارك اليومية في تطبيق واحد هادئ. يعمل من غير إنترنت ويحفظ تقدّمك أولاً بأول.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={onEnter}
                className="flex h-14 items-center justify-center gap-2 rounded-lg bg-primary px-9 text-base font-bold text-primary-foreground transition-transform duration-200 hover:brightness-110 active:scale-[0.98] cursor-pointer"
              >
                <span>ابدأ القراءة</span>
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={onLogin}
                className="h-14 rounded-lg bg-secondary px-8 text-base font-bold text-foreground transition-colors hover:bg-secondary/70 cursor-pointer"
              >
                لدي حساب بالفعل
              </button>
            </div>
          </div>

          <figure
            data-ui
            className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out mushaf-frame px-6 pb-6 pt-8 sm:px-10 sm:pb-8 sm:pt-12"
          >
            <blockquote
              className="font-arabic-quran text-center text-foreground transition-[font-size] duration-300 ease-out"
              style={{ fontSize: `${size}rem`, lineHeight: 2.3 }}
            >
              {VERSE.map((w, i) => (
                <span key={i} className="word-in" style={{ ['--i' as string]: i }}>{w}{' '}</span>
              ))}
            </blockquote>
            <figcaption className="mt-6 flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-muted-foreground">سورة الرعد · الآية ٢٨</span>
              <div className="flex items-center gap-1" role="group" aria-label="حجم الخط">
                <button
                  onClick={() => setSize((s) => SIZES[Math.max(0, SIZES.indexOf(s) - 1)])}
                  disabled={size === SIZES[0]}
                  aria-label="تصغير الخط"
                  className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/70 active:scale-95 disabled:opacity-30 cursor-pointer"
                >
                  <Minus size={18} />
                </button>
                <button
                  onClick={() => setSize((s) => SIZES[Math.min(SIZES.length - 1, SIZES.indexOf(s) + 1)])}
                  disabled={size === SIZES[SIZES.length - 1]}
                  aria-label="تكبير الخط"
                  className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/70 active:scale-95 disabled:opacity-30 cursor-pointer"
                >
                  <Plus size={18} />
                </button>
              </div>
            </figcaption>
          </figure>
        </section>

        {/* What it does — plain type on a field of colour */}
        <section className="bg-card py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal><h2 className="max-w-xl text-3xl font-bold leading-snug sm:text-4xl">
              كل ما تحتاجه لورد يومي ثابت
            </h2></Reveal>
            <dl className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
              {FEATURES.map(({ title, desc }, i) => (
                <Reveal key={title} delay={(i % 2) * 120}>
                  <dt className="text-xl font-extrabold">{title}</dt>
                  <dd className="mt-3 text-base leading-8 text-foreground/75">{desc}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* Close: the name returns, large */}
        <section className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 md:py-28">
          <Reveal><p className="font-display text-7xl font-bold sm:text-9xl">سكينة</p></Reveal>
          <button
            onClick={onEnter}
            className="mt-10 inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-primary px-10 text-base font-bold text-primary-foreground transition-transform duration-200 hover:brightness-110 active:scale-[0.98] cursor-pointer"
          >
            <span>ابدأ القراءة</span>
            <ArrowLeft size={18} />
          </button>
        </section>
      </main>

      <footer className="bg-card py-8 text-center text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4">
          <a href="https://lifeos.ghassan.online/" target="_blank" rel="noopener noreferrer" className="py-1 transition-colors hover:text-foreground">
            جزء من مشروع lifeOS
          </a>
          <a href="https://github.com/ghassanelgendy/sakina" target="_blank" rel="noopener noreferrer" className="py-1 transition-colors hover:text-foreground">
            الكود المصدري
          </a>
        </div>
      </footer>
    </div>
  );
}
