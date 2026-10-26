import { useState } from 'react';
import { NetworkGraph } from '../utils/transformerLogic.ts';
import {
  Brain,
  ChevronLeft,
  Lightbulb,
  X,
  FastForward,
} from 'lucide-react';

interface StageOneInteractiveGuideProps {
  graph: NetworkGraph;
  currentStepIndex: number;
  isStageCompleted: boolean;
  onNextStage: () => void;
  onSkipTutorial?: () => void;
}

export function StageOneInteractiveGuide({
  graph,
  currentStepIndex,
  isStageCompleted,
  onNextStage,
  onSkipTutorial,
}: StageOneInteractiveGuideProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className="pointer-events-auto fixed bottom-24 right-4 z-30 animate-in fade-in">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 backdrop-blur-md active:scale-95 transition"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>باز کردن راهنمای گام‌به‌گام</span>
        </button>
      </div>
    );
  }

  // Active target node to touch
  const targetNode =
    currentStepIndex < graph.totalLayers ? graph.targetPath[currentStepIndex] : undefined;
  const promptWord = graph.targetPath[0]?.word || '';
  const currentTargetWord = targetNode?.word || '';
  const prevWord = currentStepIndex > 0 ? graph.targetPath[currentStepIndex - 1]?.word : promptWord;

  let stepTitle = '';
  let stepDescription = '';
  let actionInstruction = '';

  if (currentStepIndex === 1) {
    stepTitle = 'گام ۱: پرامپت ورودی و اولین حدس مدل';
    stepDescription = `به مغز هوش مصنوعی خوش آمدید! 🧠 کلمه اول «${promptWord}» پرامپتی است که ما به هوش مصنوعی داده‌ایم. مدل بر اساس آموخته‌هایش به دنبال محتمل‌ترین کلمه بعدی است.`;
    actionInstruction = `روی نورون شناور درخشان «${currentTargetWord}» لمس کن!`;
  } else if (currentStepIndex === 2) {
    stepTitle = 'گام ۲: خط ارتباط عصبی (سیناپس)';
    stepDescription = `آفرین! خط نوری سبز بین «${prevWord}» و «${currentTargetWord}» نشان‌دهنده رابطه معنایی قوی است که مدل تشخیص داده است.`;
    actionInstruction = `حالا روی نورون بعدی «${currentTargetWord}» ضربه بزن!`;
  } else if (!isStageCompleted) {
    stepTitle = `گام ${currentStepIndex}: درصد احتمال (Softmax)`;
    stepDescription = `به درصد شانس هر کلمه توجه کن. کلمه‌ای که بالاترین درصد احتمال را دارد، منطقی‌ترین انتخاب برای ادامه جمله است.`;
    actionInstruction = `نورون درخشان «${currentTargetWord}» را لمس کن!`;
  } else {
    stepTitle = '🎉 تبریک! اولین جمله را با هوش مصنوعی کامل کردی!';
    stepDescription = `تو یاد گرفتی که مدل‌های زبانی کلمات را توکن‌به‌توکن می‌سازند. در مراحل بعد تعداد گزینه‌ها بیشتر و چالش‌ها جذاب‌تر خواهند شد!`;
    actionInstruction = `روی دکمه زیر کلیک کن تا به مرحله ۲ بروی:`;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center p-3 select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="pointer-events-auto w-full max-w-lg hud-panel rounded-2xl p-3.5 sm:p-4 bg-slate-950/95 border-2 border-cyan-400 shadow-2xl relative">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Header with Step Counter, Skip and Minimize */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-2 gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shrink-0">
              <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
            </span>
            <span className="text-xs sm:text-sm font-black text-white truncate">
              {stepTitle}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Skip Tutorial Button */}
            {onSkipTutorial && (
              <button
                onClick={onSkipTutorial}
                className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[11px] font-bold text-amber-300 flex items-center gap-1 transition active:scale-95 cursor-pointer"
                title="رد کردن کامل آموزش و بازی آزادانه"
              >
                <FastForward className="w-3 h-3" />
                <span>رد کردن آموزش</span>
              </button>
            )}

            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold">
              گام {Math.min(currentStepIndex, graph.totalLayers - 1)} از {Math.max(1, graph.totalLayers - 1)}
            </span>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-slate-800 transition"
              title="کوچک‌کردن راهنما"
              aria-label="بستن"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Educational Concept Explanation */}
        <p className="text-xs sm:text-[13px] text-gray-200 leading-relaxed mb-2.5 font-normal">
          {stepDescription}
        </p>

        {/* Concrete Action Prompt to Touch */}
        {!isStageCompleted ? (
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-950/70 via-cyan-950/70 to-emerald-950/70 border border-amber-400/60 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0 animate-bounce text-xs">
                👇
              </div>
              <div className="leading-tight">
                <span className="block text-[10px] font-bold text-amber-300">اقدام شما:</span>
                <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                  {actionInstruction}
                </span>
              </div>
            </div>

            <div className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs animate-pulse shadow-md shadow-emerald-400/40">
              «{currentTargetWord}»
            </div>
          </div>
        ) : (
          <button
            onClick={onNextStage}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <span>ورود به مرحله ۲ (افزایش گزینه‌ها به ۳ کلمه)</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
