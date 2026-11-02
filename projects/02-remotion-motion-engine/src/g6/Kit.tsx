import React from 'react';
import {interpolate} from 'remotion';
import {PAL, SERIF, SANS, Rect, iv, twos, ObsSeal, BrassRing, PaperFrame} from '../g2/ObservationStage';
import {Line} from './data';

// —— 版式 C（VISUAL_BIBLE §9.2）——
export const GRID = {L: 84, R: 996, W: 912, top: 240, bottom: 1540, win: {x: 84, y: 250, w: 912, h: 960} as Rect, card: {x: 84, y: 1250, w: 912, h: 176} as Rect, capY: 1458};
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const paperShadow = '0 8px 0 rgba(80,52,24,.14), 0 14px 22px rgba(80,52,24,.12)';

// 逐字关键词高亮字幕：按 Fish 字级时间戳；只显示当前分句；关键词朱红+底色扫过
export const KaraokeCaption: React.FC<{line: Line; t: number; keywords?: string[]; y?: number; o?: number}> = ({line, t, keywords = [], y = GRID.capY, o = 1}) => {
  const segs = line.segs; const text = segs.map((s) => s.text).join('');
  const off: number[] = []; { let c = 0; segs.forEach((s) => { off.push(c); c += s.text.length; }); }
  // 分句
  const chunks: {a: number; b: number}[] = []; let a = 0;
  // 用原句标点切分句（segs 不含标点）；过长分句再按 13 字切
  let k = 0; const brk = new Set<number>();
  for (const ch of line.text) { if (/[，。；：！？,]/.test(ch)) brk.add(k); else k++; }
  segs.forEach((_, i) => { const n = i + 1 - a; if (brk.has(i + 1) || i === segs.length - 1 || n >= 13) { chunks.push({a, b: i + 1}); a = i + 1; } });
  const cur = chunks.find((c) => t < (segs[c.b - 1]?.end ?? 0) + 0.15) ?? chunks[chunks.length - 1];
  const kwMask = new Array(text.length).fill(false);
  keywords.forEach((k) => { let i = text.indexOf(k); while (i >= 0) { for (let j = 0; j < k.length; j++) kwMask[i + j] = true; i = text.indexOf(k, i + 1); } });
  const items = segs.slice(cur.a, cur.b).map((s, k) => ({s, i: cur.a + k})).filter(({s}) => !/[，。；：！？,]/.test(s.text));
  const chunkIn = clamp((t - segs[cur.a].start + 0.12) / 0.12);
  return <div style={{position: 'absolute', left: GRID.L, width: GRID.W, top: y, textAlign: 'center', opacity: o * chunkIn, fontFamily: SANS, fontWeight: 900, fontSize: 56, lineHeight: 1.25, letterSpacing: 1}}>
    {items.map(({s, i}) => {
      const p = clamp((t - s.start) / Math.max(0.06, s.end - s.start));
      const kw = kwMask[off[i]]; const said = t >= s.start;
      return <span key={i} style={{position: 'relative', display: 'inline-block', color: kw && said ? PAL.vermilion : PAL.ink, opacity: said ? 1 : 0.38, transform: `translateY(${said ? -6 * (1 - p) : 0}px)`}}>
        {kw && <span style={{position: 'absolute', left: -2, right: -2, bottom: 6, height: 16, background: PAL.copper, opacity: 0.28, transformOrigin: 'left', transform: `scaleX(${p})`}} />}
        <span style={{position: 'relative'}}>{s.text}</span></span>;
    })}
  </div>;
};

