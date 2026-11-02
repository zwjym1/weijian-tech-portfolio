import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, spring} from 'remotion';
import {PAL, SERIF, SANS, iv, PaperFrame, ObsSeal, BrassRing} from '../g2/ObservationStage';
import vo from './data/vo_full.json';
import present from './data/draw_present.json';
import PS from './data/poses_t02.json';

// ───────────── 时间轴（配音实测，来自 vo_full.json） ─────────────
type Seg = {text: string; start: number; end: number};
type Ln = {shot: string; text: string; disp: string; start: number; sec: number; segs: Seg[]};
const L = (vo as any).lines as Ln[];
export const FPS = 30;
export const T02_FRAMES = Math.ceil(((vo as any).totalSec + 0.6) * FPS);
const F = (s: number) => Math.round(s * FPS);
const kw = (i: number, w: string, n = 0) => { const l = L[i]; const tx = l.segs.map((s) => s.text).join(''); let p = -1; for (let k = 0; k <= n; k++) p = tx.indexOf(w, p + 1); if (p < 0) throw new Error(`kw ${i} ${w}`);
  let c = 0; for (const sg of l.segs) { if (c + sg.text.length > p) return l.start + sg.start; c += sg.text.length; } return l.start; };
const kwEnd = (i: number, w: string) => { const l = L[i]; const tx = l.segs.map((s) => s.text).join(''); const p = tx.indexOf(w); if (p < 0) throw new Error(`kwEnd ${i} ${w}`); const q = p + w.length - 1; let c = 0; for (const sg of l.segs) { if (c + sg.text.length > q) return l.start + sg.end; c += sg.text.length; } return l.start + l.sec; };
const kf = (i: number, w: string, n = 0) => F(kw(i, w, n));
const E = (i: number) => L[i].start + L[i].sec;

// ───────────── 版式 C-real ─────────────
const WIN = {x: 84, y: 350, w: 912, h: 860};
const CARD = {x: 84, y: 1250, w: 912, h: 176};
const CAP_Y = 1458;
const clampO = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const sticker = 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 12px 10px rgba(40,25,10,.3))';
const popS = (f: number, at: number) => f < at ? 0 : spring({frame: f - at, fps: 30, config: {damping: 10, stiffness: 220}});
const twos = (f: number) => Math.floor(f / 2) * 2;

// ───────────── 字幕（口播读中文数字，屏上显示阿拉伯数字） ─────────────
const DISP: [string, string][] = [['二零二四年', '2024年'], ['二零二五年', '2025年'], ['近六百亿', '近600亿'], ['五百二十四亿', '524亿'], ['六十九亿', '69亿'], ['一百零三', '103'], ['一百块', '100块'], ['七十九', '79'], ['二百三十四亿', '234亿'], ['五十七亿', '57亿'], ['七点九', '7.9%'], ['二十点九', '20.9%']];
const KEY = ['600亿', '524亿', '69亿', '补贴', '红包', '79', '103', '买单', '熟客', '不全是', '裹挟', '商家', '配送费', '一份', '股东', '234亿', '57亿', '7.9%', '20.9%', '仍高于', '不会白发', '谁头上', '说人话', '没用完', '扎心'];
const PUNCT = /[，。；：！？、,]/;
type Tok = {text: string; start: number; end: number; brk: boolean};
const tokens = (l: Ln): Tok[] => {
  const chars: {c: string; s: Seg}[] = []; l.segs.forEach((s) => [...s.text].forEach((c) => chars.push({c, s})));
  const brkAfter = new Set<number>(); { let k = 0; for (const ch of l.text) { if (PUNCT.test(ch)) brkAfter.add(k - 1); else k++; } }
  const out: Tok[] = []; const raw = chars.map((x) => x.c).join('');
  for (let i = 0; i < chars.length;) {
    const d = DISP.find(([sp]) => raw.startsWith(sp, i));
    if (d) { const j = i + d[0].length - 1; out.push({text: d[1], start: chars[i].s.start, end: chars[j].s.end, brk: brkAfter.has(j)}); i = j + 1; }
    else { out.push({text: chars[i].c, start: chars[i].s.start, end: chars[i].s.end, brk: brkAfter.has(i)}); i++; }
  }
  return out;
};
const TOK = L.map(tokens);
const Caption: React.FC<{i: number; t: number}> = ({i, t}) => {
  const tk = TOK[i]; const chunks: [number, number][] = []; let a = 0, len = 0;
  tk.forEach((x, k) => { len += x.text.length; if (x.brk || k === tk.length - 1 || len >= 13) { chunks.push([a, k + 1]); a = k + 1; len = 0; } });
  const cur = chunks.find(([, b]) => t < tk[b - 1].end + 0.15) ?? chunks[chunks.length - 1];
  const txt = tk.map((x) => x.text).join(''); const mask = new Array(txt.length).fill(false);
  KEY.forEach((k) => { let p = txt.indexOf(k); while (p >= 0) { for (let j = 0; j < k.length; j++) mask[p + j] = true; p = txt.indexOf(k, p + 1); } });
  const off: number[] = []; { let c = 0; tk.forEach((x) => { off.push(c); c += x.text.length; }); }
  const inn = Math.min(1, Math.max(0, (t - tk[cur[0]].start + 0.12) / 0.12));
  return <div style={{position: 'absolute', left: 72, width: 936, top: CAP_Y, textAlign: 'center', opacity: inn, fontFamily: SANS, fontWeight: 900, fontSize: 56, lineHeight: 1.25, whiteSpace: 'nowrap'}}>
    {tk.slice(cur[0], cur[1]).map((x, k) => { const id = cur[0] + k; const said = t >= x.start; const p = Math.min(1, Math.max(0, (t - x.start) / Math.max(0.06, x.end - x.start))); const hk = mask[off[id]];
      return <span key={k} style={{position: 'relative', display: 'inline-block', color: hk && said ? PAL.vermilion : PAL.ink, opacity: said ? 1 : 0.38, transform: `translateY(${said ? -6 * (1 - p) : 0}px)`, WebkitTextStroke: '8px #FFFDF6', paintOrder: 'stroke fill'}}>
        {hk && <span style={{position: 'absolute', left: -2, right: -2, bottom: 6, height: 16, background: PAL.copper, opacity: .3, transformOrigin: 'left', transform: `scaleX(${p})`}} />}<span style={{position: 'relative'}}>{x.text}</span></span>; })}
  </div>;
};

// ───────────── 通用部件 ─────────────
const PaperBg: React.FC = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 28%, #F8F0E1 0%, #EEDFC4 62%, #E3CFAE 100%)'}}>
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .15  0 0 0 .07 0" /></filter>
    <rect width="1080" height="1920" filter="url(#gr)" />
    <circle cx="960" cy="330" r="260" fill="none" stroke={PAL.brass} strokeOpacity=".18" strokeWidth="2" />
    <circle cx="90" cy="1380" r="180" fill={PAL.teal} fillOpacity=".06" />
  </svg></AbsoluteFill>;
const Ground: React.FC = () => <AbsoluteFill style={{top: 1560}}>
  <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(110,157,163,.10) 0%, rgba(32,60,58,.16) 100%)'}} />
  <div style={{position: 'absolute', left: 84, right: 84, top: 0, height: 2, background: PAL.ink, opacity: .18}} /></AbsoluteFill>;
