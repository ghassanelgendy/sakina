import { X, Github, Layers, BookOpenText, Volume2, Sparkles } from 'lucide-react';

const LIFEOS_URL = 'https://lifeos.ghassan.online/';
const GITHUB_USER_URL = 'https://github.com/ghassanelgendy';
const GITHUB_REPO_URL = 'https://github.com/ghassanelgendy/sakina';

export function About({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-[2rem] sm:rounded-3xl border border-border bg-card p-6 space-y-5 shadow-2xl text-right"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles size={17} className="text-primary" />
            <span>عن سكينة والمصادر</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          سكينة تطبيق مجاني ومفتوح المصدر لقراءة القرآن الكريم وحفظه ومراجعته، وقراءة الأذكار اليومية — بلا إعلانات وبلا حاجة لإنترنت دائم.
        </p>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">جزء من مشروع lifeOS</h3>
          <a
            href={LIFEOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-2xl border border-border bg-secondary/40 hover:bg-secondary/70 px-4 py-3 text-sm font-bold transition-colors"
          >
            <Layers size={16} className="text-primary shrink-0" />
            <span className="flex-1">سكينة مبنية كجزء مستقل من مشروع lifeOS الشخصي</span>
            <span className="text-xs text-primary shrink-0 font-mono ltr:direction-ltr">lifeos.ghassan.online</span>
          </a>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">المطوّر والكود المصدري</h3>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={GITHUB_USER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 hover:bg-secondary/70 px-3.5 py-3 text-xs font-bold transition-colors justify-center"
            >
              <Github size={15} />
              <span>حساب المطوّر</span>
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 hover:bg-secondary/70 px-3.5 py-3 text-xs font-bold transition-colors justify-center"
            >
              <Github size={15} />
              <span>الكود على GitHub</span>
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">مصادر المحتوى</h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <BookOpenText size={14} className="text-primary shrink-0 mt-0.5" />
              <span>
                نص القرآن الكريم (برواية حفص، الرسم العثماني) والتفسير الميسر عبر{' '}
                <a href="https://alquran.cloud" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  alquran.cloud
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Volume2 size={14} className="text-primary shrink-0 mt-0.5" />
              <span>
                التلاوات الصوتية عبر{' '}
                <a href="https://everyayah.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  everyayah.com
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
              <span>نصوص الأذكار من مجموعة أذكار حصن المسلم المتداولة، مضمّنة محلياً داخل التطبيق</span>
            </li>
          </ul>
        </div>

        <p className="text-[11px] text-muted-foreground/70 text-center pt-1">
          سكينة سكينة، وأصلها من الطمأنينة — نسأل الله أن ينفع بها.
        </p>
      </div>
    </div>
  );
}
