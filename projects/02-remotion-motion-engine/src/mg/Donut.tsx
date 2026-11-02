import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT_SANS} from '../core/tokens';
import {ease} from './anim';
// 环形图：part ∈ [0,1]，扇区顺时针长出
export const Donut: React.FC<{cx: number; cy: number; r?: number; part: number; start: number; label?: string; color?: string}> = ({cx, cy, r = 130, part, start, label, color = C.amber}) => {
  const f = useCurrentFrame(); const p = ease(f, start, start + 24);
  const circ = 2 * Math.PI * r;
  return (
    <div style={{position: 'absolute', left: cx - r - 40, top: cy - r - 40, width: 2 * r + 80, height: 2 * r + 80, opacity: ease(f, start - 6, start + 4)}}>
      <svg width={2 * r + 80} height={2 * r + 80}>
        <circle cx={r + 40} cy={r + 40} r={r + 32} fill={C.cream} stroke={C.brass} strokeWidth={3} />
        <circle cx={r + 40} cy={r + 40} r={r} fill="none" stroke={C.cyan} strokeWidth={44} opacity={0.45} />
        <circle cx={r + 40} cy={r + 40} r={r} fill="none" stroke={color} strokeWidth={44}
          strokeDasharray={`${circ * part * p} ${circ}`} transform={`rotate(-90 ${r + 40} ${r + 40})`} />
      </svg>
      {label && <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_SANS, fontSize: 60, fontWeight: 800, color: C.ink}}>{label}</div>}
    </div>
  );
};
