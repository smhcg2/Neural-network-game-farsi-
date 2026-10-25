import { useState } from 'react';
import { ThemeColor, THEMES, EITAA_SUPPORT_URL, AVATAR_OPTIONS } from '../utils/constants.ts';
import { UserProfile } from '../utils/transformerLogic.ts';
import { soundManager } from '../utils/soundEffects.ts';
import {
  X,
  Palette,
  Gauge,
  Activity,
  MessageCircle,
  ExternalLink,
  RotateCcw,
  User,
  Check,
  Volume2,
  VolumeX,
  Smartphone,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColor;
  onChangeTheme: (theme: ThemeColor) => void;
  noiseIntensity: number;
  onChangeNoise: (noise: number) => void;
  userProfile: UserProfile;
  onUpdateProfile: (name: string, avatarId: string) => void;
  onResetProgress: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  noiseIntensity,
  onChangeNoise,
  userProfile,
  onUpdateProfile,
  onResetProgress,
}: SettingsModalProps) {
  const [name, setName] = useState(userProfile.name);
  const [avatarId, setAvatarId] = useState(userProfile.avatarId);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(() => soundManager.isSoundEnabled());
  const [isVibrateOn, setIsVibrateOn] = useState(() => soundManager.isVibrationEnabled());

  const handleToggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    soundManager.setSoundEnabled(next);
    if (next) soundManager.playCorrect();
  };

  const handleToggleVibration = () => {
    const next = !isVibrateOn;
    setIsVibrateOn(next);
    soundManager.setVibrationEnabled(next);
    if (next) soundManager.vibrate(50);
  };

  const currentAvatarOption =
    AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    if (name.trim()) {
      onUpdateProfile(name.trim(), avatarId);
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="hud-panel w-full max-w-md p-4 sm:p-6 rounded-3xl relative shadow-2xl border border-cyan-400/50 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-4">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>⚙</span>
            <span>تنظیمات بازی و تم</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="بستن تنظیمات"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Theme Color Picker Section */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-cyan-500/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-200 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                تم و رنگ‌بندی بازی (HUD Theme):
              </span>
              <span className="text-cyan-300 font-semibold">{theme.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => {
                const isActive = theme.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onChangeTheme(t)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                      isActive
                        ? 'border-white bg-slate-800 shadow-md ring-1 ring-white/50'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 opacity-80'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/50 shrink-0"
                      style={{ backgroundColor: t.cssColor }}
                    />
                    <span className="truncate text-white font-medium">{t.name}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-white mr-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Profile (Name & Profession Avatar) */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-cyan-500/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-200 flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                ویرایش نام و شغل آینده:
              </span>
              <span className="text-[11px] text-cyan-300 font-medium">
                {currentAvatarOption.emoji} {currentAvatarOption.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام شما"
                className="flex-1 bg-slate-900 text-white border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleSaveProfile}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs active:scale-95 transition"
              >
                {isSavedNotice ? 'ذخیره شد! ✓' : 'ذخیره'}
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-900/60 rounded-xl border border-slate-800 scrollbar-thin">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAvatarId(a.id)}
                  className={`p-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                    avatarId === a.id
                      ? 'bg-cyan-500/30 border border-cyan-400 shadow-sm scale-105'
                      : 'opacity-70 hover:opacity-100 hover:bg-slate-800'
                  }`}
                  title={a.name}
                >
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-[8px] truncate max-w-full text-gray-300">{a.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Sliders */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-cyan-500/25 space-y-3">
            {/* Speed Slider */}
            {/* Noise Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  شدت نویز سه‌بعدی:
                </span>
                <span className="mono-font text-cyan-300 font-bold">{noiseIntensity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={noiseIntensity}
                onChange={(e) => onChangeNoise(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Sound & Haptics (Audio & Vibration Controls) */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-cyan-500/25 space-y-2.5">
            <span className="font-bold text-gray-200 block text-xs">صدا و لرزش (Audio & Haptics):</span>
            <div className="grid grid-cols-2 gap-2">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer active:scale-95 ${
                  isSoundOn
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isSoundOn ? (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-bold text-[11px]">{isSoundOn ? 'صدای بازی فعال' : 'صدا قطع'}</span>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSoundOn ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-gray-600'
                  }`}
                />
              </button>

              {/* Vibration Toggle */}
              <button
                type="button"
                onClick={handleToggleVibration}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer active:scale-95 ${
                  isVibrateOn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-[11px]">{isVibrateOn ? 'ویبره فعال' : 'ویبره قطع'}</span>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isVibrateOn ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-gray-600'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Eitaa Support Button */}
          <div className="bg-orange-950/40 p-3 rounded-2xl border border-orange-500/40 flex items-center justify-between">
            <div>
              <span className="font-bold text-orange-300 block text-xs">پشتیبانی و ارتباط در ایتا:</span>
              <span className="text-[11px] text-gray-300 font-mono">eitaa.com/dore_ai</span>
            </div>
            <a
              href={EITAA_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition active:scale-95 shadow-md shadow-orange-500/20"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>باز کردن</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Reset All Progress Button */}
          <div className="pt-2 text-center">
            <button
              onClick={() => {
                if (window.confirm('آیا مطمئنی می‌خواهی تمام پیشرفت و نمره‌ها پاک شوند و از صفر شروع کنی؟')) {
                  onResetProgress();
                  onClose();
                }
              }}
              className="text-red-400 hover:text-red-300 text-xs flex items-center justify-center gap-1 mx-auto py-1 px-3 rounded-lg hover:bg-red-950/40 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>پاک‌سازی نمره‌ها و شروع از نو</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
