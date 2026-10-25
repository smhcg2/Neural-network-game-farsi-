import { useState } from 'react';
import { QuizQuestion } from '../utils/constants.ts';
import { soundManager } from '../utils/soundEffects.ts';
import { Sparkles, CheckCircle2, XCircle, ArrowLeft, Trophy, BookOpen } from 'lucide-react';

interface QuizModalProps {
  quiz: QuizQuestion;
  isOpen: boolean;
  onComplete: (earnedXp: number) => void;
}

export function QuizModal({ quiz, isOpen, onComplete }: QuizModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  if (!isOpen) return null;

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedIndex(idx);
    setHasAnswered(true);

    if (idx === quiz.correctIndex) {
      soundManager.playQuizSuccess();
    } else {
      soundManager.playWrong();
    }
  };

  const handleProceed = () => {
    const isCorrect = selectedIndex === quiz.correctIndex;
    const earned = isCorrect ? quiz.rewardXp : Math.floor(quiz.rewardXp * 0.4);
    onComplete(earned);
  };

  const isCorrect = selectedIndex === quiz.correctIndex;

  return (
    <div className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none animate-in fade-in duration-200">
      <div className="hud-panel w-full max-w-lg p-5 sm:p-7 rounded-3xl relative shadow-2xl border-2 border-cyan-400/50 bg-slate-950/90 text-right space-y-4">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-cyan-500/25 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-cyan-300">
              آزمون دانش شبکه عصبی (بین مراحل)
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>+{quiz.rewardXp} XP</span>
          </span>
        </div>

        {/* Question Title & Prompt */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{quiz.question}</span>
          </h3>
          <p className="text-xs text-gray-400">
            بر اساس مفاهیم آموزشی که در مراحل قبل دیدی، بهترین پاسخ را انتخاب کن:
          </p>
        </div>

        {/* 4 Multiple Choice Options */}
        <div className="space-y-2 pt-1">
          {quiz.options.map((opt, idx) => {
            const isChosen = selectedIndex === idx;
            const isRight = idx === quiz.correctIndex;

            let btnStyle = 'bg-slate-900/80 border-slate-800 text-gray-200 hover:bg-slate-800 hover:border-cyan-500/40';
            if (hasAnswered) {
              if (isRight) {
                btnStyle = 'bg-emerald-950/90 border-emerald-400 text-emerald-200 font-bold shadow-md shadow-emerald-500/20';
              } else if (isChosen && !isRight) {
                btnStyle = 'bg-rose-950/80 border-rose-400 text-rose-200 font-bold';
              } else {
                btnStyle = 'bg-slate-900/40 border-slate-800/60 text-gray-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={hasAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-3 sm:p-3.5 rounded-2xl border text-xs sm:text-sm text-right flex items-center justify-between gap-3 transition cursor-pointer active:scale-98 ${btnStyle}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-slate-700">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{opt}</span>
                </div>

                {hasAnswered && isRight && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {hasAnswered && isChosen && !isRight && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback & Explanation Card */}
        {hasAnswered && (
          <div
            className={`p-3.5 rounded-2xl border text-xs leading-relaxed animate-in slide-in-from-top-2 duration-300 ${
              isCorrect
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100'
                : 'bg-amber-950/80 border-amber-400 text-amber-100'
            }`}
          >
            <div className="font-bold mb-1 flex items-center gap-1.5">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>آفرین! پاسخ کاملاً صحیح است (+{quiz.rewardXp} XP)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>آموزش شبکه: پاسخ صحیح گزینه {quiz.correctIndex + 1} بود (+{Math.floor(quiz.rewardXp * 0.4)} XP)</span>
                </>
              )}
            </div>
            <p className="text-gray-300">{quiz.explanation}</p>
          </div>
        )}

        {/* Proceed Action Button */}
        {hasAnswered && (
          <div className="pt-2">
            <button
              onClick={handleProceed}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <span>ادامه مسیر و ورود به مرحله بعد</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
