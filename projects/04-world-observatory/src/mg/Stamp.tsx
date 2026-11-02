import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {C, FONT_SERIF} from '../core/tokens';
import {clamp} from './anim';
// 对勾章：从大到小砸下 + 轻抖
export const StampCheck: React.FC<{x: number; y: number; start: number; text?: string; color?: string; size?: number}> = ({x, y, start, text = '✓', color = C.ink, size = 200}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [start, start + 6, start + 10], [2.2, 0.92, 1], clamp);
  const o = interpolate(f, [start, start + 3], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%',
      border: `10px solid ${color}`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o * 0.9,
      transform: `scale(${s}) rotate(-12deg)`, fontFamily: FONT_SERIF, fontSize: size * 0.55, fontWeight: 900, mixBlendMode: 'multiply'}}>{text}</div>
  );
};
