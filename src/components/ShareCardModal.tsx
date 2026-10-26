import { useState, useRef } from 'react';
import { UserProfile, calculateGradeOutOf20 } from '../utils/transformerLogic.ts';
import { AVATAR_OPTIONS, INITIAL_MEDALS, EITAA_SUPPORT_URL, GAME_TITLE } from '../utils/constants.ts';
import {
  X,
  Share2,
  Download,
  Check,
  Trophy,
  Award,
  Sparkles,
  RotateCcw,
  Home,
  Brain,
} from 'lucide-react';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onPlayAgain?: () => void;
  onGoHome?: () => void;
}

export function ShareCardModal({
  isOpen,
  onClose,
  userProfile,
  onPlayAgain,
  onGoHome,
}: ShareCardModalProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const avatar = AVATAR_OPTIONS.find((a) => a.id === userProfile.avatarId) || AVATAR_OPTIONS[0];
  const grade = calculateGradeOutOf20(userProfile.stageScores, userProfile.quizScores);

  const unlockedMedals = INITIAL_MEDALS.filter((m) =>
    userProfile.unlockedMedalIds?.includes(m.id)
  );

  /**
   * Generates a high-resolution 3:4 aspect ratio card as a Canvas PNG Blob
   */
  const generateCardCanvasBlob = async (): Promise<Blob | null> => {
    // 3:4 aspect ratio: 900 x 1200 pixels (sharp high-DPI)
    const width = 900;
    const height = 1200;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Deep Space Tech Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.4, '#08172b');
    bgGrad.addColorStop(0.8, '#0b1d3a');
    bgGrad.addColorStop(1, '#030a16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Futuristic Grid & Circuit Lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Glowing Outer Border & Corner Brackets (Cyberpunk Card Aesthetic)
    const margin = 36;
    const cardW = width - margin * 2;
    const cardH = height - margin * 2;
    const radius = 28;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(margin, margin, cardW, cardH, radius);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.6)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Corner decorative accents
    ctx.fillStyle = '#00f3ff';
    const cSize = 18;
    ctx.fillRect(margin - 2, margin - 2, cSize, 6);
    ctx.fillRect(margin - 2, margin - 2, 6, cSize);
    ctx.fillRect(margin + cardW - cSize + 2, margin - 2, cSize, 6);
    ctx.fillRect(margin + cardW - 4, margin - 2, 6, cSize);
    ctx.fillRect(margin - 2, margin + cardH - 4, cSize, 6);
    ctx.fillRect(margin - 2, margin + cardH - cSize + 2, 6, cSize);
    ctx.fillRect(margin + cardW - cSize + 2, margin + cardH - 4, cSize, 6);
    ctx.fillRect(margin + cardW - 4, margin + cardH - cSize + 2, 6, cSize);
    ctx.restore();

    // 4. Header Badge & Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Subtitle Tag
    ctx.font = 'bold 22px "Vazirmatn", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⚡ کارنامه رسمی دوره آموزشی مدل‌های زبانی هوش مصنوعی ⚡', width / 2, 90);

    // Main App Title
    ctx.font = '900 48px "Vazirmatn", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('سرزمین نورون‌ها (NEUROLAND AI)', width / 2, 145);

    // Separator line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 185);
    ctx.lineTo(width - 80, 185);
    ctx.stroke();

    // 5. Player Identity Section (Avatar emoji & Name)
    // Avatar Circle
    const avatarCenterX = width / 2;
    const avatarCenterY = 275;
    const avatarR = 64;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Avatar Emoji
    ctx.font = '64px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.fillText(avatar.emoji, avatarCenterX, avatarCenterY + 4);

    // Player Name
    ctx.font = '900 36px "Vazirmatn", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(userProfile.name || 'دانش‌آموز هوش مصنوعی', width / 2, 380);

    // Career / Role Tag
    ctx.font = 'bold 22px "Vazirmatn", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`شغل آینده: ${avatar.name}`, width / 2, 420);

    // 6. Huge Grade & Score Section
    // Big container box
    const scoreBoxY = 465;
    const scoreBoxH = 220;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(80, scoreBoxY, width - 160, scoreBoxH, 20);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.font = 'bold 22px "Vazirmatn", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('نمره نهایی عملکرد شما در آزمون و مراحل:', width / 2, scoreBoxY + 38);

    // Giant Grade Number
    ctx.font = '900 78px "Vazirmatn", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText(grade.formattedGrade, width / 2 - 40, scoreBoxY + 115);

    ctx.font = 'bold 36px "Vazirmatn", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('/ ۲۰.۰', width / 2 + 75, scoreBoxY + 120);

    // Rank title
    ctx.font = 'bold 26px "Vazirmatn", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = grade.color || '#38bdf8';
    ctx.fillText(grade.rankTitle, width / 2, scoreBoxY + 180);

    // 7. Breakdown Stats Grid (Stages, Quizzes, Combo)
    const statsY = 715;
    const colW = (width - 160 - 30) / 3;

    // Stat 1: Stages
    ctx.save();
    ctx.roundRect(80, statsY, colW, 110, 16);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.stroke();
    ctx.font = 'bold 18px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('مراحل بازی (۱۰ نمره)', 80 + colW / 2, statsY + 35);
    ctx.font = '900 26px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${grade.stageTotal.toFixed(1)} از ۱۰`, 80 + colW / 2, statsY + 75);
    ctx.restore();

    // Stat 2: Quizzes
    ctx.save();
    ctx.roundRect(80 + colW + 15, statsY, colW, 110, 16);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.stroke();
    ctx.font = 'bold 18px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('آزمون‌ها (۱۰ نمره)', 80 + colW + 15 + colW / 2, statsY + 35);
    ctx.font = '900 26px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText(`${grade.quizTotal.toFixed(1)} از ۱۰`, 80 + colW + 15 + colW / 2, statsY + 75);
    ctx.restore();

    // Stat 3: Combo
    ctx.save();
    ctx.roundRect(80 + (colW + 15) * 2, statsY, colW, 110, 16);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.stroke();
    ctx.font = 'bold 18px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('بالاترین کمبو', 80 + (colW + 15) * 2 + colW / 2, statsY + 35);
    ctx.font = '900 26px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🔥 ${userProfile.highestStreak || 0}x`, 80 + (colW + 15) * 2 + colW / 2, statsY + 75);
    ctx.restore();

    // 8. Medals Awarded Section
    const medalsY = 855;
    ctx.font = 'bold 22px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`🏅 مدال‌های کسب‌شده (${unlockedMedals.length} از ۵ مدال افتخار)`, width / 2, medalsY);

    const medalIcons = INITIAL_MEDALS.map((m) => {
      const isU = userProfile.unlockedMedalIds?.includes(m.id);
      return `${m.icon} ${m.name}${isU ? ' ✓' : ' (قفل)'}`;
    });

    ctx.font = 'bold 19px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(medalIcons.slice(0, 3).join('   |   '), width / 2, medalsY + 45);
    ctx.fillText(medalIcons.slice(3).join('   |   '), width / 2, medalsY + 80);

    // 9. Card Footer & Eitaa Certification Stamp
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath();
    ctx.moveTo(80, 990);
    ctx.lineTo(width - 80, 990);
    ctx.stroke();

    ctx.font = 'bold 22px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('تأییدیه پایان دوره شبیه‌ساز سه‌بعدی ترنسفورمرها', width / 2, 1030);

    ctx.font = 'normal 19px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('کانال آموزش و پشتیبانی هوش مصنوعی در ایتا: @dore_ai', width / 2, 1070);

    const persianDate = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date());
    ctx.font = 'normal 16px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`تاریخ صدور کارنامه: ${persianDate}`, width / 2, 1110);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  /**
   * Main share action: generates PNG image file and shares via Web Share API or downloads
   */
  const handleShareCardImage = async () => {
    setIsGeneratingImage(true);
    setShareFeedback(null);

    try {
      const blob = await generateCardCanvasBlob();
      if (!blob) throw new Error('خطا در ایجاد تصویر');

      const fileName = `neuroland_grade_${userProfile.name || 'player'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Check if navigator.canShare supports files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `کارنامه رسمی ${userProfile.name} در سرزمین نورون‌ها`,
            text: `🎓 کارنامه پایان دوره هوش مصنوعی من:\n⭐ نمره: ${grade.formattedGrade} از ۲۰\n🎖 رتبه: ${grade.rankTitle}\nکانال آموزش هوش مصنوعی در ایتا: @dore_ai`,
          });
          setShareFeedback('تصویر کارنامه با موفقیت به اشتراک گذاشته شد! ✓');
          return;
        } catch (err: unknown) {
          // If user aborted/cancelled share dialog, don't download unnecessarily unless required
          if ((err as Error)?.name === 'AbortError') {
            return;
          }
        }
      }

      // Fallback: direct high-quality PNG download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShareFeedback('✅ تصویر کارنامه (نسبت ۳:۴ باکیفیت PNG) دانلود شد! اکنون می‌توانید در ایتا یا شاد ارسال کنید.');
    } catch {
      setShareFeedback('خطایی در تولید تصویر رخ داد. لطفاً دوباره امتحان کنید.');
    } finally {
      setIsGeneratingImage(false);
      setTimeout(() => setShareFeedback(null), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 select-none animate-in zoom-in-95 duration-200 overflow-y-auto">
      <div className="hud-panel w-full max-w-sm sm:max-w-md p-4 sm:p-5 rounded-3xl relative shadow-2xl border-2 border-cyan-400/60 bg-slate-950/95 flex flex-col my-auto max-h-[95vh] overflow-y-auto">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-bold text-white">
              کارنامه رسمی بازیکن (نسبت ۳:۴)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3:4 Aspect Ratio Visual Card Container */}
        <div
          id="certificate-3x4-card"
          className="w-full aspect-[3/4] bg-gradient-to-b from-slate-950 via-slate-900 to-cyan-950/80 p-3.5 sm:p-4 rounded-2xl border-2 border-cyan-400/70 shadow-2xl relative overflow-hidden flex flex-col justify-between mb-3 text-center"
        >
          {/* Subtle Cyberpunk Scanlines */}
          <div className="absolute inset-0 scanline opacity-20 pointer-events-none" />

          {/* Card Top: Branding */}
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-[9px] font-mono text-cyan-300 mb-1">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>کارنامه رسمی دوره مدل‌های زبانی هوش مصنوعی</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
              {GAME_TITLE}
            </h3>
          </div>

          {/* Card Middle: Avatar & Name */}
          <div className="my-auto py-1">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-3xl sm:text-4xl shadow-xl border-2 border-white/40 mb-1.5`}
            >
              {avatar.emoji}
            </div>
            <h4 className="text-sm sm:text-base font-black text-white">{userProfile.name}</h4>
            <span className="text-[10px] text-cyan-300 font-medium block">
              شغل آینده: {avatar.name}
            </span>

            {/* Giant Score Box */}
            <div className="mt-2.5 py-2 px-3 bg-slate-950/90 rounded-xl border border-cyan-500/40 shadow-inner">
              <div className="text-[9px] text-gray-400 font-mono mb-0.5">
                نمره نهایی عملکرد شما:
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 font-mono">
                  {grade.formattedGrade}
                </span>
                <span className="text-xs text-gray-400 font-bold font-mono">/ ۲۰.۰</span>
              </div>
              <div className="text-[11px] font-bold mt-0.5" style={{ color: grade.color }}>
                {grade.rankTitle}
              </div>
            </div>

            {/* Stage vs Quiz Score Breakdown */}
            <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px]">
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-gray-400 block text-[9px]">مراحل بازی (۱۰ نمره)</span>
                <span className="font-bold text-cyan-300 font-mono">{grade.stageTotal.toFixed(1)} / ۱۰</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-gray-400 block text-[9px]">آزمون‌ها (۱۰ نمره)</span>
                <span className="font-bold text-purple-300 font-mono">{grade.quizTotal.toFixed(1)} / ۱۰</span>
              </div>
            </div>
          </div>

          {/* Card Bottom: Medals & Channel Stamp */}
          <div className="pt-2 border-t border-cyan-500/20">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              {INITIAL_MEDALS.map((m) => {
                const isUnlocked = userProfile.unlockedMedalIds?.includes(m.id);
                return (
                  <span
                    key={m.id}
                    className={`text-sm px-1.5 py-0.5 rounded-md border ${
                      isUnlocked
                        ? 'bg-amber-950/50 border-amber-400/50 grayscale-0'
                        : 'bg-slate-900/50 border-slate-800 grayscale opacity-40'
                    }`}
                    title={m.name}
                  >
                    {m.icon}
                  </span>
                );
              })}
            </div>

            <div className="text-[9px] text-cyan-300/80 font-mono">
              کانال آموزش هوش مصنوعی در ایتا: @dore_ai
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {shareFeedback && (
          <div className="mb-2.5 p-2 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-200 text-xs text-center font-bold animate-in fade-in">
            {shareFeedback}
          </div>
        )}

        {/* Action Buttons Section */}
        {/* Requirement: Top large share button, then two 50% buttons (Play Again & Home) */}
        <div className="space-y-2">
          {/* 1. Large Top Button: Share Card Image (PNG) */}
          <button
            onClick={handleShareCardImage}
            disabled={isGeneratingImage}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-400/30 active:scale-98 transition cursor-pointer disabled:opacity-50"
          >
            {isGeneratingImage ? (
              <>
                <Brain className="w-4 h-4 animate-spin text-slate-950" />
                <span>در حال تبدیل کارنامه به تصویر باکیفیت...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-950" />
                <span>اشتراک‌گذاری تصویر کارت (PNG)</span>
              </>
            )}
          </button>

          {/* 2. Two 50% Side-by-Side Buttons: Play Again & Home */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onPlayAgain?.();
              }}
              className="w-full py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>بازی دوباره</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onGoHome?.();
              }}
              className="w-full py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
            >
              <Home className="w-3.5 h-3.5 text-gray-400" />
              <span>خانه</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