const Title: React.FC<{f: number; at?: number; sub?: string; children: React.ReactNode}> = ({f, at = 0, sub, children}) => {
  const o = iv(f, at, at + 8); return <div style={{position: 'absolute', left: 84, width: 912, top: 222, opacity: o, transform: `translateY(${(1 - o) * 14}px)`}}>
    {sub && <div style={{fontFamily: SANS, fontSize: 26, letterSpacing: 6, color: PAL.ink, opacity: .65, height: 34}}>{sub}</div>}
    <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 58, lineHeight: 1.1, color: PAL.ink, whiteSpace: 'nowrap', marginTop: sub ? 0 : 28}}>{children}</div></div>;
};
const V = (t: React.ReactNode) => <span style={{color: PAL.vermilion}}>{t}</span>;
const Win: React.FC<{f: number; flip?: number; children?: React.ReactNode}> = ({f, flip, children}) => {
  const rot = flip === undefined ? 0 : 82 * (1 - iv(f, flip, flip + 9));
  return <div style={{position: 'absolute', inset: 0, transform: `perspective(1800px) rotateY(${-rot}deg)`, transformOrigin: `${WIN.x}px 780px`, opacity: flip === undefined ? 1 : iv(f, flip, flip + 3)}}>
    <div style={{position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, overflow: 'hidden', background: '#E9DCC0'}}>{children}</div>
    <PaperFrame r={WIN} /></div>;
};
// 窗内坐标：children 以窗口左上为原点
const Card: React.FC<{f: number; at: number; tag: string; kind: 'fact' | 'est' | 'demo'; src?: string; srcTop?: boolean; children?: React.ReactNode; pad?: number}> = ({f, at, tag, kind, src, srcTop, children, pad = 26}) => {
  const p = iv(f, at, at + 8); if (p <= 0) return null;
  const col = kind === 'fact' ? PAL.ink : kind === 'est' ? PAL.teal : PAL.copper;
  return <div style={{position: 'absolute', left: CARD.x, top: CARD.y + (1 - p) * 26, width: CARD.w, height: CARD.h, opacity: p, background: '#FFFDF6', borderRadius: 16, boxShadow: `0 0 0 3px ${PAL.ink}, 0 10px 18px rgba(40,25,10,.22)`}}>
    <div style={{position: 'absolute', left: 22, top: -19, padding: '2px 18px', background: col, color: PAL.paper, fontFamily: SANS, fontWeight: 900, fontSize: 24, letterSpacing: 3, borderRadius: 8}}>{tag}</div>
    <div style={{position: 'absolute', left: pad, right: pad, top: 22, bottom: 22}}>{children}</div>
    {src && <div style={{position: 'absolute', right: 22, [srcTop ? 'top' : 'bottom']: srcTop ? 6 : 8, fontFamily: SANS, fontSize: 20, color: PAL.ink, opacity: .55}}>{src}</div>}
  </div>;
};
const Count: React.FC<{f: number; a: number; b: number; to: number; dec?: number; pre?: string; suf?: string}> = ({f, a, b, to, dec = 0, pre = '', suf = ''}) => <>{pre}{(to * iv(f, a, b)).toFixed(dec)}{suf}</>;

// 小林整图姿态（脚锚点定位）
const POSES = (PS as any).poses as Record<string, {size: number[]; foot_xy: number[]; foot_xy_flip: number[]}>;
const XL: React.FC<{f: number; at: number; pose: string; flip?: boolean; h?: number; x: number; y: number; scale?: number}> = ({f, at, pose, flip, h = 440, x, y, scale = 1}) => {
  const p = POSES[pose]; if (!p || f < at) return null; const sc = (h * scale) / p.size[1]; const ft = flip ? p.foot_xy_flip : p.foot_xy; const s = popS(f, at);
  return <Img src={staticFile(`t02/poses/${pose}${flip ? '_flip' : ''}.png`)} style={{position: 'absolute', left: x - ft[0] * sc, top: y - ft[1] * sc, width: p.size[0] * sc, height: p.size[1] * sc, transform: `scale(${s})`, transformOrigin: `${ft[0] * sc}px ${ft[1] * sc}px`, filter: sticker}} />;
};
const D: React.FC<{n: string; x: number; y: number; w: number; rot?: number; o?: number; s?: number; origin?: string; shadow?: boolean; style?: React.CSSProperties}> = ({n, x, y, w, rot = 0, o = 1, s = 1, origin = 'center bottom', shadow, style}) => {
  const sz = (present as any)[n] as number[] | undefined; if (!sz) return <div style={{position: 'absolute', left: x, top: y, width: w, height: w * .8, border: `4px dashed ${PAL.vermilion}`, color: PAL.vermilion, fontFamily: SANS, fontSize: 24, padding: 8, opacity: o}}>占位 {n}</div>;
  return <Img src={staticFile(`t02/d/${n}.png`)} style={{position: 'absolute', left: x, top: y, width: w, height: w * sz[1] / sz[0], opacity: o, transform: `rotate(${rot}deg) scale(${s})`, transformOrigin: origin, filter: `saturate(.84) contrast(.97) sepia(.06)${shadow ? ' drop-shadow(0 10px 8px rgba(40,25,10,.28))' : ''}`, ...style}} />;
};
const PH: React.FC<{x: number; y: number; w: number; h: number; label: string; o?: number; s?: number}> = ({x, y, w, h, label, o = 1, s = 1}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, border: `5px dashed ${PAL.brass}`, background: 'rgba(190,160,108,.18)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 34, color: PAL.ink, opacity: o, transform: `scale(${s})`, transformOrigin: 'center bottom'}}>{label}（占位）</div>;

// ───────────── 真实页取景（pt/px 空间 + 取景框 viewport） ─────────────
type VB = [number, number, number, number]; type B4 = [number, number, number, number];
const camAt = (f: number, ks: [number, VB][]): VB => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) if (f < ks[i + 1][0]) { const t = iv(f, ks[i][0], ks[i + 1][0]); return ks[i][1].map((v, j) => v + (ks[i + 1][1][j] - v) * t) as VB; }
  return ks[ks.length - 1][1];
};
const PageStage: React.FC<{src: string; box: VB; vb: VB; children?: (s: number) => React.ReactNode}> = ({src, box, vb, children}) => {
  const s = WIN.w / vb[2];
  return <div style={{position: 'absolute', inset: 0, background: '#D8C6A2', overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: `translate(${-vb[0] * s}px,${-vb[1] * s}px) scale(${s})`, transformOrigin: '0 0'}}>
      <Img src={staticFile(src)} style={{position: 'absolute', left: box[0], top: box[1], width: box[2], height: box[3], boxShadow: `0 ${6 / s}px ${18 / s}px rgba(40,25,10,.32)`}} />
      <div style={{position: 'absolute', left: box[0], top: box[1], width: box[2], height: box[3], background: '#F1E4CC', mixBlendMode: 'multiply', opacity: .38}} />
      {children?.(s)}
    </div></div>;
};
const Mark: React.FC<{b: B4; p: number; c?: string; o?: number}> = ({b, p, c = '#FFC277', o = .5}) => p <= 0 ? null :
  <div style={{position: 'absolute', left: b[0], top: b[1], width: (b[2] - b[0]) * p, height: b[3] - b[1], background: c, opacity: o, mixBlendMode: 'multiply'}} />;
const Ring: React.FC<{b: B4; p: number; s: number; c?: string; pad?: number; w?: number}> = ({b, p, s, c = PAL.copper, pad = 6, w = 5}) => {
  if (p <= 0) return null; const ww = b[2] - b[0] + 2 * pad, hh = b[3] - b[1] + 2 * pad;
  return <svg width={ww} height={hh} style={{position: 'absolute', left: b[0] - pad, top: b[1] - pad, overflow: 'visible'}}>
    <ellipse cx={ww / 2} cy={hh / 2} rx={ww / 2} ry={hh / 2} fill="none" stroke={c} strokeWidth={w / s} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" transform={`rotate(-3 ${ww / 2} ${hh / 2})`} />
  </svg>;
};
const P25 = {src: 't02/real/pdf/R02_p25_full.png', box: [0, 0, 595.276, 793.701] as VB};
const V_FULL: VB = [-122, 0, 842, 794], V_TABLE: VB = [30, 60, 540, 509], V_PARA: VB = [30, 255, 540, 509], V_BOTTOM: VB = [30, 285, 540, 509];
const H1 = {src: 't02/real/pdf/R09_h1_p19.png', box: [30, 285, 540, 509] as VB};

// ───────────── 横向柱（数据卡） ─────────────
const HBars: React.FC<{f: number; rows: {label: string; v: number; c: string; at: number; text: string}[]; max: number}> = ({f, rows, max}) => {
  const Z = 400, UNIT = 250 / max;
  return <div style={{position: 'absolute', inset: 0}}>
    {rows.map((r, k) => { const p = iv(f, r.at, r.at + 14); const w = Math.abs(r.v) * UNIT * p; const neg = r.v < 0; const y = 4 + k * 66;
      return <React.Fragment key={k}>
        <div style={{position: 'absolute', left: 0, top: y + 8, width: 150, fontFamily: SANS, fontWeight: 900, fontSize: 30, color: PAL.ink}}>{r.label}</div>
        <div style={{position: 'absolute', left: neg ? Z - w : Z, top: y, width: w, height: 52, background: r.c, borderRadius: 6}} />
        <div style={{position: 'absolute', left: neg ? Z - w - 190 : Z + w + 14, width: 176, textAlign: neg ? 'right' : 'left', top: y - 2, fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: r.c, opacity: iv(f, r.at + 6, r.at + 14), fontVariantNumeric: 'tabular-nums'}}>{r.text}</div></React.Fragment>; })}
    <div style={{position: 'absolute', left: Z - 1, top: -4, width: 3, height: 140, background: PAL.ink, opacity: .5}} />
  </div>;
};