// 账本大卡（C 版）：标题 + 金额计数 + 横条 + 印章
export const LedgerCard: React.FC<{f: number; r?: Rect; title: React.ReactNode; label: string; from: number; to: number; extras: number[]; countAt: number; countDur?: number; sealAt?: number; o?: number}> =
({f, r = GRID.card, title, label, from, to, extras, countAt, countDur = 30, sealAt, o = 1}) => {
  const inn = iv(f, 0, 14); const p = iv(f, countAt, countAt + countDur);
  const v = Math.round(from + (to - from) * p); const total = from + extras.reduce((a, b) => a + b, 0);
  const bx = 300, bw = r.w - 470;
  return <div style={{position: 'absolute', left: r.x, top: r.y + (1 - inn) * 30, width: r.w, height: r.h, opacity: o * inn, background: '#FFFDF6', borderRadius: 6, boxShadow: paperShadow}}>
    <div style={{position: 'absolute', left: 32, top: 18, fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAL.ink}}>{title}</div>
    <div style={{position: 'absolute', left: 32, top: 80, fontFamily: SANS, fontSize: 22, color: PAL.ink, opacity: .7}}>{label}</div>
    <div style={{position: 'absolute', left: 30, top: 106, fontFamily: SERIF, fontWeight: 900, fontSize: 60, lineHeight: 1, color: PAL.ink, fontVariantNumeric: 'tabular-nums'}}>¥{v}</div>
    <div style={{position: 'absolute', right: 30, top: 110, fontFamily: SERIF, fontWeight: 900, fontSize: 50, color: PAL.vermilion, opacity: v > from ? 1 : 0.3}}>+{v - from}</div>
    <div style={{position: 'absolute', left: bx, width: bw, top: 122, height: 36, background: '#EADFCB', borderRadius: 4, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, height: '100%', width: `${(from / total) * 100}%`, background: PAL.teal}} />
      {extras.map((e, i) => { const acc = from + extras.slice(0, i).reduce((a, b) => a + b, 0); const q = clamp(p * extras.length - i);
        return <div key={i} style={{position: 'absolute', left: `${(acc / total) * 100}%`, top: 0, height: '100%', width: `${(e * q / total) * 100}%`, background: i % 2 ? PAL.copper : PAL.vermilion, borderLeft: '2px solid #FFFDF6'}} />; })}
    </div>
    {sealAt !== undefined && <ObsSeal f={f - sealAt} x={r.w - 79} y={12} size={130} />}
  </div>;
};

// 账本行（S02 逐行弹出，字音对齐）
export const LedgerRows: React.FC<{t: number; rows: {k: string; v: string; at: number; hl?: boolean}[]; r: Rect; checkAt?: number}> = ({t, rows, r, checkAt}) => (
  <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w}}>
    {rows.map((row, i) => { const p = clamp((t - row.at) / 0.25); const s = interpolate(p, [0, .6, 1], [.6, 1.08, 1]);
      return <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', height: 108, borderBottom: `3px dashed ${PAL.brass}`, opacity: p, transform: `scale(${s})`, transformOrigin: 'left center', padding: '0 24px'}}>
        <span style={{fontFamily: SANS, fontSize: 40, color: PAL.ink}}>{row.k}</span>
        <span style={{fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: row.hl ? PAL.vermilion : PAL.ink, position: 'relative'}}>{row.v}
          {row.hl && checkAt !== undefined && t > checkAt && <svg width={90} height={80} style={{position: 'absolute', right: -96, top: -6}}><path d="M10 40 L35 68 L84 8" stroke={PAL.vermilion} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={140} strokeDashoffset={140 * (1 - clamp((t - checkAt) / .3))} /></svg>}
        </span></div>; })}
  </div>
);

// 柱状图（S04）：柱子随计数长高，差值飞出
export const BarChart: React.FC<{f: number; bars: {label: string; value: number; color: string; at?: number}[]; max: number; r: Rect; diff?: {text: string; at: number}; unit?: string}> = ({f, bars, max, r, diff, unit = '¥'}) => {
  const gap = 56, bw = (r.w - gap * (bars.length + 1)) / bars.length, base = r.y + r.h - 70, hMax = r.h - 190;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}>
    <div style={{position: 'absolute', left: r.x, top: base, width: r.w, height: 6, background: PAL.ink, borderRadius: 3}} />
    {bars.map((b, i) => { const a0 = b.at ?? 8 + i * 14; const p = iv(twos(f), a0, a0 + 24); const h = (b.value / max) * hMax * p; const x = r.x + gap + i * (bw + gap);
      return <React.Fragment key={i}>
        <div style={{position: 'absolute', left: x, top: base - h, width: bw, height: h, background: b.color, borderRadius: '8px 8px 0 0', boxShadow: 'inset -10px 0 0 rgba(0,0,0,.08)'}} />
        <div style={{position: 'absolute', left: x - 20, width: bw + 40, top: base - h - 78, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 54, color: PAL.ink, opacity: p > 0.05 ? 1 : 0, fontVariantNumeric: 'tabular-nums'}}>{unit}{Math.round(b.value * p)}</div>
        <div style={{position: 'absolute', left: x - 20, width: bw + 40, top: base + 18, textAlign: 'center', fontFamily: SANS, fontSize: 34, color: PAL.ink}}>{b.label}</div>
      </React.Fragment>; })}
    {diff && (() => { const p = iv(f, diff.at, diff.at + 16); return <div style={{position: 'absolute', left: r.x, width: r.w * 0.62, top: r.y + 170 + (1 - p) * 80, textAlign: 'center', opacity: p, transform: `scale(${interpolate(p, [0, .7, 1], [.5, 1.12, 1])})`, fontFamily: SERIF, fontWeight: 900, fontSize: 80, color: PAL.vermilion}}>{diff.text}</div>; })()}
  </div>;
};

