import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../core/tokens';
import {ease} from './anim';
import {PaperCard} from './Card';
import {CountUp} from './CountUp';
export type Row = {label: string; value: number; prefix?: string; color?: string; total?: boolean; text?: string};
// 账本卡：逐行入场（从左滑入 + 数字滚动），合计行带双横线
export const Ledger: React.FC<{x: number; y: number; w?: number; title?: string; rows: Row[]; start?: number; gap?: number}> = ({x, y, w = 760, title, rows, start = 0, gap = 14}) => {
  const f = useCurrentFrame();
  const a = ease(f, start, start + 10);
  return (
    <PaperCard x={x} y={y + (1 - a) * 40} w={w} rot={-1.2} style={{opacity: a}}>
      {title && <div style={{fontSize: 40, fontWeight: 700, color: C.brass, marginBottom: 10}}>{title}</div>}
      {rows.map((r, i) => {
        const t0 = start + 8 + i * gap; const p = ease(f, t0, t0 + 10);
        return (
          <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: r.total ? 58 : 48,
            fontWeight: r.total ? 800 : 500, padding: '10px 0', opacity: p, transform: `translateX(${(1 - p) * -40}px)`,
            borderTop: r.total ? `5px double ${C.ink}` : `2px dashed ${C.brass}`, color: r.color ?? C.ink}}>
            <span>{r.label}</span>
            <span>{r.text ?? <CountUp to={r.value} start={t0} prefix={r.prefix ?? '¥'} />}</span>
          </div>
        );
      })}
    </PaperCard>
  );
};
