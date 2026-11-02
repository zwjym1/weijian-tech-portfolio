import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT_SANS} from '../core/tokens';
import {ease} from './anim';
import {PaperCard} from './Card';
import {CountUp} from './CountUp';
export type Bar = {label: string; value: number; color: string; prefix?: string; suffix?: string; decimals?: number};
// 柱状对比（竖）或横条（horizontal）
export const Bars: React.FC<{x: number; y: number; w?: number; h?: number; bars: Bar[]; start: number; horizontal?: boolean}> = ({x, y, w = 820, h = 520, bars, start, horizontal}) => {
  const f = useCurrentFrame(); const max = Math.max(...bars.map(b => b.value));
  return (
    <PaperCard x={x} y={y} w={w} rot={-0.6} style={{height: h, opacity: ease(f, start - 8, start), display: 'flex', flexDirection: horizontal ? 'column' : 'row', justifyContent: 'space-around', alignItems: horizontal ? 'stretch' : 'flex-end', gap: 24}}>
      {bars.map((b, i) => {
        const p = ease(f, start + i * 10, start + i * 10 + 22); const frac = (b.value / max) * p;
        const num = <CountUp to={b.value} start={start + i * 10} dur={22} prefix={b.prefix ?? ''} suffix={b.suffix ?? ''} decimals={b.decimals} />;
        return horizontal ? (
          <div key={i} style={{fontFamily: FONT_SANS}}>
            <div style={{fontSize: 38, marginBottom: 8}}>{b.label}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{height: 56, width: `${frac * 70}%`, background: b.color, border: `3px solid ${C.ink}`, borderRadius: 6}} />
              <span style={{fontSize: 44, fontWeight: 800}}>{num}</span>
            </div>
          </div>
        ) : (
          <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: FONT_SANS, height: '100%', justifyContent: 'flex-end'}}>
            <div style={{fontSize: 50, fontWeight: 800, color: b.color === C.cream ? C.ink : b.color}}>{num}</div>
            <div style={{width: 180, height: (h - 190) * frac, background: b.color, border: `3px solid ${C.ink}`, borderRadius: '8px 8px 0 0'}} />
            <div style={{fontSize: 40, marginTop: 10}}>{b.label}</div>
          </div>
        );
      })}
    </PaperCard>
  );
};
