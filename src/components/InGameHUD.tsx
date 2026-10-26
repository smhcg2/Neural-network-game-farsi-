import { useState, useEffect } from 'react';
import { PRESET_SENTENCES, AVATAR_OPTIONS, EITAA_SUPPORT_URL } from '../utils/constants.ts';
import {
  NetworkGraph,
  UserProfile,
  calculateGradeOutOf20,
  generateSmartHintForStrugglingPlayer,
} from '../utils/transformerLogic.ts';
import { HoldToConfirmButton } from './HoldToConfirmButton.tsx';
import {
  Trophy,
  Flame,
  Maximize2,
  Minimize2,
  ChevronDown,
  RotateCcw,
  SkipForward,
  Play,
  Pause,
  Lightbulb,
  Sparkles,
  Scan,
  Settings,
  Home,
  Award,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Timer,
} from 'lucide-react';

interface InGameHUDProps {
  graph: NetworkGraph;
  currentSentenceIdx: number;
  currentStepIndex: number;
  score: number;
  streak: number;
  highestStreak: number;
  userProfile: UserProfile;
  feedbackText: string | null;
  feedbackType: 'success' | 'warning' | null;
  isCameraCustomized?: boolean;
  strugglingAttempts?: number;
  timeRemaining?: number | null;
  onSelectSentence: (idx: number) => void;
  onResetStage: () => void;
  onNextStage: () => void;
  onTriggerHint: () => void;
  onResetCamera: () => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
  onOpenShareCard: () => void;
  onOpenTutorial: () => void;
}

