import { useState, useRef, useEffect } from 'react';
import { soundManager } from '../utils/soundEffects.ts';

interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  holdDurationMs?: number;
  className?: string;
  icon?: React.ReactNode;
  label?: string;
  tooltip?: string;
}

export function HoldToConfirmButton({
  onConfirm,
  holdDurationMs = 1200,
  className = '',
  icon,
  label = 'نگه دارید',
  tooltip = 'برای تایید نگه دارید',
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0); // 0 to 1
  const [isHolding, setIsHolding] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickProgressRef = useRef<number>(0);

  const startHold = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsHolding(true);
    setProgress(0);
    startTimeRef.current = performance.now();
    lastTickProgressRef.current = 0;

    const tick = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const currentProg = Math.min(1.0, elapsed / holdDurationMs);
      setProgress(currentProg);

      // Play rising tick sound every 25%
      if (currentProg - lastTickProgressRef.current >= 0.22) {
        lastTickProgressRef.current = currentProg;
        soundManager.playHoldTick(currentProg);
      }

      if (currentProg >= 1.0) {
        // Confirmation triggered!
        setIsHolding(false);
        setProgress(0);
        startTimeRef.current = null;
        soundManager.playResetConfirmed();
        onConfirm();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const cancelHold = () => {
    if (!isHolding) return;
    setIsHolding(false);
    setProgress(0);
    startTimeRef.current = null;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <button
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
      title={tooltip}
      aria-label={label}
      className={`relative overflow-hidden select-none touch-none cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 ${className}`}
    >
      {/* Background Fill Progress Bar */}
      <span
        className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-500/50 via-amber-500/50 to-cyan-500/40 pointer-events-none transition-all duration-75"
        style={{
          width: `${progress * 100}%`,
          opacity: isHolding ? 1 : 0,
        }}
      />

      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-1">
        {icon}
        {label && <span className="text-[11px] sm:text-xs font-bold">{label}</span>}
      </span>

      {/* Holding hint ring or pulse */}
      {isHolding && (
        <span className="absolute inset-0 border-2 border-rose-400 rounded-xl animate-pulse pointer-events-none" />
      )}
    </button>
  );
}
