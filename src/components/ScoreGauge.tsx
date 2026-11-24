import { useAnimatedNumber } from '../lib/useAnimatedNumber';

interface Props {
  score: number;
  size?: number;
  label?: string;
  sublabel?: string;
  thickness?: number;
}

export default function ScoreGauge({ score, size = 190, label = 'ATS Score', sublabel, thickness = 14 }: Props) {
  const animated = useAnimatedNumber(score);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * animated) / 100;

  const color = score >= 85 ? '#34d399' : score >= 70 ? '#60a5fa' : score >= 55 ? '#fbbf24' : '#f87171';
  const glow = score >= 85 ? 'rgba(52,211,153,0.35)' : score >= 70 ? 'rgba(96,165,250,0.35)' : score >= 55 ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.35)';

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={`gauge-${size}-${Math.round(score)}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={thickness} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#gauge-${size}-${Math.round(score)})`}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 10px ${glow})`, transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold tabular-nums text-white sm:text-5xl" style={{ fontSize: size / 4.4 }}>
            {animated}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">/ 100</span>
        </div>
      </div>
      {label && (
        <div className="mt-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          {sublabel && <p className="mt-1 text-sm font-medium" style={{ color }}>{sublabel}</p>}
        </div>
      )}
    </div>
  );
}
