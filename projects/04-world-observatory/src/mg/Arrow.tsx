import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../core/tokens';
import {ease} from './anim';
// 虚线箭头（虚线 = 推测/模拟；solid=true 为实线 = 数据）
export const DashedArrow: React.FC<{x1: number; y1: number; x2: number; y2: number; start: number; dur?: number; color?: string; solid?: boolean; curve?: number}> = ({x1, y1, x2, y2, start, dur = 18, color = C.red, solid, curve = 80}) => {
  const f = useCurrentFrame(); const p = ease(f, start, start + dur);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - curve;
  const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
  const L = 2000;
  const ang = Math.atan2(y2 - my, x2 - mx) * 180 / Math.PI;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
      <mask id={`m${start}${x1}`}><path d={d} stroke="#fff" strokeWidth={14} fill="none" strokeDasharray={L} strokeDashoffset={L * (1 - p)} /></mask>
      <path d={d} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={solid ? undefined : '18 16'} mask={`url(#m${start}${x1})`} />
      <g transform={`translate(${x2},${y2}) rotate(${ang})`} opacity={p > 0.95 ? 1 : 0}><path d="M0,0 L-30,-16 L-30,16 Z" fill={color} /></g>
    </svg>
  );
};
