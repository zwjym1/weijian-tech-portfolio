import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT_SANS, SAFE} from '../core/tokens';
import {ease, pop} from './anim';
import {PaperCard} from './Card';
// “示意 / 推断 / 数据来源 …” 标签：固定在安全区左上
export const LabelTag: React.FC<{text: string}> = ({text}) => {
  const kind = /推断|建议/.test(text) ? C.amber : /数据来源/.test(text) ? C.cyan : C.brass;
  const head = text.split(/[：；（(]/)[0];
  return (
    <div style={{position: 'absolute', left: SAFE.x0, top: SAFE.y0, zIndex: 80, fontFamily: FONT_SANS, display: 'flex', gap: 12, alignItems: 'center'}}>
      <span style={{background: kind, color: C.cream, fontSize: 34, fontWeight: 700, padding: '6px 18px', borderRadius: 6}}>{head}</span>
    </div>
  );
};
// 价格标：吊牌造型，弹出
export const PriceTag: React.FC<{x: number; y: number; top: string; main: string; start: number; color?: string; rot?: number}> = ({x, y, top, main, start, color = C.amber, rot = -4}) => {
  const f = useCurrentFrame(); const s = pop(f, start);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${s}) rotate(${rot}deg)`, transformOrigin: '50% 0%', fontFamily: FONT_SANS,
      background: color, color: C.cream, borderRadius: '14px 14px 14px 14px', padding: '18px 30px', border: `4px solid ${C.ink}`, boxShadow: '0 8px 0 rgba(32,60,58,.25)', textAlign: 'center'}}>
      <div style={{fontSize: 34}}>{top}</div><div style={{fontSize: 60, fontWeight: 800}}>{main}</div>
    </div>
  );
};
// 字卡：大字结论 + 可选小字注释
export const FactCard: React.FC<{x: number; y: number; w?: number; title: string; note?: string; start: number}> = ({x, y, w = 860, title, note, start}) => {
  const f = useCurrentFrame(); const p = ease(f, start, start + 12);
  return (
    <PaperCard x={x} y={y + (1 - p) * 30} w={w} rot={0.6} style={{opacity: p, textAlign: 'center'}}>
      <div style={{fontSize: 62, fontWeight: 800, lineHeight: 1.25}}>{title}</div>
      {note && <div style={{fontSize: 30, marginTop: 14, color: '#5b5346'}}>{note}</div>}
    </PaperCard>
  );
};
// 来源/提示小字条（≥30px 以保证手机可读）
export const SourceNote: React.FC<{x: number; y: number; text: string; start: number; color?: string}> = ({x, y, text, start, color = C.ink}) => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', left: x, top: y, maxWidth: 900, fontFamily: FONT_SANS, fontSize: 30, color, background: 'rgba(241,228,204,.92)', padding: '6px 14px', borderRadius: 6, opacity: ease(f, start, start + 10)}}>{text}</div>;
};
// 关键词胶囊（shotlist.captions）
export const KeyChip: React.FC<{text: string; x: number; y: number; start: number; color?: string}> = ({text, x, y, start, color = C.ink}) => {
  const f = useCurrentFrame(); const s = pop(f, start);
  return <div style={{position: 'absolute', left: x, top: y, transform: `scale(${s})`, transformOrigin: '0 50%', fontFamily: FONT_SANS, fontSize: 56, fontWeight: 800,
    background: color, color: C.cream, padding: '10px 28px', borderRadius: 12, border: `4px solid ${C.cream}`, boxShadow: '0 6px 0 rgba(32,60,58,.3)', whiteSpace: 'nowrap'}}>{text}</div>;
};
