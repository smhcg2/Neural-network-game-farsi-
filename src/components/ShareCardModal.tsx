import { useState } from 'react';
import { UserProfile, calculateGradeOutOf20 } from '../utils/transformerLogic.ts';
import { AVATAR_OPTIONS, INITIAL_MEDALS, EITAA_SUPPORT_URL, GAME_TITLE } from '../utils/constants.ts';
import {
  X,
  Share2,
  Copy,
  Check,
  Trophy,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export function ShareCardModal({ isOpen, onClose, userProfile }: ShareCardModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const avatar = AVATAR_OPTIONS.find((a) => a.id === userProfile.avatarId) || AVATAR_OPTIONS[0];
  const grade = calculateGradeOutOf20(userProfile.stageScores);

  const unlockedMedals = INITIAL_MEDALS.filter((m) =>
    userProfile.unlockedMedalIds?.includes(m.id)
  );

  const shareText = `🎓 کارنامه هوش مصنوعی من در بازی «${GAME_TITLE}»:
👤 نام بازیکن: ${userProfile.name}
⭐ نمره کسب شده: ${grade.formattedGrade} از ۲۰
🎖 رتبه: ${grade.rankTitle}
🏅 مدال‌ها: ${unlockedMedals.length > 0 ? unlockedMedals.map((m) => m.icon + ' ' + m.name).join(' | ') : 'شروع مسیر یادگیری'}
🚀 مراحل تکمیل‌شده: ${userProfile.completedStages.length} از ۱۰

💬 کانال آموزش هوش مصنوعی: ${EITAA_SUPPORT_URL}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `کارنامه ${userProfile.name} در ${GAME_TITLE}`,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in zoom-in-95 duration-200">
      <div className="hud-panel w-full max-w-md p-4 sm:p-6 rounded-3xl relative shadow-2xl border-2 border-cyan-400/50 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              کارنامه رسمی بازیکن (نمره از ۲۰)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable/Shareable Card Preview */}
        <div
          id="certificate-card"
          className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/70 p-4 rounded-2xl border-2 border-cyan-400/60 shadow-xl relative overflow-hidden mb-4"
        >
          {/* Hologram lines effect */}
          <div className="absolute inset-0 scanline opacity-25 pointer-events-none" />

          {/* Player Banner */}
          <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-3 mb-3">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-3xl shadow-lg border-2 border-white/30 shrink-0`}
            >
              {avatar.emoji}
            </div>
            <div>
              <div className="text-[10px] text-cyan-400 font-mono tracking-wider">دانش‌آموز هوش مصنوعی:</div>
              <h3 className="text-base sm:text-lg font-black text-white">{userProfile.name}</h3>
              <span className="text-[11px] text-gray-400">{avatar.name}</span>
            </div>
          </div>

          {/* Grade Display */}
          <div className="text-center py-2.5 bg-slate-950/80 rounded-xl border border-cyan-500/30 mb-3">
            <div className="text-[10px] text-gray-400 font-mono mb-0.5">نمره نهایی عملکرد شما:</div>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-emerald-300 mono-font">
                {grade.formattedGrade}
              </span>
              <span className="text-base text-gray-400 font-bold font-mono">/ ۲۰.۰</span>
            </div>
            <div className="text-xs font-bold mt-1" style={{ color: grade.color }}>
              {grade.rankTitle}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-gray-400">مراحل تکمیل‌شده:</div>
              <div className="font-bold text-cyan-300 font-mono text-sm mt-0.5">
                {userProfile.completedStages.length} از ۱۰
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-gray-400">بالاترین کمبو:</div>
              <div className="font-bold text-amber-300 font-mono text-sm mt-0.5">
                {userProfile.highestStreak}x پیاپی 🔥
              </div>
            </div>
          </div>

          {/* Medals Showcase */}
          <div className="border-t border-cyan-500/20 pt-2.5">
            <div className="text-[11px] font-bold text-gray-300 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                مدال‌های کسب‌شده:
              </span>
              <span className="mono-font text-cyan-300 text-[10px]">
                {unlockedMedals.length} از {INITIAL_MEDALS.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {INITIAL_MEDALS.map((m) => {
                const isUnlocked = userProfile.unlockedMedalIds?.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold ${
                      isUnlocked
                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-200 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800 text-gray-600 opacity-50 grayscale'
                    }`}
                    title={m.desc}
                  >
                    <span>{m.icon}</span>
                    <span>{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/25 active:scale-95 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>ارسال و اشتراک‌گذاری کارنامه</span>
          </button>

          <button
            onClick={handleCopyText}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">متن کارنامه کپی شد! در ایتا یا شاد پیست کنید ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>کپی متن کارنامه برای ارسال به معلم و دوستان</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center mt-3 pt-2 border-t border-cyan-500/20 text-[10px] text-gray-400">
          دوره آموزش هوش مصنوعی: {EITAA_SUPPORT_URL}
        </div>
      </div>
    </div>
  );
}