// ═════════════ 场景 ═════════════
const tNear = kw(0, '近六百亿'), tGone = kw(0, '去哪了'), tL2 = L[1].start;
const t524 = kw(1, '五百二十四亿'), t69 = kw(1, '六十九亿');
const tSay = kw(2, '说人话');

// —— A：L01–L03a（年报封面 → 第 25 页）
const SA: React.FC<{f: number}> = ({f}) => {
  const fn = F(tNear), fg = F(tGone), f2 = F(tL2), f3 = F(L[2].start);
  const roll = iv(f, fn + 2, fn + 28);
  const vb = camAt(f, [[0, V_FULL], [fg + 6, V_FULL], [f2 + 8, V_TABLE], [f3 + 4, V_TABLE], [f3 + 22, V_PARA]]);
  const coverO = 1 - iv(f, fn - 6, fn + 4); const coverS = 1 + .14 * iv(f, fn - 6, fn + 4);
  const push = interpolate(f, [0, 10], [1.3, 1], clampO); const blur = interpolate(f, [0, 8], [5, 0], clampO);
  const q = iv(f, fg, fg + 5); const q2 = popS(f, fg);
  return <AbsoluteFill>
    <Title f={f} at={0} sub={f < f2 ? '美团 · 核心本地商业 · 经营利润' : f < f3 ? '核心本地商业 · 年报表格' : '年报正文原话'}>
      {f < f2 ? <>美团少赚约 {V(f < fn ? '？' : <Count f={f} a={fn + 2} b={fn + 28} to={593} />)} 亿</> : f < f3 ? <>赚 524 亿 → {V('亏 69 亿')}</> : <>年报写了什么？</>}
    </Title>
    <Win f={f}>
      <PageStage {...P25} vb={vb}>{(s) => <>
        <Mark b={[43, 157, 553, 176]} p={iv(f, f2 + 4, f2 + 16)} />
        <Ring b={[415, 160, 468, 176]} p={iv(f, F(t524), F(t524) + 12)} s={s} /><Ring b={[523, 160, 553, 176]} p={iv(f, F(t524) + 4, F(t524) + 16)} s={s} />
        <Ring b={[258, 159, 313, 176]} p={iv(f, F(t69), F(t69) + 12)} s={s} c={PAL.vermilion} /><Ring b={[364, 159, 398, 176]} p={iv(f, F(t69) + 4, F(t69) + 16)} s={s} c={PAL.vermilion} />
        <Mark b={[43, 318, 553, 336]} p={iv(f, f3 + 10, f3 + 24)} /><Mark b={[43, 334, 372, 352]} p={iv(f, f3 + 24, f3 + 38)} />
      </>}</PageStage>
      {f >= fg && <div style={{position: 'absolute', inset: 0, background: `rgba(32,60,58,${.28 * q})`}} />}
      {f >= fg && f < f2 + 6 && <div style={{position: 'absolute', left: 430, top: 160, fontFamily: SERIF, fontWeight: 900, fontSize: 420, color: PAL.vermilion, opacity: q * .95, transform: `rotate(-8deg) scale(${1.5 - .5 * q2})`, textShadow: '0 6px 0 rgba(255,253,246,.8)'}}>？</div>}
      {f < fn + 4 && <div style={{position: 'absolute', inset: 0, opacity: coverO, transform: `scale(${push * coverS})`, filter: blur > .1 ? `blur(${blur}px)` : undefined}}>
        <PageStage src="t02/real/pdf/R01_cover.png" box={[97, 100, 400, 377]} vb={[97, 100, 400, 377]}>{(s) => <Ring b={[255, 100, 345, 165]} p={iv(f, 6, 18)} s={s} pad={10} />}</PageStage></div>}
    </Win>
    {/* 数据卡 */}
    {f >= fn + 26 && f < f2 && <Card f={f} at={fn + 26} tag="约 · 推算" kind="est" src="美团 2025 年度业绩公告 · 第 25 页">
      <div style={{fontFamily: SANS, fontSize: 28, color: PAL.ink, opacity: .75}}>核心本地商业经营利润：2024 → 2025 的变化</div>
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 68, color: PAL.ink, marginTop: 6}}>平均每天少赚 {V('约 1.6 亿')}</div></Card>}
    {f >= f2 && f < f3 && <Card f={f} at={f2 + 2} tag="事实" kind="fact" src="美团 2025 年度业绩公告 · 第 25 页">
      <div style={{position: 'absolute', left: 0, top: -6, fontFamily: SANS, fontSize: 24, color: PAL.ink, opacity: .6}}>核心本地商业 · 经营利润（亿元）</div>
      <div style={{position: 'absolute', left: 0, top: 24, right: 0, bottom: 0}}><HBars f={f} max={524} rows={[{label: '2024 年', v: 524, c: PAL.teal, at: F(t524) + 2, text: '+524'}, {label: '2025 年', v: -69, c: PAL.vermilion, at: F(t69) + 2, text: '−69'}]} /></div></Card>}
    {f >= f3 && f < F(tSay) && <Card f={f} at={f3 + 2} tag="年报原话" kind="fact" src="美团 2025 年度业绩公告 · 第 25 页">
      <div style={{fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .65}}>經營利潤轉為負數，主要由於毛利率下降，以及…</div>
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAL.ink, marginTop: 8}}>与<span style={{color: PAL.vermilion}}>用户激励、推广及广告</span>相关的开支增加</div></Card>}
    <XL f={f} at={fg + 2} pose="confused" x={888} y={1205} h={380} flip />
    {f >= f2 + 54 && f < F(tSay) && <XL f={f} at={f2 + 54} pose="surprised" x={888} y={1205} h={380} flip />}
  </AbsoluteFill>;
};

// —— B：L03b 手机红包（示意）
const SB: React.FC<{f: number}> = ({f}) => {
  const a = F(tSay) - 4, hb = kf(2, '红包'), none = kf(2, '没用完'), zero = kf(2, '零元购'), man = kf(2, '满减');
  const ph = {x: 150, y: 36, w: 440}; const phH = ph.w * 1616 / 863; // ≈824
  const sc = {x: ph.x + ph.w * .089, y: ph.y + phH * .079, w: ph.w * .821, h: phH * .817};
  const items = [{t: '零元购', amt: '¥0', at: zero, f: 'a'}, {t: '满减红包', amt: '满30减10', at: man, f: 'b'}, {t: '新人立减', amt: '¥8', at: hb + 3, f: 'c'}];
  const shake = f >= none && f < none + 14 ? Math.sin((f - none) * 2.4) * 6 * (1 - (f - none) / 14) : 0;
  return <AbsoluteFill>
    <Title f={f} at={a} sub="说人话">就是手机里的{V('红包')}</Title>
    <Win f={f} flip={a}>
      <D n="d01_phone" x={ph.x} y={ph.y} w={ph.w} shadow />
      {items.map((it, k) => { const p = popS(f, it.at); if (p <= 0) return null; const cw = sc.w - 30, ch = cw * 0.2 + 0; const cy = sc.y + 70 + k * (ch + 40);
        return <div key={k} style={{position: 'absolute', left: sc.x + 15, top: cy, width: cw, height: ch, transform: `scale(${p})`, transformOrigin: 'left center'}}>
          <D n={`d01_coupon_${it.f}`} x={0} y={0} w={cw} />
          <div style={{position: 'absolute', left: 0, top: 0, width: cw * .55, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: it.amt.length > 4 ? 34 : 50, color: '#FFFDF6'}}>{it.amt}</div>
          <div style={{position: 'absolute', left: cw * .57, top: 0, width: cw * .42, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 30, color: PAL.ink}}>{it.t}</div></div>; })}
      <div style={{position: 'absolute', left: sc.x + sc.w - 70 + shake, top: ph.y + 6, width: 100, height: 100, transform: `scale(${popS(f, hb + 6)})`}}>
        <D n="d01_red_dot" x={0} y={0} w={100} /><div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: '#FFFDF6'}}>7</div></div>
      <div style={{position: 'absolute', left: 620, top: 120, width: 260, fontFamily: SERIF, fontWeight: 900, fontSize: 44, lineHeight: 1.3, color: PAL.ink, opacity: iv(f, hb + 4, hb + 12)}}>零元购<br />满减券<br /><span style={{color: PAL.vermilion}}>天天推送</span></div>
    </Win>
    <Card f={f} at={a + 10} tag="示意" kind="demo"><div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: PAL.ink, marginTop: 14}}>我的红包：还有 {V('7 张')} 没用完</div>
      <div style={{fontFamily: SANS, fontSize: 24, color: PAL.ink, opacity: .6, marginTop: 8}}>示意图 · 非真实 App 界面</div></Card>
    <XL f={f} at={none - 2} pose="happy" x={868} y={1205} h={400} flip />
  </AbsoluteFill>;
};

