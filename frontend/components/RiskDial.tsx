import React from 'react';
import { riskTone } from './ui.js';

/**
 * The console's signature instrument: a pressure-gauge style dial that
 * reads resignation probability the way a physical instrument would,
 * needle and all, rather than a generic progress bar.
 */
export function RiskDial({
  probability,
  level,
  confidence,
  size = 190,
}: {
  probability: number;
  level?: string;
  confidence?: number;
  size?: number;
}) {
  const tone = riskTone(level);
  const w = size;
  const h = size * 0.62;
  const cx = w / 2;
  const cy = h - 6;
  const r = w / 2 - 18;

  const angleFor = (p: number) => -180 + (Math.min(100, Math.max(0, p)) / 100) * 180;
  const toXY = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const needleAngle = angleFor(probability);
  const needleTip = toXY(needleAngle, r - 14);
  const needleTail = toXY(needleAngle + 180, 10);

  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);
  const colorForTick = (t: number) => {
    if (t >= 75) return 'var(--color-rust)';
    if (t >= 50) return 'var(--color-amber)';
    if (t >= 25) return 'var(--color-fog)';
    return 'var(--color-teal)';
  };

  const arcPath = (() => {
    const start = toXY(-180, r);
    const end = toXY(0, r);
    return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  })();

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h + 8} viewBox={`0 0 ${w} ${h + 8}`}>
        <path d={arcPath} fill="none" stroke="var(--color-hairline)" strokeWidth={10} strokeLinecap="round" />
        {ticks.map((t) => {
          const a = angleFor(t);
          const outer = toXY(a, r + 8);
          const inner = toXY(a, r - 2);
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={colorForTick(t)}
              strokeWidth={t % 50 === 0 ? 2.5 : 1.5}
              opacity={t % 50 === 0 ? 0.9 : 0.45}
            />
          );
        })}
        <line
          x1={needleTail.x}
          y1={needleTail.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="var(--color-bone)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill="var(--color-bone)" />
        <circle cx={cx} cy={cy} r={2.5} fill="var(--color-ink)" />
      </svg>
      <div className="-mt-1 text-center">
        <div className="font-display text-4xl font-semibold text-[var(--color-bone)] leading-none">
          {Math.round(probability)}<span className="text-lg align-top">%</span>
        </div>
        <div className={`mt-2 font-mono text-[10px] uppercase tracking-widest ${tone.fg}`}>
          {level || 'Unrated'} risk
        </div>
        {confidence !== undefined && (
          <div className="mt-1 text-[10px] font-mono text-[var(--color-bone-dim)]">
            {confidence}% model confidence
          </div>
        )}
      </div>
    </div>
  );
}
