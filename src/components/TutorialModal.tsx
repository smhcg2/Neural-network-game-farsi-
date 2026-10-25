import { useState } from 'react';
import {
  X,
  Brain,
  Layers,
  Sparkles,
  Trophy,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialSlide {
  title: string;
  badge: string;
  icon: React.ReactNode;
  concept: string;
  analogy: string;
  howToPlay: string;
  secretTip: string;
}

const SLIDES: TutorialSlide[] = [
  {
    title: 'شبکه عصبی چطور فکر می‌کند؟',
    badge: 'مفهوم پایه',
    icon: <Brain className="w-5 h-5 text-cyan-400" />,
    concept: 'شبکه عصبی مثل مغز انسان از میلیون‌ها سلول فکری به نام «نورون» ساخته شده است. این نورون‌ها به هم وصل هستند و وقتی یک کلمه یا تصویر را می‌بینند، با هم مشورت می‌کنند تا جواب را پیدا کنند.',
    analogy: 'مثل یک گروه از دوستان در مسابقه اطلاعات عمومی که هر کدام نظر می‌دهند و در نهایت پاسخی که بیشترین رأی را بیاورد انتخاب می‌شود!',
    howToPlay: 'در این بازی، ستون‌های عمودی در حقیقت مراحل فکر کردن شبکه عصبی هستند و هر دایره نورانی یک نورون است.',
    secretTip: 'نورون‌هایی که احتمال بیشتری دارند، با نور و درخشش بیشتری روشن می‌شوند.',
  },
  {
    title: 'سیناپس‌ها و خطوط ارتباطی',
    badge: 'ارسال سیگنال',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    concept: 'خطوط بین نورون‌ها «سیناپس» نامیده می‌شوند. گلوله‌های نوری که روی خطوط حرکت می‌کنند، حامل پیام‌های فکری هستند که از کلمه قبلی به کلمه بعدی منتقل می‌شوند.',
    analogy: 'مثل کابل‌های فوق سریع اینترنت که داده‌ها را با سرعت نور منتقل می‌کنند.',
    howToPlay: 'وقتی کلمه درست را حدس می‌زنی، خط سیناپس فوراً شارژ می‌شود و یک گلوله نوری پرانرژی به لایه بعدی پرتاب می‌کند!',
    secretTip: 'برای تماشای انتقال پالس‌ها می‌توانی دکمه «پخش خودکار» را هم فعال کنی.',
  },
  {
    title: 'پیش‌بینی کلمه بعدی (ترنسفورمر)',
    badge: 'معماری هوش مصنوعی',
    icon: <Layers className="w-5 h-5 text-emerald-400" />,
    concept: 'مدل‌های زبانی هوش مصنوعی (مثل ChatGPT) متن را کلمه به کلمه تولید می‌کنند. آن‌ها برای هر گام، به تمام کلمات فرهنگ لغت خود نمره احتمال می‌دهند و محتمل‌ترین کلمه را انتخاب می‌کنند.',
    analogy: 'دقیقاً مثل قابلیت حدس کلمه بعدی کیبورد گوشی تلفن همراهت!',
    howToPlay: 'در هر لایه، ۴ گزینه کلمه به صورت عمودی شناور هستند. وظیفه تو این است که کلمه‌ای که شبکه عصبی برای تکمیل جمله انتخاب می‌کند را لمس کنی!',
    secretTip: 'جملات این بازی گزیده‌ای از جملات پرمعنا و مثبت زندگی هستند، به روند ساخت جمله دقت کن.',
  },
  {
    title: 'چگونه نمره کامل ۲۰ از ۲۰ بگیریم؟',
    badge: 'قوانین امتیازدهی',
    icon: <Trophy className="w-5 h-5 text-yellow-400" />,
    concept: 'بازی شامل ۱۰ مرحله (۱۰ جمله حکمت‌آمیز) است. هر مرحله حداکثر ۲.۰ نمره دارد: ۱۰ مرحله × ۲ = نمره کامل ۲۰ از ۲۰!',
    analogy: 'مثل امتحان کلاسی؛ اگر بدون خطا کلمات را حدس بزنی، نمره ۲۰ و مدال طلای نابغه هوش مصنوعی را می‌گیری!',
    howToPlay: 'اگر کلمه را در بار اول درست حدس بزنی، نمره کامل آن لایه را می‌گیری. در صورت اشتباه، نمره کمی کسر می‌شود اما همیشه فرصت جبران داری.',
    secretTip: 'اگر در یک کلمه گیر کردی، روی دکمه «💡 راهنمایی» بزن یا به پیشنهاد هوشمند هوش مصنوعی گوش بده!',
  },
  {
    title: 'آموزش بازیکنان و تبدیل شدن به حرفه‌ای',
    badge: 'تقویت مهارت',
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    concept: 'اگر در حدس کلمه‌ای دو بار اشتباه کنی، سیستم یادگیری هوشمند بازی فعال می‌شود و با نشان دادن حرف اول و نقش کلمه بهت یاد می‌دهد چطور مثل یک متخصص هوش مصنوعی فکر کنی.',
    analogy: 'مثل یک مربی مهربان که وقتی توی یک تمرین گیر می‌کنی، کنارت می‌ایستد و راه حل را قدم به قدم یادت می‌دهد.',
    howToPlay: 'در پایان ۱۰ مرحله، می‌توانی کارنامه رسمی و نمره خودت از ۲۰ را با نام و آواتارت کپی یا مستقیماً به اشتراک بگذاری!',
    secretTip: '۵ مدال افتخار (برنز، نقره، طلا، کمبو و نابغه) منتظر باز شدن هستند!',
  },
];

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!isOpen) return null;

  const slide = SLIDES[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="hud-panel w-full max-w-lg p-4 sm:p-6 rounded-3xl relative shadow-2xl border border-cyan-400/50 flex flex-col max-h-[90vh]">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {slide.icon}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                آموزش شبکه عصبی و راهنمای بازی
              </h2>
              <span className="text-[10px] text-cyan-300 font-mono">
                بخش {currentIdx + 1} از {SLIDES.length}: {slide.badge}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="بستن آموزش"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Steps Progress Tabs */}
        <div className="flex items-center gap-1 mb-3.5 bg-slate-950/80 p-1.5 rounded-xl border border-cyan-500/20 shrink-0">
          {SLIDES.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition truncate ${
                idx === currentIdx
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              درس {idx + 1}
            </button>
          ))}
        </div>

        {/* Slide Content Scrollable Area */}
        <div className="overflow-y-auto space-y-3 pr-1 text-xs sm:text-sm">
          <h3 className="text-base font-black text-cyan-300">
            {slide.title}
          </h3>

          {/* Core Concept */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-cyan-500/20 text-gray-200 leading-relaxed font-medium">
            {slide.concept}
          </div>

          {/* Real World Analogy */}
          <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/80 p-3 rounded-2xl border-r-4 border-cyan-400 border border-cyan-500/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 mb-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>مثال ملموس در زندگی روزمره:</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-normal">
              {slide.analogy}
            </p>
          </div>

          {/* How to Play this in the 3D scene */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-gray-300 space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              نحوه بازی در نمودار سه‌بعدی:
            </span>
            <p className="leading-relaxed">{slide.howToPlay}</p>
          </div>

          {/* Secret Tip */}
          <div className="bg-amber-950/30 p-2.5 rounded-2xl border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <span className="font-bold">نکته حرفه‌ای: </span>
              {slide.secretTip}
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-cyan-500/20 shrink-0">
          <button
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
            disabled={isFirst}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
              isFirst
                ? 'opacity-30 cursor-not-allowed text-gray-500'
                : 'bg-slate-900 text-cyan-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>بخش قبلی</span>
          </button>

          <button
            onClick={() => {
              if (isLast) onClose();
              else setCurrentIdx((p) => p + 1);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-400/30 flex items-center gap-1 transition active:scale-95"
          >
            <span>{isLast ? 'شروع بازی 🚀' : 'بخش بعدی'}</span>
            {!isLast && <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
