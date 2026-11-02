import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT_SANS} from '../core/tokens';
import {ease} from './anim';
import {PaperCard} from './Card';
// 折线：values 为相对值，线条按时间描出，最后一点标注
export const LineChart: React.FC<{x: number; y: number; w?: number; h?: number; values: number[]; xLabels: string[]; start: number; endLabel?: string}> = ({x, y, w = 820, h = 380, values, xLabels, start, endLabel}) => {
  const f = useCurrentFrame(); const p = ease(f, start, start + 30);
  const max = Math.max(...values) * 1.15; const iw = w - 140, ih = h - 120;
  const pts = values.map((v, i) => [40 + (i / (values.length - 1)) * iw, 20 + ih - (v / max) * ih]);
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' ');
  const L = 3000; const last = pts[pts.length - 1];
  return (
    <PaperCard x={x} y={y} w={w} rot={0.8} style={{height: h, padding: 20, opacity: ease(f, start - 8, start)}}>
      <svg width={w - 40} height={h - 40}>
        <line x1={40} y1={20 + ih} x2={40 + iw} y2={20 + ih} stroke={C.ink} strokeWidth={3} />
        <path d={d} stroke={C.red} strokeWidth={9} fill="none" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
        {pts.map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r={12} fill={C.red} opacity={p * values.length > i ? 1 : 0} />)}
        {xLabels.map((t, i) => <text key={i} x={pts[Math.min(i, pts.length - 1)][0]} y={h - 60} textAnchor="middle" fontSize={36} fontFamily={FONT_SANS} fill={C.ink}>{t}</text>)}
        {endLabel && <text x={last[0] - 10} y={last[1] - 26} textAnchor="end" fontSize={44} fontWeight={800} fontFamily={FONT_SANS} fill={C.red} opacity={p > 0.95 ? 1 : 0}>{endLabel}</text>}
      </svg>
    </PaperCard>
  );
};