// —— C：L04 硬币账（100 枚）
const SC_: React.FC<{f: number}> = ({f}) => {
  const a = F(L[3].start) - 3, t79 = kf(3, '七十九'), t25 = kf(3, '二零二五年'), t103 = kf(3, '一百零三');
  const STEP = 54, GX = 40, GY = 150; const BOX = {x: 640, y: 420, w: 190, h: 300};
  const r2 = f >= t25 - 2; const N = r2 ? 103 : 79; const start = r2 ? t103 - 10 : t79 - 6; const dur = r2 ? 36 : 28;
  const coinPos = (k: number) => ({x: GX + (k % 10) * STEP, y: GY + Math.floor(k / 10) * STEP});
  const landed = (j: number) => start + (j / N) * dur + 10; // 落箱帧
  let cnt = 0; for (let j = 0; j < N; j++) if (f >= landed(j)) cnt++;
  const flying: React.ReactNode[] = [];
  for (let j = 0; j < N; j++) { const t0 = start + (j / N) * dur; if (f < t0 || f >= t0 + 10) continue; const p = (f - t0) / 10; const s0 = coinPos(j >= 100 ? j - 100 : 99 - j); const over = j >= 100;
    const x = over ? s0.x + (BOX.x + 130 + (j - 100) * 70 - s0.x) * p : s0.x + (BOX.x + 70 + (j % 5) * 12 - s0.x) * p; const y = s0.y + ((over ? BOX.y + BOX.h - 50 : BOX.y + 40) - s0.y) * p - Math.sin(p * Math.PI) * 150;
    flying.push(<Img key={j} src={staticFile('t02/props/coin_96.png')} style={{position: 'absolute', left: x, top: y, width: 50}} />); }
  const gridCoin = (k: number) => { const j = r2 ? (k < 100 ? 99 - k : -1) : 99 - k; const gone = j >= 0 && j < N && f >= start + (j / N) * dur; const at = r2 ? t25 + 2 + k * .25 : a + 6 + k * .45; const s = popS(f, at); return gone || s <= 0 ? null : <Img key={k} src={staticFile('t02/props/coin_96.png')} style={{position: 'absolute', left: coinPos(k).x, top: coinPos(k).y, width: 50, transform: `scale(${s})`}} />; };
  const fill = Math.min(1, cnt / 100); const spill = r2 ? Math.max(0, cnt - 100) : 0;
  return <AbsoluteFill>
    <Title f={f} at={a} sub={r2 ? '2025 年 · 核心本地商业' : '2024 年 · 核心本地商业'}>每收 100 块，{V(r2 ? '花 103' : '花 79')}</Title>
    <Win f={f} flip={a}>
      <div style={{position: 'absolute', left: GX, top: 84, fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: PAL.ink}}>收入 100</div>
      <div style={{position: 'absolute', left: BOX.x - 6, top: BOX.y - 120, width: BOX.w + 40, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: PAL.ink}}>成本</div>
      <div style={{position: 'absolute', left: BOX.x - 6, top: BOX.y - 76, width: BOX.w + 40, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 70, color: cnt > 100 ? PAL.vermilion : PAL.ink, fontVariantNumeric: 'tabular-nums'}}>{cnt}</div>
      {/* 成本箱（占位：代码绘制，D05 未交付） */}
      <div style={{position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, background: '#D9A86C', border: `6px solid ${PAL.ink}`, borderRadius: 8, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, background: cnt > 100 ? PAL.vermilion : PAL.copper, opacity: .85}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, borderTop: `4px dashed ${PAL.ink}`, opacity: .6}} />
      </div>
      <div style={{position: 'absolute', left: BOX.x + BOX.w + 12, top: BOX.y - 6, fontFamily: SANS, fontWeight: 900, fontSize: 24, color: PAL.ink, opacity: .6}}>收入线</div>
      {Array.from({length: 100}, (_, k) => gridCoin(k))}{flying}
      {Array.from({length: spill}, (_, i) => <Img key={i} src={staticFile('t02/props/coin_96.png')} style={{position: 'absolute', left: BOX.x + BOX.w + 4 + i * 60, top: BOX.y + BOX.h - 52 + (i % 2) * 6, width: 52, transform: `rotate(${i * 40}deg)`}} />)}
      {r2 && spill >= 3 && <div style={{position: 'absolute', left: 560, top: 740, width: 340, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAL.vermilion}}>溢出 3</div>}
      {!r2 && f >= t79 + 20 && <div style={{position: 'absolute', left: GX, top: 740, fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: PAL.ink, opacity: iv(f, t79 + 20, t79 + 30)}}>还剩 21</div>}
    </Win>
    <Card f={f} at={a + 8} tag={r2 ? '事实 + 约 · 核心本地商业 2025' : '事实 + 约 · 核心本地商业 2024'} kind="fact" src="美团 2025 年度业绩公告 · 核心本地商业（第 4、5 页）">
      <div style={{position: 'absolute', left: 0, top: -6, width: 560, height: 124, overflow: 'hidden', background: '#fff', borderRadius: 6}}>
        <Img src={staticFile(r2 ? 't02/real/pdf/R04_2025_strip.png' : 't02/real/pdf/R04_2024_strip.png')} style={{position: 'absolute', left: 0, top: 0, width: 560, height: 560 * 242 / 1117}} />
        </div>
      <div style={{position: 'absolute', left: 570, top: -10, width: 300, textAlign: 'center', whiteSpace: 'nowrap'}}>
        <div style={{fontFamily: SANS, fontSize: 22, color: PAL.ink, opacity: .65}}>成本 ÷ 收入</div>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 68, color: r2 ? PAL.vermilion : PAL.ink, fontVariantNumeric: 'tabular-nums'}}>约{r2 ? '103' : '79'}%</div></div>
    </Card>
    <XL f={f} at={t103 + 2} pose="sigh_sad" x={150} y={1205} h={330} />
  </AbsoluteFill>;
};

// —— D：L05 饭局类比
const SD: React.FC<{f: number}> = ({f}) => {
  const a = F(L[4].start) - 3, pay = kf(4, '买单'), reg = kf(4, '熟客');
  const slap = f >= pay + 4; const hx = 1000 - (1000 - 330) * iv(f, pay - 8, pay + 2);
  return <AbsoluteFill>
    <Title f={f} at={a} sub="类比">像饭局上<span style={{color: PAL.vermilion}}>抢着买单</span>的人</Title>
    <Win f={f} flip={a}>
      <D n="d02_diner_b" x={10} y={190} w={330} s={popS(f, a + 8)} shadow /><D n="d02_diner_c" x={590} y={170} w={290} s={popS(f, a + 12)} shadow /><D n="d02_diner_a" x={300} y={60} w={310} s={popS(f, a + 16)} shadow />
      <D n="d02_table" x={180} y={330} w={560} s={popS(f, a + 4)} shadow />
      {!slap && <D n="d02_hand_bill" x={hx} y={300} w={520} rot={-4} shadow origin="left center" />}
      {slap && <D n="d02_bill_slap_pose" x={300} y={410} w={460} shadow s={1 + .08 * Math.max(0, 1 - (f - pay - 4) / 6)} />}
      {f >= reg && <div style={{position: 'absolute', left: 36, top: 150, transform: `rotate(-6deg) scale(${popS(f, reg)})`, padding: '4px 22px', background: PAL.copper, color: '#FFFDF6', fontFamily: SERIF, fontWeight: 900, fontSize: 60, borderRadius: 10, boxShadow: '0 6px 0 rgba(80,40,10,.25)'}}>熟客</div>}
    </Win>
    <Card f={f} at={a + 10} tag="类比" kind="demo"><div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: PAL.ink, marginTop: 8}}>不是钱多，是想把你变成{V('熟客')}</div></Card>
  </AbsoluteFill>;
};

