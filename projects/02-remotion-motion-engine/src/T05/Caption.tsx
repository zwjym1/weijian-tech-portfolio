import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT_SANS} from '../core/tokens';
import {L, FPS} from './timeline';

const DISP: [string, string][] = [['二零二三年', '2023年'], ['百分之一点三', '1.3%'], ['一千万', '1000万'], ['七十五万多', '75万多'], ['十六亿', '16亿'], ['两千', '2000'], ['一千六', '1600'], ['十二次', '12次'], ['八家店', '8家店'], ['五年', '5年'], ['七天', '7天']];
const KEYS: Record<number, [string, 'r' | 'a'][]> = {
  1: [['借条', 'r']], 2: [['欠你的服务', 'r']], 3: [['7天之内', 'r'], ['退回本金', 'a']], 4: [['借出去了', 'r']], 5: [['2000', 'a'], ['12次', 'a']], 6: [['1600', 'r']],
  7: [['1.3%', 'r']], 8: [['1000万', 'a'], ['5年的卡', 'a']], 9: [['16亿', 'r']], 10: [['不在里面', 'r'], ['没人替你看着', 'a']], 11: [['75万多', 'a'], ['5年', 'r']], 12: [['债主', 'r']],
};
const PUN = new Set('，。？！；：、“”'.split(''));
type Tok = {t: string; s: number; e: number; brk: boolean};
const build = (n: number): Tok[] => {
  const ln = L[n - 1]; const chars: Tok[] = []; let wi = 0;
  for (let i = 0; i < ln.text.length; i++) {
    const c = ln.text[i];
    if (PUN.has(c)) { if (chars.length && c !== '“' && c !== '”') chars[chars.length - 1].brk = true; continue; }
    const w = ln.words[wi++]; chars.push({t: c, s: w.start, e: w.end, brk: false});
  }
  const raw = chars.map(c => c.t).join(''); const out: Tok[] = [];
  for (let i = 0; i < chars.length;) {
    const d = DISP.find(([a]) => raw.startsWith(a, i));
    if (d) { const j = i + d[0].length - 1; out.push({t: d[1], s: chars[i].s, e: chars[j].e, brk: chars[j].brk}); i = j + 1; }
    else { out.push(chars[i]); i++; }
  }
  return out;
};
const TOKS = L.map((_, i) => build(i + 1));
const wid = (t: string) => [...t].reduce((a, c) => a + (/[0-9.%]/.test(c) ? 0.58 : 1), 0);
const chunks = (n: number) => {
  const tk = TOKS[n - 1]; const base: [number, number][] = []; let a = 0;
  tk.forEach((x, k) => { if (x.brk || k === tk.length - 1) { base.push([a, k + 1]); a = k + 1; } });
  const W = (r: [number, number]) => tk.slice(r[0], r[1]).reduce((s, x) => s + wid(x.t), 0);
  const out: [number, number][] = [];
  for (const b of base) {
    const last = out[out.length - 1];
    if (last && W([last[0], b[1]]) <= 10.4) last[1] = b[1]; else out.push([...b] as [number, number]);
  }
  // 超长段：硬切
  const fin: [number, number][] = [];
  for (const r of out) { if (W(r) <= 11.4) { fin.push(r); continue; } const mid = r[0] + Math.ceil((r[1] - r[0]) / 2); fin.push([r[0], mid], [mid, r[1]]); }
  return fin;
};
export const CAPS = L.map((_, i) => chunks(i + 1));

export const Caption: React.FC<{n: number; gf: number}> = ({n, gf}) => {
  const t = gf / FPS; const tk = TOKS[n - 1]; const ch = CAPS[n - 1];
  let ci = ch.findIndex((r, i) => i === ch.length - 1 || t < tk[ch[i + 1][0]].s - 0.1);
  if (ci < 0) ci = ch.length - 1;
  const [a, b] = ch[ci]; const seg = tk.slice(a, b);
  const txt = seg.map(x => x.t).join('');
  const kws = (KEYS[n] ?? []).map(([k, c]) => ({k, c, p: txt.indexOf(k)})).filter(x => x.p >= 0);
  const colorAt = (idx: number): ['r' | 'a' | null] => { const k = kws.find(x => idx >= x.p && idx < x.p + x.k.length); return [k ? k.c : null]; };
  let off = 0;
  const inn = Math.min(1, Math.max(0, (t - (seg[0].s - 0.14)) / 0.1));
  return <div style={{position: 'absolute', left: 72, width: 848, top: 1384, height: 112, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 80, opacity: inn, transform: `translateY(${(1 - inn) * 8}px)`}}>
    <div style={{fontFamily: FONT_SANS, fontWeight: 900, fontSize: 72, lineHeight: 1.2, whiteSpace: 'nowrap', color: C.ink, textShadow: '0 0 10px rgba(241,228,204,.95), 0 0 4px rgba(241,228,204,.95)'}}>
      {seg.map((x, k) => {
        const start = off; off += x.t.length; const [col] = colorAt(start); const said = t >= x.s - 0.02;
        const kwOn = col && said; const p = Math.min(1, Math.max(0, (t - x.s) / 0.18));
        return <span key={k} style={{display: 'inline-block', color: kwOn ? (col === 'r' ? C.red : C.amber) : C.ink, fontSize: kwOn ? 84 : 72, transform: kwOn ? `scale(${0.88 + 0.12 * p})` : 'none', transformOrigin: '50% 80%', opacity: 1, ...(n === 12 && kwOn && col === 'r' ? {backgroundImage: `linear-gradient(${C.red}, ${C.red})`, backgroundRepeat: 'no-repeat', backgroundPosition: '0 98%', backgroundSize: `${Math.min(1, (t - x.s) / 0.25) * 100}% 9px`, paddingBottom: 6} : {})}}>{x.t}</span>;
      })}
    </div>
  </div>;
};
