import { useState } from 'react';
import { BookOpenText, Target, Moon, CloudDownload, ArrowLeft, ArrowRight, X, Sparkles } from 'lucide-react';

const STEPS = [
  {
    Icon: Sparkles,
    title: 'أهلاً بك في سكينة',
    desc: 'دليل سريع من 4 خطوات يشرح أهم ما تحتاج معرفته قبل أن تبدأ. يمكنك تخطيه أو إعادة فتحه لاحقاً من أيقونة "؟" في الأعلى.',
  },
  {
    Icon: BookOpenText,
    title: 'المصحف والحفظ',
    desc: 'من تبويب "القرآن الكريم" اقرأ المصحف صفحة بصفحة، فعّل التفسير أو التجويد من شريط الأدوات، وأنشئ خطة ختمة من تبويب "الخاتمة" لتتبع حفظك ومراجعتك يومياً.',
  },
  {
    Icon: Target,
    title: 'الاستماع والتكرار',
    desc: 'شغّل التلاوة من الشريط السفلي واضبط عدد مرات تكرار كل آية وفترة السكوت للتسميع من زر "خيارات". أثناء التشغيل، ستنتقل الصفحة تلقائياً كلما وصلت التلاوة إلى صفحة جديدة.',
  },
  {
    Icon: Moon,
    title: 'الأذكار والسبحة',
    desc: 'من تبويب "الأذكار" ستجد أذكار الصباح والمساء والنوم وبعد الصلاة، مع سبحة إلكترونية وتتبع يومي — كل ذلك محفوظ محلياً حتى بلا حساب.',
  },
  {
    Icon: CloudDownload,
    title: 'اعمل بلا إنترنت بالكامل',
    desc: 'من الشاشة الرئيسية (الخاتمة) اضغط "تنزيل الآن" لحفظ المصحف كاملاً مع التفسير على جهازك — بعدها يعمل التطبيق بالكامل بدون أي اتصال بالإنترنت.',
  },
];

const SEEN_KEY = 'sakina_guide_seen_v1';

export function shouldShowGuideOnEntry(): boolean {
  try {
    return !localStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
}

export function Guide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const finish = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
      <div
        dir="rtl"
        className="w-full sm:max-w-md rounded-t-[2rem] sm:rounded-3xl border border-border bg-card p-6 space-y-5 shadow-2xl text-right animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-secondary'}`}
              />
            ))}
          </div>
          <button onClick={finish} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center gap-3 py-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <current.Icon size={26} />
          </div>
          <h2 className="text-lg font-bold">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{current.desc}</p>
        </div>

        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-secondary transition-colors cursor-pointer"
            >
              <ArrowRight size={15} />
              <span>السابق</span>
            </button>
          )}
          <button
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>{isLast ? 'ابدأ الآن' : 'التالي'}</span>
            {!isLast && <ArrowLeft size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
