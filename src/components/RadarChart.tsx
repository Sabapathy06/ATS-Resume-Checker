import { useAnimatedNumber } from '../lib/useAnimatedNumber';

interface Props {
  dimensions: { label: string; score: number }[];
  size?: number;
}

export default function RadarChart({ dimensions, size = 320 }: Props) {
  const progress = useAnimatedNumber(100, 1200) / 100;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 52;
  const n = dimensions.length || 1;

  const point = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (radius * value * progress) / 100;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const polygon = dimensions.map((d, i) => point(i, d.score).join(',')).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="max-h-[340px] w-full">
      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {[25, 50, 75, 100].map((ring) => (
        <polygon
          key={ring}
          points={dimensions.map((_, i) => point(i, ring).join(',')).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={1}
        />
      ))}

      {dimensions.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
      })}

      <polygon points={polygon} fill="url(#radar-fill)" stroke="#818cf8" strokeWidth={2} />

      {dimensions.map((d, i) => {
        const [x, y] = point(i, d.score);
        return <circle key={i} cx={x} cy={y} r={3.5} fill="#c7d2fe" />;
      })}

      {dimensions.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + (radius + 26) * Math.cos(angle);
        const ly = cy + (radius + 26) * Math.sin(angle);
        const anchor = Math.abs(Math.cos(angle)) < 0.3 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
        const words = d.label.split(' ');
        return (
          <text
            key={d.label}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-slate-400"
            style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.02em' }}
          >
            {words.length > 2 ? `${words.slice(0, 2).join(' ')} ${words[2].slice(0, 8)}` : d.label}
          </text>
        );
      })}
    </svg>
  );
}