// 两条横条（S06）：第二条停在一半处
export const HBars: React.FC<{f: number; r: Rect; rows: {label: string; frac: number; color: string; mark?: string}[]}> = ({f, r, rows}) => (
  <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w}}>
    {rows.map((row, i) => { const p = iv(twos(f), 6 + i * 16, 6 + i * 16 + 34); const w = (r.w - 64) * row.frac * p;
      return <div key={i} style={{position: 'relative', height: 190}}>
        <div style={{fontFamily: SANS, fontSize: 38, color: PAL.ink, marginLeft: 32}}>{row.label}</div>
        <div style={{position: 'absolute', left: 32, top: 64, width: r.w - 64, height: 70, background: '#EADFCB', borderRadius: 6}} />
        <div style={{position: 'absolute', left: 32, top: 64, width: w, height: 70, background: row.color, borderRadius: 6}} />
        {row.mark && <div style={{position: 'absolute', left: 32 + w - 2, top: 46, width: 4, height: 106, background: PAL.vermilion, opacity: p > .95 ? 1 : 0}}>
          <span style={{position: 'absolute', left: 14, top: -8, whiteSpace: 'nowrap', fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: PAL.vermilion}}>{row.mark}</span></div>}
      </div>; })}
  </div>
);

// 档案剪报（S05）：撕边纸、标题、正文灰条、环形图扫出 1/3、回形针
export const ArchiveClip: React.FC<{f: number; r: Rect; head: string; note: string; frac: number; fracLabel: string; src: string; sweepAt?: number}> = ({f, r, head, note, frac, fracLabel, src, sweepAt = 20}) => {
  const tear = Array.from({length: 25}, (_, i) => `${(i / 24) * 100}% ${i % 2 ? 98.6 : 100}%`).reverse().join(',');
  const p = iv(f, sweepAt, sweepAt + 30); const C = 2 * Math.PI * 120;
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, transform: 'rotate(-1.2deg)'}}>
    <div style={{position: 'absolute', inset: 0, background: '#F7F0DF', clipPath: `polygon(0 1%, 3% 0, 50% 1%, 97% 0, 100% 1.2%, ${tear})`, boxShadow: paperShadow}} />
    <div style={{position: 'absolute', left: 48, top: 40, right: 48, fontFamily: SANS, fontSize: 24, letterSpacing: 6, color: PAL.ink, opacity: .6, borderBottom: `2px solid ${PAL.ink}`, paddingBottom: 10}}>档 案 · 研 究 摘 录</div>
    <div style={{position: 'absolute', left: 48, top: 104, right: 48, fontFamily: SERIF, fontWeight: 900, fontSize: 52, lineHeight: 1.25, color: PAL.ink}}>{head}</div>
    {[0, 1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', left: 48, top: 270 + i * 34, width: [560, 500, 540, 300][i], height: 12, background: PAL.ink, opacity: .14, borderRadius: 6}} />)}
    <svg width={300} height={300} style={{position: 'absolute', right: 40, top: 220}} viewBox="-150 -150 300 300">
      <circle r={120} fill="none" stroke="#E2D5BB" strokeWidth={46} />
      <circle r={120} fill="none" stroke={PAL.vermilion} strokeWidth={46} strokeDasharray={`${C * frac * p} ${C}`} transform="rotate(-90)" />
      <text y={14} textAnchor="middle" style={{font: `900 48px ${SERIF}`, fill: PAL.ink}}>{fracLabel}</text>
    </svg>
    <div style={{position: 'absolute', left: 48, top: 430, width: 560, fontFamily: SANS, fontSize: 32, lineHeight: 1.45, color: PAL.ink}}>{note}</div>
    <div style={{position: 'absolute', left: 48, bottom: 36, fontFamily: SANS, fontSize: 20, color: PAL.ink, opacity: .55}}>{src}</div>
    <svg width={60} height={150} style={{position: 'absolute', left: 90, top: -60}}><path d="M18 140 V24 a14 14 0 0 1 28 0 V120 a8 8 0 0 1 -16 0 V40" stroke="#8C8C86" strokeWidth={6} fill="none" strokeLinecap="round" /></svg>
  </div>;
};

// —— 转场 T1–T4：统一签名 (p 0→1, a 旧画面, b 新画面) ——
type TP = {p: number; a: React.ReactNode; b: React.ReactNode};
// T1 物体变形：用法见 Morph；这里提供整屏版本（旧画面缩成方块落进新画面）
export const T1Morph: React.FC<TP & {from: Rect; to: Rect; color?: string}> = ({p, a, b, from, to, color = PAL.copper}) => {
  const r = {x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p - Math.sin(p * Math.PI) * 120, w: from.w + (to.w - from.w) * p, h: from.h + (to.h - from.h) * p};
  return <>{b}<div style={{position: 'absolute', inset: 0, opacity: 1 - iv(p, 0, .3)}}>{a}</div>
    {p > 0 && p < 1 && <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: color, borderRadius: 8 * (1 - p) + 4, imageRendering: 'pixelated', boxShadow: `0 0 0 4px #FFFDF6`, transform: `rotate(${(1 - p) * 12}deg)`}} />}</>;
};
// T2 观察扫描：铜环扫过，环内露出新画面
export const T2Scan: React.FC<TP & {f: number; cx?: number; cy?: number}> = ({p, a, b, f, cx = 540, cy = 760}) => {
  const rad = iv(p, 0.15, 1) * 1500;
  return <>{a}<div style={{position: 'absolute', inset: 0, clipPath: `circle(${rad}px at ${cx}px ${cy}px)`}}>{b}</div>
    {p < 0.9 && <BrassRing f={f} x={cx + Math.cos(p * 6) * 160 * (1 - p)} y={cy} size={320 + rad * 0.4} o={1 - iv(p, .6, .9)} scan={p} />}</>;
};
// T3 纸页翻转：旧页绕左边翻起，露出档案层
export const T3Flip: React.FC<TP> = ({p, a, b}) => {
  const e = interpolate(p, [0, 1], [0, 180]);
  return <div style={{position: 'absolute', inset: 0, perspective: 2200}}>
    <div style={{position: 'absolute', inset: 0, transform: `rotateY(${-180 + e}deg)`, transformOrigin: 'left center', backfaceVisibility: 'hidden', opacity: p > .5 ? 1 : 0}}>{b}</div>
    <div style={{position: 'absolute', inset: 0, transform: `rotateY(${-e}deg)`, transformOrigin: 'left center', backfaceVisibility: 'hidden', boxShadow: `${-40 * Math.sin(p * Math.PI)}px 0 60px rgba(40,25,10,.3)`}}>{a}</div>
    <div style={{position: 'absolute', inset: 0, background: '#000', opacity: Math.sin(p * Math.PI) * .12, pointerEvents: 'none'}} />
  </div>;
};
// T4 空间穿越（彩蛋）：层层纸框向镜头飞来，穿过后到新画面
export const T4Tunnel: React.FC<TP> = ({p, a, b}) => (
  <>{p < .5 ? a : b}
    {[0, 1, 2, 3, 4, 5].map((i) => { const z = ((p * 2.2 + i / 6) % 1); const s = 0.15 + Math.pow(z, 2.4) * 4; const o = Math.sin(p * Math.PI) * (1 - iv(z, .7, 1));
      return <div key={i} style={{position: 'absolute', left: 540 - 540 * s, top: 900 - 960 * s, width: 1080 * s, height: 1920 * s, border: `${30 * s}px solid ${i % 2 ? PAL.teal : PAL.paper}`, borderRadius: 30 * s, opacity: o, boxShadow: `0 0 ${40 * s}px rgba(32,60,58,.35)`}} />; })}
    <div style={{position: 'absolute', inset: 0, background: PAL.paper, opacity: interpolate(p, [.4, .5, .6], [0, .9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />
  </>
);
export {PaperFrame};