// —— E：L06 平台 → 监管公告原话
const SE: React.FC<{f: number}> = ({f}) => {
  const a = F(L[5].start) - 3, tJun = kf(5, '今年六月'), tNot = kf(5, '不全是'), tHold = kf(5, '裹挟');
  const e2 = tJun - 4; const e3 = tNot - 4;
  const ring = iv(f, tHold - 2, tHold + 10);
  const vbN = camAt(f, [[0, [0, -340, 1640, 1546]], [e3, [0, -340, 1640, 1546]]]);
  const vbNews = camAt(f, [[0, [0, -114, 1640, 1546]], [e3 + 6, [0, -114, 1640, 1546]], [tHold - 14, [250, 560, 1390, 1310]]]);
  const shops = [0, 1, 2].map((k) => ({x: 250 + k * 190, y: 18}));
  return <AbsoluteFill>
    <Title f={f} at={a} sub={f < e2 ? '问题' : '监管部门 · 2026 年 6 月'}>{f < e2 ? <>差价，平台{V('自己掏')}？</> : f < e3 ? <>征求意见稿 · 公告</> : <>监管部门：{V('不全是')}</>}</Title>
    <Win f={f} flip={a}>
      {f < e2 + 6 && <AbsoluteFill>
        <D n="d03_platform" x={60} y={150} w={520} shadow s={popS(f, a + 6)} /><D n="d03_moneybag" x={560} y={420} w={270} shadow s={popS(f, a + 14)} />
        <div style={{position: 'absolute', left: 520, top: 140, fontFamily: SERIF, fontWeight: 900, fontSize: 200, color: PAL.vermilion, transform: `scale(${popS(f, a + 20)}) rotate(8deg)`}}>？</div></AbsoluteFill>}
      {f >= e2 && f < e3 + 6 && <AbsoluteFill style={{opacity: iv(f, e2, e2 + 4) * (1 - iv(f, e3 + 2, e3 + 8))}}><PageStage src="t02/real/web/R06_samr_notice_crop.png" box={[0, 0, 1640, 846]} vb={vbN}>{(s) => <>
        <Mark b={[800, 173, 1303, 264]} p={iv(f, e2 + 8, e2 + 24)} /><Ring b={[537, 423, 1104, 452]} p={iv(f, e2 + 14, e2 + 28)} s={s} w={7} c={PAL.vermilion} pad={10} /></>}</PageStage></AbsoluteFill>}
      {f >= e3 && <AbsoluteFill style={{opacity: iv(f, e3 + 2, e3 + 8)}}><PageStage src="t02/real/web/R07_samr_news_crop.png" box={[0, 0, 1640, 1318]} vb={vbNews}>{(s) => <>
        <Mark b={[983, 884, 1373, 918]} p={iv(f, tHold - 3, tHold + 12)} c="#FFC277" o={.75} /><Ring b={[983, 884, 1373, 918]} p={iv(f, tHold + 8, tHold + 24)} s={s} w={7} c={PAL.vermilion} pad={12} /></>}</PageStage>
        <div style={{position: 'absolute', left: 40, top: 40, fontFamily: SERIF, fontWeight: 900, fontSize: 130, color: PAL.vermilion, opacity: iv(f, tNot, tNot + 5) * (1 - iv(f, tHold - 10, tHold - 2)), transform: `rotate(-7deg) scale(${1.4 - .4 * iv(f, tNot, tNot + 5)})`, WebkitTextStroke: '10px #FFFDF6', paintOrder: 'stroke fill'}}>不全是</div></AbsoluteFill>}
    </Win>
    {f < tNot && <Card f={f} at={a + 12} tag="问题" kind="demo"><div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: PAL.ink, marginTop: 14}}>补贴的差价，由谁承担？</div></Card>}
    {f >= tNot && f < tHold + 36 && <Card f={f} at={tNot} tag="示意" kind="demo">
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}}>
        <D n="d03_platform" x={0} y={4} w={150} />
        <div style={{position: 'absolute', left: 220 + ring * 0, top: 0, width: 600, height: 130}}>
          {[0, 1, 2].map((k) => { const sh = f >= tHold - 2 ? 0 : Math.sin((f + k * 9) * .5) * 4; return <D key={k} n="d04_shop_a" x={30 + k * 190 + sh} y={14} w={150} />; })}
          <div style={{position: 'absolute', left: 0, top: -12, width: 600 * (0.4 + 0.6 * ring), height: 150, border: `6px solid ${PAL.copper}`, borderRadius: 80, opacity: ring, transform: `scaleX(${1})`}} />
          <div style={{position: 'absolute', left: 230, top: 126, fontFamily: SANS, fontWeight: 900, fontSize: 24, color: PAL.copper, opacity: ring}}>补贴圈</div></div></div></Card>}
    {f >= tHold + 36 && <Card f={f} at={tHold + 36} tag="事实" kind="fact" src="国家市场监督管理总局 · 2026-06-17">
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 36, color: PAL.ink, lineHeight: 1.25}}>《外卖平台补贴行为规范十条（<span style={{color: PAL.vermilion}}>征求意见稿</span>）》</div>
      <div style={{fontFamily: SANS, fontSize: 28, color: PAL.ink, opacity: .75, marginTop: 8}}>2026 年 6 月 17 日发布 · 意见反馈截止 7 月 17 日</div></Card>}
    <XL f={f} at={tNot + 2} pose="point" x={880} y={1205} h={380} flip />
  </AbsoluteFill>;
};