export function InGameHUD({
  graph,
  currentSentenceIdx,
  currentStepIndex,
  score,
  streak,
  userProfile,
  feedbackText,
  feedbackType,
  isCameraCustomized,
  strugglingAttempts = 0,
  timeRemaining = null,
  onSelectSentence,
  onResetStage,
  onNextStage,
  onTriggerHint,
  onResetCamera,
  onOpenMenu,
  onOpenSettings,
  onOpenShareCard,
  onOpenTutorial,
}: InGameHUDProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSentenceMenuOpen, setIsSentenceMenuOpen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback
    }
  };

  const isStageCompleted = currentStepIndex >= graph.totalLayers;
  const rawSentence = graph.sentence || PRESET_SENTENCES[currentSentenceIdx];
  const grade = calculateGradeOutOf20(userProfile.stageScores);
  const currentAvatar =
    AVATAR_OPTIONS.find((a) => a.id === userProfile.avatarId) || AVATAR_OPTIONS[0];

  // Current target word for adaptive guidance
  const currentTargetNode =
    currentStepIndex < graph.totalLayers ? graph.targetPath[currentStepIndex] : undefined;
  const prevTargetNode = currentStepIndex > 0 ? graph.targetPath[currentStepIndex - 1] : undefined;
  const adaptiveAdvice =
    strugglingAttempts >= 2 && currentTargetNode
      ? generateSmartHintForStrugglingPlayer(currentTargetNode.word, prevTargetNode?.word)
      : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-1.5 sm:p-4 select-none">
      {/* TOP FLOATING DASHBOARD */}
      <div className="pointer-events-auto flex flex-col gap-1 max-w-2xl mx-auto w-full">
        <div className="hud-panel p-1.5 sm:p-2.5 rounded-2xl relative shadow-2xl border border-cyan-400/40">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          {/* Top Line: Stage Selector, Grade /20, XP, Fullscreen */}
          <div className="flex items-center justify-between border-b border-cyan-500/25 pb-1.5 mb-1.5 gap-1.5">
            {/* Stage Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSentenceMenuOpen(!isSentenceMenuOpen)}
                className="flex items-center gap-1.5 bg-slate-900/90 text-cyan-300 border border-cyan-500/40 rounded-xl px-2 py-1 text-xs font-bold hover:border-cyan-300 transition active:scale-95"
                aria-label="انتخاب مرحله"
              >
                <span>مرحله {currentSentenceIdx + 1} از {PRESET_SENTENCES.length}</span>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              {/* Dropdown Menu */}
              {isSentenceMenuOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-72 max-h-60 overflow-y-auto bg-slate-950/95 border border-cyan-400/50 rounded-xl shadow-2xl p-1.5 z-50 divide-y divide-cyan-500/10">
                  {PRESET_SENTENCES.map((sent, idx) => {
                    const isDone = userProfile.completedStages.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          onSelectSentence(idx);
                          setIsSentenceMenuOpen(false);
                        }}
                        className={`w-full text-right p-2 text-xs rounded-lg transition flex items-start gap-1.5 ${
                          idx === currentSentenceIdx
                            ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40'
                            : 'text-gray-300 hover:bg-slate-900'
                        }`}
                      >
                        <span className="mono-font text-cyan-400 text-[10px] mt-0.5">
                          {isDone ? '✓' : `${idx + 1}.`}
                        </span>
                        <span className="leading-snug truncate">{sent}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Middle Badges: 0-20 Official Grade Pill (Click to open certificate) */}
            <button
              onClick={onOpenShareCard}
              className="flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400/50 hover:border-amber-300 px-2 py-1 rounded-xl text-xs font-bold text-amber-200 transition active:scale-95 shadow-sm"
              title="مشاهده کارنامه رسمی نمره از ۲۰ و اشتراک‌گذاری"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="mono-font text-white">{grade.formattedGrade}</span>
              <span className="text-[10px] text-amber-300/80">/ ۲۰</span>
            </button>

            {/* Streak & XP Badges & Timer */}
            <div className="flex items-center gap-1.5">
              {/* Countdown Timer Badge (Active in higher stages 6-10) */}
              {timeRemaining !== null && (
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                    timeRemaining <= 5
                      ? 'bg-rose-950 border-rose-400 text-rose-200 animate-pulse ring-1 ring-rose-500/50 shadow-md shadow-rose-500/40'
                      : 'bg-slate-950/80 border-cyan-500/40 text-cyan-200 shadow-sm'
                  }`}
                  title="زمان باقیمانده برای این توکن"
                >
                  <Timer className={`w-3.5 h-3.5 ${timeRemaining <= 5 ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
                  <span>{timeRemaining}s</span>
                </div>
              )}

              {streak > 1 && (
                <div className="hidden xs:flex items-center gap-1 bg-gradient-to-r from-amber-950 to-orange-950 border border-amber-500/50 px-2 py-0.5 rounded-lg text-amber-300 text-xs font-bold font-mono animate-pulse shadow-md shadow-amber-500/20">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{streak}x</span>
                </div>
              )}

              <div className="flex items-center gap-1 bg-slate-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-xs font-mono font-bold text-white shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-cyan-300">{score}</span>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
                title={isFullscreen ? 'خروج از تمام‌صفحه' : 'حالت تمام‌صفحه بازی'}
                aria-label="تمام صفحه"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Real-Time Sentence Construction Path */}
          <div className="bg-slate-950/80 p-2 rounded-xl border border-cyan-500/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-cyan-400/80 font-mono">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                جمله در حال ساخت (توکن {Math.min(currentStepIndex + 1, graph.totalLayers)} از {graph.totalLayers}):
              </span>
              <span>{Math.round((Math.min(currentStepIndex, graph.totalLayers) / graph.totalLayers) * 100)}%</span>
            </div>

            {/* Token Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {graph.targetPath.map((target, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                if (isPassed) {
                  return (
                    <span
                      key={target.id}
                      className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold"
                    >
                      {target.word}
                    </span>
                  );
                } else if (isCurrent) {
                  return (
                    <span
                      key={target.id}
                      className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-400/40 animate-pulse border border-cyan-200"
                    >
                      [ ؟ کلمه بعدی ]
                    </span>
                  );
                } else {
                  return (
                    <span
                      key={target.id}
                      className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-slate-900/50 border border-slate-800/80 text-gray-500 font-mono tracking-tight"
                    >
                      توکن {idx + 1}
                    </span>
                  );
                }
              })}
            </div>
          </div>
        </div>

        {/* Adaptive Teaching Assistance for Struggling Players */}
        {adaptiveAdvice && (
          <div className="bg-gradient-to-r from-amber-950/90 to-purple-950/90 backdrop-blur-md p-2.5 rounded-xl border border-amber-400/60 shadow-xl text-xs text-amber-200 flex items-start gap-2 animate-in slide-in-from-top-2 duration-300">
            <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 leading-relaxed">
              <span className="font-bold text-amber-100 block mb-0.5">آموزش گام‌به‌گام شبکه:</span>
              <span>{adaptiveAdvice}</span>
            </div>
          </div>
        )}

        {/* Live Feedback Toast or Challenge Prompt */}
        {feedbackText ? (
          <div
            className={`p-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xl animate-in zoom-in-95 duration-200 ${
              feedbackType === 'success'
                ? 'bg-emerald-950/85 border-emerald-400 text-emerald-200'
                : 'bg-amber-950/85 border-amber-400 text-amber-200'
            }`}
          >
            {feedbackType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{feedbackText}</span>
          </div>
        ) : (
          <div className="bg-slate-950/70 backdrop-blur-md p-1.5 rounded-xl border border-cyan-500/30 text-[11px] text-cyan-200 text-center font-semibold shadow-lg flex items-center justify-center gap-1.5">
            <span className="text-amber-400">🎯 چالش هوش مصنوعی:</span>
            <span>نورون صحیح با بالاترین درصد احتمال را روی نمودار لمس کن!</span>
          </div>
        )}
      </div>

      {/* Stage Victory Banner (when sentence is completed) */}
      {isStageCompleted && (
        <div className="pointer-events-auto max-w-md mx-auto w-full hud-panel p-4 rounded-2xl border-2 border-emerald-400 shadow-2xl animate-in zoom-in-95 duration-300 text-center space-y-2.5 my-auto">
          <div className="text-3xl animate-bounce">🎉 🏆 🎉</div>
          <h3 className="text-base sm:text-lg font-bold text-emerald-300">
            آفرین {userProfile.name}! این جمله حکمت‌آمیز کامل شد!
          </h3>
          <p className="text-xs sm:text-sm text-gray-200 bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/30 leading-relaxed font-medium">
            «{rawSentence}»
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <HoldToConfirmButton
              onConfirm={onResetStage}
              label="تکرار مرحله"
              icon={<RotateCcw className="w-3.5 h-3.5 text-gray-300" />}
              holdDurationMs={1000}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-gray-300 border border-slate-700 rounded-xl text-xs font-semibold"
              tooltip="برای تکرار مرحله، دکمه را نگه دارید"
            />
            <button
              onClick={onNextStage}
              className="px-5 py-2 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-emerald-400/30 flex items-center gap-1.5 transition active:scale-95"
            >
              <span>مرحله بعدی (+۲ نمره)</span>
              <SkipForward className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* MINIMAL BOTTOM FLOATING CONTROL DOCK (Clean, mobile-optimized, theme moved to Settings) */}
      <div className="pointer-events-auto max-w-lg mx-auto w-full pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)]">
        <div className="hud-panel p-2 rounded-2xl relative shadow-2xl border border-cyan-500/30 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          {/* 1. Main Menu Button */}
          <button
            onClick={onOpenMenu}
            className="p-2 sm:px-3 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-gray-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 transition active:scale-95"
            title="منوی اصلی بازی"
            aria-label="منوی اصلی"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">منو</span>
          </button>

          {/* 2. Reset Camera Button: Viewport Icon (Scan) & NO text label */}
          <button
            onClick={onResetCamera}
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center border ${
              isCameraCustomized
                ? 'bg-cyan-500/30 text-cyan-100 border-cyan-400 animate-pulse shadow-md shadow-cyan-400/30'
                : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-slate-700'
            }`}
            title="بازنشانی زاویه دید (Viewport)"
            aria-label="Viewport"
          >
            <Scan className="w-4 h-4 text-cyan-300" />
            {isCameraCustomized && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1" />}
          </button>

          {/* 3. Hold-to-Confirm Restart Stage Button (User-Requested: hold to fill progress) */}
          <HoldToConfirmButton
            onConfirm={onResetStage}
            label="شروع مجدد"
            icon={<RotateCcw className="w-3.5 h-3.5 text-rose-300" />}
            holdDurationMs={1200}
            className="p-1.5 px-2.5 sm:px-3 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-rose-200 border border-rose-500/30 rounded-xl text-xs"
            tooltip="برای شروع مجدد این مرحله، دکمه را چند ثانیه نگه دارید"
          />

          {/* 4. Hint Button */}
          <button
            onClick={onTriggerHint}
            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
            title="راهنمایی برای تشخیص کلمه صحیح"
            aria-label="راهنمایی"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] sm:text-xs">راهنما</span>
          </button>

          {/* 5. Settings Button (Themes & Options) */}
          <button
            onClick={onOpenSettings}
            className="p-2 sm:px-2.5 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs transition active:scale-95 flex items-center gap-1"
            title="تنظیمات، تم‌های رنگی و پشتیبانی"
            aria-label="تنظیمات"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">تنظیمات</span>
          </button>
        </div>
      </div>
    </div>
  );
}
