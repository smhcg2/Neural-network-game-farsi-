import { useState } from 'react';
import {
  AVATAR_OPTIONS,
  GAME_TITLE,
  GAME_SUBTITLE,
  EITAA_SUPPORT_URL,
} from '../utils/constants.ts';
import { UserProfile, calculateGradeOutOf20 } from '../utils/transformerLogic.ts';
import { AiEntranceBackground } from './AiEntranceBackground.tsx';
import {
  Play,
  RotateCcw,
  BookOpen,
  Settings,
  Trophy,
  ExternalLink,
  MessageCircle,
  Sparkles,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  Award,
} from 'lucide-react';

interface MainMenuProps {
  userProfile: UserProfile;
  hasSavedGame: boolean;
  onStartNewGame: (name: string, avatarId: string) => void;
  onResumeGame: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
  onOpenShareCard: () => void;
}

export function MainMenu({
  userProfile,
  hasSavedGame,
  onStartNewGame,
  onResumeGame,
  onOpenTutorial,
  onOpenSettings,
  onOpenShareCard,
}: MainMenuProps) {
  // If user doesn't have a name yet, start in onboarding mode
  const [isOnboarding, setIsOnboarding] = useState<boolean>(!userProfile.name);
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [name, setName] = useState(userProfile.name || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState(
    userProfile.avatarId || AVATAR_OPTIONS[0].id
  );
  const [errorText, setErrorText] = useState('');

  const selectedAvatar =
    AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId) || AVATAR_OPTIONS[0];
  const grade = calculateGradeOutOf20(userProfile.stageScores);

  const handleGoToStep2 = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorText('لطفاً ابتدا نام یا لقب خودت رو وارد کن!');
      return;
    }
    setErrorText('');
    setStep(2);
  };

  const handleFinishOnboarding = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setStep(1);
      setErrorText('لطفاً نام یا لقب خودت رو وارد کن!');
      return;
    }
    onStartNewGame(trimmed, selectedAvatarId);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#030712] flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      {/* Professional Animated AI Entrance Portal Canvas */}
      <AiEntranceBackground />

      {/* Subtle Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 scanline z-10 opacity-20" />

      {/* Main Container */}
      <div className="relative z-20 w-full max-w-lg my-auto">
        {!isOnboarding ? (
          /* ========================================================================= */
          /* 1. CLEAN & UNCLUTTERED MAIN MENU (منوی خلوت و مدرن)                       */
          /* ========================================================================= */
          <div className="hud-panel p-5 sm:p-7 rounded-3xl relative shadow-2xl border border-cyan-400/40 backdrop-blur-2xl bg-slate-950/80 text-center animate-in zoom-in-95 duration-300">
            <div className="hud-corner-tl" />
            <div className="hud-corner-tr" />
            <div className="hud-corner-bl" />
            <div className="hud-corner-br" />

            {/* Futuristic Subtitle Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-[11px] font-mono text-cyan-300 mb-3 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{GAME_SUBTITLE}</span>
            </div>

            {/* Game Main Title */}
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent mb-2">
              {GAME_TITLE}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed">
              شبیه‌ساز سه‌بعدی و بازی آموزشی: مسیر پیش‌بینی کلمات را در شبکه عصبی کشف کن و نمره ۲۰ بگیر!
            </p>

            {/* Player Profile Quick Card (If returning player) */}
            {userProfile.name && (
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-cyan-500/30 mb-5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3 text-right">
                  <span className="text-3xl p-1.5 rounded-xl bg-slate-800 border border-cyan-500/30 shadow-inner">
                    {selectedAvatar.emoji}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{userProfile.name}</span>
                      <span className="text-[10px] text-cyan-400 font-normal">
                        ({selectedAvatar.name})
                      </span>
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      مراحل گذرانده: {userProfile.completedStages.length} از ۱۰ جمله
                    </span>
                  </div>
                </div>

                {/* Score badge */}
                <button
                  onClick={onOpenShareCard}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition active:scale-95 flex items-center gap-1"
                  title="مشاهده کارنامه رسمی"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{grade.formattedGrade} از ۲۰</span>
                </button>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 mb-6">
              {userProfile.name ? (
                <>
                  <button
                    onClick={onResumeGame}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-cyan-500/30 transition duration-200 active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                    <span>ادامه بازی ({userProfile.name}) 🚀</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOnboarding(true);
                      setStep(1);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-gray-300 hover:text-white border border-slate-700 text-xs font-semibold transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>شروع مجدد با بازیکن جدید</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsOnboarding(true);
                    setStep(1);
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-cyan-500/30 transition duration-200 active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                  <span>شروع ماجراجویی هوش مصنوعی 🚀</span>
                </button>
              )}
            </div>

            {/* Secondary Clean Action Bar */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-500/20 mb-5">
              <button
                onClick={onOpenTutorial}
                className="py-2.5 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-200 hover:text-white text-xs font-semibold flex flex-col items-center gap-1 transition active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>آموزش شبکه 🎓</span>
              </button>

              <button
                onClick={onOpenShareCard}
                className="py-2.5 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 text-amber-200 hover:text-white text-xs font-semibold flex flex-col items-center gap-1 transition active:scale-95"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>کارنامه و نمره 🏆</span>
              </button>

              <button
                onClick={onOpenSettings}
                className="py-2.5 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-gray-300 hover:text-white text-xs font-semibold flex flex-col items-center gap-1 transition active:scale-95"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>تنظیمات و تم ⚙</span>
              </button>
            </div>

            {/* Official Eitaa Channel Link */}
            <div className="pt-2 text-center border-t border-cyan-500/10">
              <span className="text-[11px] text-gray-400 block mb-1">
                پشتیبانی و دوره آموزش هوش مصنوعی در ایتا:
              </span>
              <a
                href={EITAA_SUPPORT_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 font-bold bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-500/30 hover:border-cyan-400 transition"
              >
                <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span dir="ltr">@dore_ai</span>
                <span className="text-[10px] text-gray-400">(کلیک کنید)</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </a>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. ONBOARDING WIZARD STEPS (مراحل شروع بازی: اول نام، سپس شغل/آواتار)    */
          /* ========================================================================= */
          <div className="hud-panel p-5 sm:p-7 rounded-3xl relative shadow-2xl border border-cyan-400/50 backdrop-blur-2xl bg-slate-950/90 text-right animate-in zoom-in-95 duration-300">
            <div className="hud-corner-tl" />
            <div className="hud-corner-tr" />
            <div className="hud-corner-bl" />
            <div className="hud-corner-br" />

            {/* Step Progress Indicator */}
            <div className="flex items-center justify-between mb-5 border-b border-cyan-500/25 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center font-mono">
                  {step}
                </span>
                <span className="text-xs sm:text-sm font-bold text-cyan-300">
                  {step === 1 ? 'مرحله اول: نام بازیکن' : 'مرحله دوم: شغل و آواتار آینده'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">گام {step} از ۲</span>
            </div>

            {/* STEP 1: Enter Name */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="text-center sm:text-right space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    <span>اسمت رو به شبکه عصبی معرفی کن:</span>
                  </h3>
                  <p className="text-xs text-gray-300">
                    این نام در کارنامه نمره ۲۰، گزارش عملکرد و مدال‌های شما ثبت خواهد شد.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorText) setErrorText('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGoToStep2();
                    }}
                    placeholder="مثال: آرین، سارا، رادین، پرهام..."
                    className="w-full bg-slate-900/90 text-white placeholder-gray-500 border-2 border-cyan-500/40 focus:border-cyan-400 rounded-2xl px-4 py-3 text-sm outline-none transition shadow-inner font-medium"
                    autoFocus
                  />
                  {errorText && (
                    <p className="text-xs text-rose-400 mt-1 font-semibold">{errorText}</p>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-between gap-3">
                  {userProfile.name ? (
                    <button
                      onClick={() => setIsOnboarding(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-400 text-xs font-semibold transition"
                    >
                      انصراف
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={handleGoToStep2}
                    className="flex-1 max-w-[200px] py-3 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-400/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ml-auto"
                  >
                    <span>مرحله بعدی</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Choose Profession / Career Avatar */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>شغل آینده‌ت رو در دنیای فناوری انتخاب کن:</span>
                  </h3>
                  <p className="text-xs text-gray-300">
                    یکی از مشاغل آینده‌ساز را انتخاب کن (بعداً در تنظیمات هم قابل تغییر است):
                  </p>
                </div>

                {/* Selected Profession Card Preview */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-cyan-400/40 flex items-center gap-3 shadow-md">
                  <span className="text-3xl p-2 rounded-xl bg-slate-800 border border-cyan-500/30">
                    {selectedAvatar.emoji}
                  </span>
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                      شغل و آواتار انتخابی شما:
                    </span>
                    <h4 className="text-sm font-black text-white">{selectedAvatar.name}</h4>
                  </div>
                </div>

                {/* 20 Profession Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1.5 bg-slate-900/60 rounded-2xl border border-slate-800 scrollbar-thin">
                  {AVATAR_OPTIONS.map((a) => {
                    const isSelected = selectedAvatarId === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAvatarId(a.id)}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition active:scale-95 border cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-md shadow-cyan-500/20 scale-105'
                            : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800 text-gray-300 hover:text-white'
                        }`}
                        title={a.name}
                      >
                        <span className="text-2xl">{a.emoji}</span>
                        <span className="text-[9px] truncate max-w-full font-medium text-center">
                          {a.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>مرحله قبل</span>
                  </button>

                  <button
                    onClick={handleFinishOnboarding}
                    className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-400/30 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>ورود به دنیای هوش مصنوعی 🚀</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
