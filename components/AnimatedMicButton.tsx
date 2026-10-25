import React, { useEffect, useRef } from 'react';

interface AnimatedMicButtonProps {
  isOn: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const AnimatedMicButton: React.FC<AnimatedMicButtonProps> = ({
  isOn,
  onClick,
  disabled = false,
  className = '',
}) => {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const heightsRef = useRef<number[]>([0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12]);
  const levelRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const MIN = 0.12;
    const numBars = 7;

    const frame = (t: number) => {
      const time = t / 1000;
      levelRef.current += ((isOn ? 1 : 0) - levelRef.current) * 0.08;

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const w = Math.sin(time * 3.2 + i * 0.7) * 0.5 + 0.5;
        const w2 = Math.sin(time * 5.1 + i * 1.3) * 0.5 + 0.5;
        const centre = 1 - Math.abs(i - (numBars - 1) / 2) / numBars;
        const target = MIN + (0.25 + 0.75 * (w * 0.6 + w2 * 0.4)) * centre * levelRef.current;
        heightsRef.current[i] += (target - heightsRef.current[i]) * 0.18;
        bar.style.transform = `scaleY(${heightsRef.current[i].toFixed(3)})`;
      });

      if (isOn || levelRef.current > 0.01) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        rafRef.current = null;
      }
    };

    if (isOn || levelRef.current > 0.01) {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(frame);
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isOn]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isOn}
      aria-label="Toggle microphone"
      title={isOn ? "Mic is ON (Click to mute)" : "Mic is OFF (Click to start speech)"}
      className={`group relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 select-none overflow-hidden rounded-2xl shadow-sm
        ${isOn 
          ? 'bg-[#22c55e] text-white shadow-emerald-500/30 ring-4 ring-emerald-500/20 px-3.5 py-2 min-w-[62px] h-[48px]' 
          : 'bg-[#475569] hover:bg-[#334155] text-white px-3 py-2 min-w-[48px] h-[48px]'}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}`}
    >
      {/* Mic SVG with animated slash */}
      <svg
        className={`transition-transform duration-300 ${isOn ? 'w-5 h-5 -translate-y-0.5' : 'w-5 h-5'}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
        {/* Animated slash line: draws out (hidden) when ON, draws in (visible) when OFF */}
        <line
          x1="3"
          y1="3"
          x2="21"
          y2="21"
          stroke="#ffffff"
          strokeWidth="2.5"
          style={{
            strokeDasharray: 30,
            strokeDashoffset: isOn ? 30 : 0,
            transition: 'stroke-dashoffset 0.35s ease',
          }}
        />
      </svg>

      {/* Waveform below the mic, only visible & expanding when ON */}
      <div
        className={`flex items-center justify-center gap-[3px] overflow-hidden transition-all duration-400 ease-in-out
          ${isOn ? 'opacity-100 h-3.5 mt-0.5' : 'opacity-0 h-0 mt-0 pointer-events-none'}`}
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <span
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className="w-[3px] h-full rounded-[2px] bg-white origin-bottom will-change-transform"
            style={{ transform: 'scaleY(0.12)' }}
          />
        ))}
      </div>
    </button>
  );
};

export default AnimatedMicButton;