// —— F：L07 峰值：商家结算单（示意）
const SF: React.FC<{f: number}> = ({f}) => {
  const a = F(L[6].start) - 3, tK = kf(6, '不知道'), tS = kf(6, '也要出一份');
  const split = iv(f, tS, tS + 14);
  const rows = [{t: '餐品销售', y: 220}, {t: '平台技术服务费（佣金）', y: 330}, {t: '配送服务费', y: 440}];
  const tok = (dx: number, dy: number, k: number) => <div key={k} style={{position: 'absolute', left: 456 - 40 + dx * split, top: 440 - 6 + dy * split - Math.sin(split * Math.PI) * 90, width: 80, height: 80, borderRadius: 40, background: PAL.copper, border: `5px solid ${PAL.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 24, color: '#FFFDF6', opacity: split > 0 ? 1 : 0}}>配送</div>;
  return <AbsoluteFill>
    <Title f={f} at={a} sub="示意：商家结算单">配送费，商家也要{V('出一份')}</Title>
    <Win f={f} flip={a}>
      <D n="d06_receipt_paper" x={226} y={30} w={460} s={1} style={{height: 790, transform: `rotate(-1deg)`}} shadow />
      <div style={{position: 'absolute', left: 226, width: 460, top: 100, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 42, color: PAL.ink}}>商家结算单</div>
      <div style={{position: 'absolute', left: 226, width: 460, top: 156, textAlign: 'center', fontFamily: SANS, fontSize: 22, color: PAL.ink, opacity: .6}}>示意图 · 非真实账单</div>
      {rows.map((r, k) => <React.Fragment key={k}>
        <div style={{position: 'absolute', left: 266, top: r.y, fontFamily: SANS, fontWeight: 900, fontSize: k === 1 ? 24 : 28, color: PAL.ink, opacity: iv(f, a + 6 + k * 4, a + 12 + k * 4)}}>{r.t}</div>
        <div style={{position: 'absolute', left: 560, width: 100, textAlign: 'right', top: r.y, fontFamily: SERIF, fontWeight: 900, fontSize: 28, color: PAL.ink, opacity: iv(f, a + 6 + k * 4, a + 12 + k * 4)}}>¥ —</div></React.Fragment>)}
      <Mark b={[250, 430, 672, 486]} p={iv(f, tK, tK + 12)} />
      {f >= tK + 6 && f < tS && <div style={{position: 'absolute', left: 640, top: 380, fontFamily: SERIF, fontWeight: 900, fontSize: 96, color: PAL.vermilion, transform: `scale(${popS(f, tK + 6)})`}}>？</div>}
      <div style={{position: 'absolute', left: 14, top: 470, width: 190, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, color: PAL.ink}}>顾客</div>
      <D n="d06_phone_icon" x={44} y={500} w={130} shadow s={popS(f, a + 10)} />
      <D n="d06_shop_icon" x={700} y={470} w={200} shadow s={popS(f, a + 12)} />
      <div style={{position: 'absolute', left: 700, top: 440, width: 200, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, color: PAL.ink}}>商家</div>
      {split > 0 && <>{tok(-330, 110, 0)}{tok(300, 90, 1)}</>}
      {f >= tS + 4 && <ObsSeal f={f - tS - 4} x={610} y={110} size={190} />}
    </Win>
    {f >= tK + 20 && <Card f={f} at={tK + 20} tag="美团官方说明" kind="fact" src="meituan.com · 官方说明页">
      <div style={{position: 'absolute', left: 0, top: -4, width: 860, height: 130, overflow: 'hidden', background: '#fff', borderRadius: 6}}>
        <Img src={staticFile('t02/real/web/R08_meituan_explainer_para.png')} style={{position: 'absolute', left: 0, top: 0, width: 860, height: 860 * 296 / 1944}} />
        <div style={{position: 'absolute', left: 860 * 80 / 1944, top: 860 * 36 / 1944, width: 860 * 650 / 1944 * 1, height: 860 * 48 / 1944, background: '#FFC277', opacity: .6 * iv(f, tK + 24, tK + 38), mixBlendMode: 'multiply'}} /></div></Card>}
    <XL f={f} at={tS - 2} pose="surprised" x={880} y={1205} h={440} scale={1.12} flip />
  </AbsoluteFill>;
};

// —— G：L08 谁扛 → 净亏 234 亿
const SG: React.FC<{f: number}> = ({f}) => {
  const a = F(L[7].start) - 3, tM = kf(7, '商家扛'), tH = kf(7, '股东扛'), tN = kf(7, '二百三十四亿'); const sw = tN - 8;
  const vb = camAt(f, [[0, V_BOTTOM], [9999, V_BOTTOM]]);
  const arr = (x: number, dir: 1 | -1, at: number, c: string) => <div style={{position: 'absolute', left: x, top: 360, width: 150, height: 30, opacity: iv(f, at, at + 6)}}>
    <div style={{position: 'absolute', left: dir > 0 ? 0 : 20, top: 8, width: 130 * iv(f, at, at + 10), height: 14, background: c, borderRadius: 7}} />
    <div style={{position: 'absolute', left: dir > 0 ? 100 + 40 * iv(f, at, at + 10) : 0, top: 0, width: 0, height: 0, borderTop: '15px solid transparent', borderBottom: '15px solid transparent', [dir > 0 ? 'borderLeft' : 'borderRight']: `28px solid ${c}`}} /></div>;
  const ringP = iv(f, sw - 6, sw + 4), ringO = 1 - iv(f, sw + 6, sw + 12);
  return <AbsoluteFill>
    <Title f={f} at={a} sub="代价">这笔账，{V('谁扛')}？</Title>
    <Win f={f} flip={a}>
      {f < sw + 3 && <AbsoluteFill>
        <D n="d07_ledger" x={250} y={190} w={420} shadow s={popS(f, a + 4)} />
        <div style={{position: 'absolute', left: 250, width: 420, top: 250, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: PAL.ink}}>这笔账</div>
        <div style={{position: 'absolute', left: 250, width: 420, top: 360, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 120, color: PAL.vermilion, opacity: .9}}>亏</div>
        <D n="d07_arrow_left" x={170} y={430} w={150} o={iv(f, tM, tM + 6)} s={iv(f, tM, tM + 10)} origin="right center" /><D n="d07_arrow_right" x={600} y={430} w={150} o={iv(f, tH, tH + 6)} s={iv(f, tH, tH + 10)} origin="left center" />
        <D n="d04_shop_a" x={-20 + (f >= tM && f < tM + 8 ? Math.sin(f * 2) * 4 : 0)} y={430} w={190} shadow s={popS(f, a + 6)} />
        <D n="d08_holder" x={745} y={380} w={150} shadow s={popS(f, a + 10)} />
        <div style={{position: 'absolute', left: 14, top: 640, width: 170, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: PAL.copper, opacity: iv(f, tM, tM + 6)}}>商家</div>
        <div style={{position: 'absolute', left: 722, top: 700, width: 180, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: PAL.teal, opacity: iv(f, tH, tH + 6)}}>股东</div>
        <div style={{position: 'absolute', left: 150, width: 612, top: 640, textAlign: 'center', fontFamily: SANS, fontSize: 28, color: PAL.ink, opacity: .6}}>示意 · 各承担多少，不在年报里</div>
      </AbsoluteFill>}
      {f >= sw + 3 && <PageStage {...P25} vb={vb}>{(s) => <>
        <Mark b={[43, 721, 553, 755]} p={iv(f, tN - 2, tN + 12)} c="#FFC277" o={.6} /><Ring b={[250, 721, 553, 755]} p={iv(f, tN + 4, tN + 18)} s={s} c={PAL.vermilion} pad={8} w={7} /></>}</PageStage>}
      {f >= sw - 6 && f < sw + 14 && <div style={{position: 'absolute', inset: 0}}><BrassRing f={f} x={456} y={430} size={560} o={ringO * iv(f, sw - 6, sw - 1)} scan={ringP} /></div>}
    </Win>
    {f >= sw + 6 ? <Card f={f} at={sw + 6} tag="事实" kind="fact" src="美团 2025 年度业绩公告 · 第 25 页">
      <div style={{position: 'absolute', left: 0, top: -14, fontFamily: SERIF, fontWeight: 900, fontSize: 112, color: PAL.vermilion, fontVariantNumeric: 'tabular-nums', transform: `scale(${1 + .12 * Math.max(0, 1 - (f - tN) / 8)})`, transformOrigin: 'left center'}}>−<Count f={f} a={tN - 2} b={tN + 22} to={234} /> 亿</div>
      <div style={{position: 'absolute', left: 430, top: 14, width: 420, fontFamily: SANS, fontWeight: 900, fontSize: 34, color: PAL.ink, lineHeight: 1.4}}>2025 年内亏损<br /><span style={{fontSize: 26, opacity: .65}}>2024 年为盈利 358 亿</span></div></Card>
     : f >= tH + 10 && <Card f={f} at={tH + 10} tag="示意" kind="demo"><div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 54, color: PAL.ink, marginTop: 16}}>一部分{V('商家')}扛，一部分{V('股东')}扛</div></Card>}
  </AbsoluteFill>;
};

// —— H：L09 反转：二季度赚回
const SH: React.FC<{f: number}> = ({f}) => {
  const a = F(L[8].start) - 3, tSub = kf(8, '补贴一收'), t57 = kf(8, '五十七亿'), t79 = kf(8, '七点九');
  return <AbsoluteFill>
    <Title f={f} at={a} sub="2026 年中期业绩公告">补贴一收，{V('赚回来了')}</Title>
    <Win f={f} flip={a}>
      <PageStage {...H1} vb={[30, 285, 540, 509]}>{(s) => <>
        <Mark b={[43, 505, 553, 523]} p={iv(f, tSub + 4, tSub + 22)} />
        <Ring b={[416, 321, 471, 337]} p={iv(f, a + 10, a + 24)} s={s} c={PAL.vermilion} /><Ring b={[524, 321, 557, 337]} p={iv(f, a + 16, a + 28)} s={s} c={PAL.vermilion} />
        <Ring b={[250, 321, 298, 337]} p={iv(f, t57, t57 + 12)} s={s} /><Ring b={[357, 321, 383, 337]} p={iv(f, t79, t79 + 12)} s={s} /></>}</PageStage>
      {f >= t79 && <div style={{position: 'absolute', right: 24, top: 24, padding: '0 22px', background: '#FFFDF6', border: `5px solid ${PAL.copper}`, borderRadius: 14, fontFamily: SERIF, fontWeight: 900, fontSize: 84, color: PAL.ink, transform: `scale(${1.3 - .3 * iv(f, t79, t79 + 6)}) rotate(-3deg)`, transformOrigin: 'right top', boxShadow: '0 8px 0 rgba(80,40,10,.2)'}}>7.9%</div>}
    </Win>
    <Card f={f} at={a + 10} tag="事实" kind="fact" src="美团 2026 年中期业绩公告 · 第 19 页" srcTop>
      <div style={{position: 'absolute', left: 0, top: -6, fontFamily: SANS, fontSize: 24, color: PAL.ink, opacity: .6}}>核心本地商业 · 经营利润（亿元）</div>
      <div style={{position: 'absolute', left: 0, top: 24, right: 0, bottom: 0}}><HBars f={f} max={57} rows={[{label: '一季度', v: -20, c: PAL.vermilion, at: a + 12, text: '−20'}, {label: '二季度', v: 57, c: PAL.ink, at: t57 - 4, text: '+57'}]} /></div>
    </Card>
    <XL f={f} at={t79} pose="happy" x={888} y={1205} h={380} flip />
  </AbsoluteFill>;
};

// —— I：L10 只回到 7.9%；财新
const SI: React.FC<{f: number}> = ({f}) => {
  const a = F(L[9].start) - 3, t209 = kf(9, '二十点九'), tHi = kf(9, '仍高于'); const sw = tHi - 10;
  const vb = camAt(f, [[0, [0, -300, 1112, 1048]], [sw + 8, [0, -300, 1112, 1048]], [tHi + 18, [0, 90, 880, 830]]]);
  const H = 440, g = iv(f, a + 4, a + 18), g2 = iv(f, t209 - 4, t209 + 14), br = iv(f, t209 + 14, t209 + 28);
  return <AbsoluteFill>
    <Title f={f} at={a} sub={f < sw ? '对比' : '财新网 · 2026-08-28'}>{f < sw ? <>但只回到 {V('7.9%')}</> : <>行业补贴，{V('仍高于')} 2024</>}</Title>
    <Win f={f} flip={a}>
      {f < sw + 4 && <AbsoluteFill>
        <div style={{position: 'absolute', left: 80, top: 100, width: 760, height: 3, background: PAL.ink, opacity: 0}} />
        <div style={{position: 'absolute', left: 100, right: 100, top: 724, height: 4, background: PAL.ink, opacity: .5}} />
        <div style={{position: 'absolute', left: 180, top: 724 - H * 7.9 / 20.9 * g, width: 170, height: H * 7.9 / 20.9 * g, background: PAL.copper, borderRadius: '8px 8px 0 0'}} />
        <div style={{position: 'absolute', left: 180, width: 170, textAlign: 'center', top: 724 - H * 7.9 / 20.9 - 86, fontFamily: SERIF, fontWeight: 900, fontSize: 70, color: PAL.copper, opacity: g}}>7.9%</div>
        <div style={{position: 'absolute', left: 480, top: 724 - H * g2, width: 170, height: H * g2, background: PAL.teal, borderRadius: '8px 8px 0 0'}} />
        <div style={{position: 'absolute', left: 480, width: 170, textAlign: 'center', top: 724 - H - 86, fontFamily: SERIF, fontWeight: 900, fontSize: 70, color: PAL.teal, opacity: g2}}>20.9%</div>
        <div style={{position: 'absolute', left: 150, width: 230, textAlign: 'center', top: 744, fontFamily: SANS, fontWeight: 900, fontSize: 28, color: PAL.ink}}>2026 二季度</div>
        <div style={{position: 'absolute', left: 450, width: 230, textAlign: 'center', top: 744, fontFamily: SANS, fontWeight: 900, fontSize: 28, color: PAL.ink}}>2024 全年</div>
        {br > 0 && <svg width={912} height={860} style={{position: 'absolute', inset: 0}}>
          <line x1={350} y1={724 - H * 7.9 / 20.9} x2={720} y2={724 - H * 7.9 / 20.9} stroke={PAL.vermilion} strokeWidth={3} strokeDasharray="10 8" opacity={br} />
          <line x1={720} y1={724 - H * 7.9 / 20.9} x2={720} y2={724 - H * 7.9 / 20.9 + (H * (1 - 7.9 / 20.9)) * -br} stroke={PAL.vermilion} strokeWidth={6} />
          <line x1={650} y1={724 - H} x2={730} y2={724 - H} stroke={PAL.vermilion} strokeWidth={3} strokeDasharray="10 8" opacity={br} /></svg>}
        {br > .5 && <div style={{position: 'absolute', left: 722, top: 330, width: 180, fontFamily: SERIF, fontWeight: 900, fontSize: 40, lineHeight: 1.2, color: PAL.vermilion}}>差<br />约 13<br />个百分点</div>}
      </AbsoluteFill>}
      {f >= sw && <AbsoluteFill style={{opacity: iv(f, sw + 2, sw + 8)}}><PageStage src="t02/real/web/R10_caixin_head.png" box={[0, 0, 1112, 449]} vb={vb}>{(s) => <>
        <Mark b={[89, 334, 865, 371]} p={iv(f, tHi - 2, tHi + 14)} c="#FFC277" o={.7} /><Ring b={[89, 334, 340, 371]} p={iv(f, tHi + 10, tHi + 24)} s={s} c={PAL.vermilion} pad={10} w={7} /></>}</PageStage></AbsoluteFill>}
    </Win>
    {f < sw + 6 ? <Card f={f} at={a + 12} tag="事实" kind="fact" src="年报 p25 · 中期 p19">
      {[{y: -8, im: 't02/real/pdf/R05_20_9_strip.png', lab: '2024 全年'}, {y: 66, im: 't02/real/pdf/R05_7_9_strip.png', lab: '2026 二季度'}].map((r, k) => <div key={k} style={{position: 'absolute', left: 0, top: r.y, width: 860, height: 56, overflow: 'hidden', background: '#fff', borderRadius: 5}}>
        <Img src={staticFile(r.im)} style={{position: 'absolute', left: 150, top: 0, width: 700, height: 700 * 108 / 2167}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: 140, height: '100%', background: PAL.ink, color: PAL.paper, fontFamily: SANS, fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{r.lab}</div></div>)}
    </Card> : <Card f={f} at={sw + 6} tag="事实" kind="fact" src="财新网 · 2026-08-28">
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAL.ink, lineHeight: 1.3, marginTop: 4}}><span style={{color: PAL.vermilion}}>美团指出</span>：目前行业补贴水平仍明显高于2024年的水平</div></Card>}
    <XL f={f} at={tHi + 2} pose="confused" x={888} y={1205} h={380} flip />
  </AbsoluteFill>;
};

// —— J：L11 S0 金句收束
const SJ: React.FC<{f: number}> = ({f}) => {
  const a = F(L[10].start) - 3, tW = kf(10, '不会白发'), tT = kf(10, '先想想'), tWho = kf(10, '谁头上'); const land = popS(f, tW - 6);
  const drop = (1 - iv(f, tW - 10, tW + 2)) * -700;
  return <AbsoluteFill>
    <div style={{position: 'absolute', left: 84, width: 912, top: 280, textAlign: 'left', fontFamily: SERIF, fontWeight: 900, fontSize: 104, lineHeight: 1.12, color: PAL.ink, opacity: iv(f, tW - 4, tW + 4), transform: `translateY(${(1 - iv(f, tW - 4, tW + 4)) * 20}px)`}}>红包，<br />{V('不会白发')}</div>
    <div style={{position: 'absolute', left: 110, top: 560 + drop, width: 360, height: 600}}>
      <div style={{position: 'absolute', left: 20, top: 560, width: 320, height: 50, background: 'radial-gradient(ellipse, rgba(40,25,10,.35), rgba(40,25,10,0) 70%)', opacity: iv(f, tW, tW + 4)}} />
      <D n={f >= tT ? 'd10_redpacket_open' : 'd10_redpacket_front'} x={0} y={0} w={f >= tT ? 270 : 300} rot={-6 + (f >= tW ? 2 * Math.max(0, 1 - (f - tW) / 10) : 0)} shadow style={{height: undefined}} /></div>
    {f >= tT && <div style={{position: 'absolute', left: 84, width: 840, top: 1190, fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: PAL.ink, opacity: iv(f, tT, tT + 8)}}>下次领红包，先想想：</div>}
    {f >= tWho - 6 && <div style={{position: 'absolute', left: 84, width: 912, top: 1262, fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: PAL.ink, opacity: iv(f, tWho - 6, tWho + 2)}}>这笔账，最后记在 <span style={{display: 'inline-block', fontSize: 110, color: PAL.vermilion, transform: `scale(${1 + .3 * Math.max(0, 1 - (f - tWho) / 10)})`, transformOrigin: 'left center'}}>谁头上</span></div>}
    {f >= tWho + 2 && <ObsSeal f={f - tWho - 2} x={905} y={1160} size={170} />}
    <XL f={f} at={a + 8} pose={f >= tT ? 'point' : 'stand_neutral'} x={800} y={1170} h={640} flip={f >= tT ? true : true} />
  </AbsoluteFill>;
};

// ───────────── 场景表 + 音效 ─────────────
const SCN: [number, React.FC<{f: number}>][] = [
  [0, SA], [tSay - 0.12, SB], [L[3].start - 0.1, SC_], [L[4].start - 0.1, SD], [L[5].start - 0.1, SE], [L[6].start - 0.1, SF], [L[7].start - 0.1, SG], [L[8].start - 0.1, SH], [L[9].start - 0.1, SI], [L[10].start - 0.1, SJ],
];
const SFXD = (n: string) => `g6/sfx_v3/${n}.wav`;
const VOL = {SUB: .38, WH: .26, POP: .28, TICK: .16, CHIME: .22, THOCK: .32, RISE: .22};
const S = (t: number, n: string, v: number): [number, string, number] => [t, n, v];
const ticks = (t0: number, n: number, gap: number, v = VOL.TICK * .7) => Array.from({length: n}, (_, k) => S(t0 + k * gap, 'keyboard-typing-sound-effect', v));
export const SFX_LIST: [number, string, number][] = [
  // L01
  S(0.0, 'soft_boom', VOL.SUB * .8), S(0.0, 'whoosh-sfx', VOL.WH), S(tNear - 0.2, 'whoosh-sfx', VOL.WH * .8), ...ticks(tNear + 0.07, 5, 0.16), S(tNear + 0.8, 'pop_7e9Is8L', VOL.POP), S(tGone, 'pop_7e9Is8L', VOL.POP), S(L[1].start - 0.1, 'whoosh-wind', VOL.WH * .8),
  // L02
  S(t524, 'pop_7e9Is8L', VOL.POP), ...ticks(t524 + 0.5, 3, 0.16), S(t69, 'punch_u4LmMsr', VOL.THOCK * .7),
  // L03
  S(kw(2, '补贴'), 'whoosh-wind', VOL.WH * .5), S(tSay - 0.14, '166', VOL.WH), S(kw(2, '零元购'), 'pop_7e9Is8L', VOL.POP), S(kw(2, '满减'), 'pop_7e9Is8L', VOL.POP), ...[0, 1, 2].map((k) => S(kw(2, '红包') + k * 0.15, 'pop_7e9Is8L', VOL.POP)), S(kw(2, '没用完'), 'ding-sound-effect_2', VOL.CHIME),
  // L04
  S(L[3].start - 0.1, 'whoosh-sfx', VOL.WH), ...[0, 1, 2, 3, 4].map((k) => S(L[3].start + 0.2 + k * 0.45, 'pop_7e9Is8L', VOL.POP * .6)), ...ticks(kw(3, '七十九') - 0.2, 6, 0.16), S(kw(3, '七十九') + 0.75, 'pop_7e9Is8L', VOL.POP),
  S(kw(3, '二零二五年') - 0.05, 'whoosh-wind', VOL.WH * .6), ...ticks(kw(3, '一百零三') - 0.33, 6, 0.16), S(kw(3, '一百零三') + 0.7, 'cartoon-boing_7vRWDlc', VOL.POP),
  // L05
  S(L[4].start - 0.1, '166', VOL.WH), S(L[4].start + 0.15, 'pop_7e9Is8L', VOL.POP), S(kw(4, '买单') - 0.1, 'whoosh-sfx', VOL.WH * .8), S(kw(4, '买单') + 0.1, 'cartoon-boing_7vRWDlc', VOL.POP), S(kw(4, '熟客'), 'pop_7e9Is8L', VOL.POP),
  // L06
  S(L[5].start - 0.1, 'whoosh-wind', VOL.WH), S(L[5].start + 0.3, 'pop_7e9Is8L', VOL.POP * .7), S(kw(5, '今年六月') - 0.16, '166', VOL.WH), S(kw(5, '不全是') - 0.1, 'whoosh-sfx', VOL.WH * .8), S(kw(5, '不全是'), 'punch_u4LmMsr', VOL.THOCK * .7), S(kw(5, '裹挟'), 'soft_boom', VOL.SUB * .8),
  // L07
  S(L[6].start - 0.1, 'whoosh-wind', VOL.WH), S(kw(6, '不知道'), 'pop_7e9Is8L', VOL.POP), S(kw(6, '也要出一份') - 0.12, 'whoosh-sfx', VOL.WH), S(kw(6, '也要出一份'), 'soft_boom', VOL.SUB), S(kwEnd(6, '也要出一份') - 0.2, 'ding-sound-effect_2', VOL.CHIME * .8),
  // L08
  S(L[7].start - 0.1, '166', VOL.WH), S(kw(7, '商家扛'), 'pop_7e9Is8L', VOL.POP), S(kw(7, '股东扛'), 'pop_7e9Is8L', VOL.POP), S(kw(7, '二百三十四亿') - 0.4, 'whoosh-sfx', VOL.WH), ...ticks(kw(7, '二百三十四亿') - 0.05, 4, 0.16), S(kw(7, '二百三十四亿') + 0.45, 'soft_boom', VOL.SUB * .9),
  // L09
  S(L[8].start - 0.1, '166', VOL.WH), S(kw(8, '五十七亿') - 0.15, 'hanna-barbera-xylophone-quick-gliss-up', VOL.RISE), ...ticks(kw(8, '七点九') - 0.05, 3, 0.16), S(kw(8, '七点九') + 0.3, 'ding-sound-effect_2', VOL.CHIME),
  // L10
  S(L[9].start - 0.1, 'whoosh-wind', VOL.WH), S(kw(9, '二十点九'), 'punch_u4LmMsr', VOL.THOCK * .7), S(kw(9, '仍高于') - 0.45, 'whoosh-sfx', VOL.WH * .8), S(kw(9, '仍高于'), 'pop_7e9Is8L', VOL.POP),
  // L11
  S(L[10].start - 0.1, 'whoosh-sfx', VOL.WH), S(kw(10, '不会白发') - 0.02, 'punch_u4LmMsr', VOL.THOCK * .8), S(kw(10, '先想想'), 'pop_7e9Is8L', VOL.POP), S(kw(10, '谁头上') + 0.05, 'soft_boom', VOL.SUB), S(kw(10, '谁头上') + 0.15, 'sparkle-sound-effect', VOL.CHIME * .6),
];

const SealCorner: React.FC<{f: number}> = ({f}) => {
  if (f < 4) return null; const st = spring({frame: f - 4, fps: 30, config: {damping: 11, stiffness: 230}}); const op = interpolate(f - 4, [0, 3, 40, 54], [0, 1, 1, .85], clampO);
  return <Img src={staticFile('g6/brand/seal_t.png')} style={{position: 'absolute', left: 1080 - 40 - 84, top: 60, width: 84, height: 84, opacity: op, transform: `scale(${interpolate(st, [0, 1], [2.2, 1])}) rotate(${interpolate(st, [0, 1], [-16, -6])}deg)`, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.35))'}} />;
};

export const T02Full: React.FC<{bgm?: boolean}> = ({bgm = false}) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const si = SCN.reduce((m, [ts], k) => (f >= F(ts) ? k : m), 0); const Comp = SCN[si][1]; const s0 = F(SCN[si][0]); const p = iv(f, s0, s0 + 7);
  const li = L.reduce((m, l, k) => (t >= l.start - 0.1 ? k : m), 0);
  const last = si === SCN.length - 1;
  return <AbsoluteFill style={{background: '#EAD9BA'}}>
    <PaperBg />{!last && <Ground />}
    <div style={{position: 'absolute', inset: 0, transform: si ? `scale(${0.96 + 0.04 * p})` : undefined, opacity: si ? Math.min(1, .35 + p) : 1}}><Comp f={f} /></div>
    <Caption i={li} t={t - L[li].start} />
    <SealCorner f={f} />
    <Audio src={staticFile('t02/vo_full.wav')} />
    {SFX_LIST.map(([st, n, v], k) => <Sequence key={k} from={Math.max(0, Math.round(st * FPS))} durationInFrames={75}><Audio src={staticFile(SFXD(n))} volume={v} /></Sequence>)}
    {bgm && <Audio src={staticFile('g6/audio/bgm_investigations.mp3')} loop volume={(g) => 0.085 * interpolate(g, [0, 10, T02_FRAMES - 30, T02_FRAMES], [0, 1, 1, 0], clampO)} />}
  </AbsoluteFill>;
};
