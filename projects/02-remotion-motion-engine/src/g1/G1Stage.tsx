import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {C, FONT_SANS, FONT_SERIF} from '../core/tokens';

export type Variant = 'A' | 'B' | 'C';
export const G1_FRAMES = 216;
const W = 1080, H = 1920;
const IW = 941, IH = 1672;
// timeline (30fps): S0 0-40 | S1 40-66 | S2 66-132 | S3 132-180 | collapse->S1 180-216
const T = {s1: 40, s2: 66, s3: 132, back: 180};
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const ez = Easing.bezier(0.22, 1, 0.36, 1);
const iv = (f: number, a: number, b: number, from = 0, to = 1, e = ez) => interpolate(f, [a, b], [from, to], {...clamp, easing: e});
type Rect = {x: number; y: number; w: number; h: number};
const lerpR = (a: Rect, b: Rect, t: number): Rect => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t});
const FULL: Rect = {x: 0, y: 0, w: W, h: H};
const MAIN: Rect = {x: 84, y: 236, w: 912, h: 780};
const MINI = (i: number): Rect => ({x: 96 + i * 272, y: 1222, w: 252, h: 300});

const theme = {
  A: {bg: C.ink, panel: '#16302E', line: C.brass, text: C.cream, accent: C.amber, title: '万象观察台 · 机械', stepped: false},
  B: {bg: '#E9DABD', panel: C.cream, line: '#FFFFFF', text: C.ink, accent: C.red, title: '万象观察台 · 纸雕', stepped: true},
  C: {bg: '#F6EEDD', panel: '#FBF6EC', line: C.ink, text: C.ink, accent: C.red, title: '万象观察台 · 国潮', stepped: false},
};

/* ---------- L1 scene: SH02 with stack growing in paper-fold steps ---------- */
const Scene: React.FC<{f: number; r: Rect; focusX?: number; grey?: boolean}> = ({f, r, focusX = 0.6, grey}) => {
  const steps = [8, 16, 24, 32, 38];
  const n = steps.filter((s) => f >= s).length;
  const reveal = [540, 450, 360, 280, 220, 170][n]; // image-px top of revealed stack
  const k = Math.max(r.w / IW, r.h / IH);
  const iw = IW * k, ih = IH * k;
  const ox = Math.min(0, Math.max(r.w - iw, r.w / 2 - iw * focusX));
  const oy = (r.h - ih) / 2;
  const pop = steps.reduce((acc, s) => acc + (f >= s ? Math.exp(-(f - s) / 3) * Math.sin((f - s) * 1.3) * 0.012 : 0), 0);
  const kb = 1.0 + f * 0.0003;
  const imgStyle: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: iw, height: ih};
  return (
    <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden', filter: grey ? 'grayscale(1) contrast(1.15)' : undefined}}>
      <div style={{position: 'absolute', left: ox, top: oy, width: iw, height: ih, transform: `scale(${kb}) scaleY(${1 + pop})`, transformOrigin: '62% 62%'}}>
        <Img src={staticFile('g1/sh02.png')} style={imgStyle} />
        <Img src={staticFile('g1/sh02_nocart.png')} style={{...imgStyle, clipPath: `inset(${(180 / IH) * 100}% ${((IW - 897) / IW) * 100}% ${((IH - reveal) / IH) * 100}% ${(438 / IW) * 100}%)`}} />
      </div>
    </div>
  );
};

/* ---------- observer ring (B: brass mechanism) ---------- */
const Ring: React.FC<{v: Variant; f: number; size: number; x: number; y: number; o: number}> = ({v, f, size, x, y, o}) => {
  const rot = v === 'B' ? Math.floor(f / 4) * 12 : f * 2.2;
  const s = size;
  return (
    <svg width={s} height={s} viewBox="-100 -100 200 200" style={{position: 'absolute', left: x - s / 2, top: y - s / 2, opacity: o, overflow: 'visible', filter: v === 'B' ? 'drop-shadow(6px 9px 0 rgba(60,40,20,.28))' : v === 'A' ? 'drop-shadow(0 0 10px rgba(190,160,108,.5))' : undefined}}>
      <defs>
        <radialGradient id={`lens${v}`} cx="35%" cy="30%"><stop offset="0" stopColor="#CFE6E6" stopOpacity=".55" /><stop offset=".6" stopColor={C.cyan} stopOpacity=".12" /><stop offset="1" stopColor={C.ink} stopOpacity=".05" /></radialGradient>
        <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F1D9A0" /><stop offset=".45" stopColor={C.brass} /><stop offset="1" stopColor="#7E6435" /></linearGradient>
      </defs>
      {v === 'A' && (<>
        <circle r="92" fill="none" stroke="url(#brass)" strokeWidth="9" />
        <circle r="74" fill={`url(#lens${v})`} stroke="#7E6435" strokeWidth="2" />
        <g transform={`rotate(${rot})`}>{Array.from({length: 60}).map((_, i) => <line key={i} x1="0" y1={-80} x2="0" y2={i % 5 ? -85 : -88} stroke={C.brass} strokeWidth={i % 5 ? 1 : 2.4} transform={`rotate(${i * 6})`} />)}</g>
        <g transform={`rotate(${-rot * 0.6})`}><circle r="62" fill="none" stroke={C.brass} strokeWidth="1" strokeDasharray="2 6" />{[0, 120, 240].map((a) => <rect key={a} x="-3" y="-99" width="6" height="12" rx="1.5" fill="url(#brass)" transform={`rotate(${a})`} />)}</g>
        <line x1="-16" y1="0" x2="16" y2="0" stroke={C.amber} strokeWidth="1.5" /><line x1="0" y1="-16" x2="0" y2="16" stroke={C.amber} strokeWidth="1.5" />
      </>)}
      {v === 'B' && (<>
        <circle r="81" fill="none" stroke={C.cream} strokeWidth="22" /><circle r="70" fill="rgba(110,157,163,.12)" stroke="#fff" strokeWidth="5" /><circle r="93" fill="none" stroke="#fff" strokeWidth="3" />
        <g transform={`rotate(${rot})`}>{Array.from({length: 12}).map((_, i) => <path key={i} d="M-6,-90 L6,-90 L4,-78 L-4,-78Z" fill={i % 3 ? C.brass : C.red} transform={`rotate(${i * 30})`} />)}</g>
      </>)}
      {v === 'C' && (<>
        <circle r="88" fill="none" stroke={C.ink} strokeWidth="2" /><circle r="80" fill="none" stroke={C.ink} strokeWidth=".8" />
        <path d={`M ${88 * Math.cos((rot * Math.PI) / 180)} ${88 * Math.sin((rot * Math.PI) / 180)} A 88 88 0 0 1 ${88 * Math.cos(((rot + 70) * Math.PI) / 180)} ${88 * Math.sin(((rot + 70) * Math.PI) / 180)}`} fill="none" stroke={C.red} strokeWidth="5" strokeLinecap="round" />
        <g transform="translate(70,70) scale(.55)"><Cloud color={C.cyan} /></g>
      </>)}
    </svg>
  );
};

/* 国潮祥云 motif (original simple path) */
const Cloud: React.FC<{color: string}> = ({color}) => (
  <path d="M-40,10 C-60,10 -60,-14 -40,-14 C-38,-34 -10,-36 -4,-18 C4,-34 34,-30 30,-10 C48,-12 52,10 34,10 Z M-22,10 C-24,0 -12,-6 -6,2 M6,10 C6,-2 20,-4 22,4" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
);

/* 回纹 border strip */
const Huiwen: React.FC<{w: number; color: string}> = ({w, color}) => {
  const n = Math.floor(w / 28);
  return (<svg width={w} height={22} style={{display: 'block'}}>{Array.from({length: n}).map((_, i) => <path key={i} d={`M${i * 28 + 2},20 V4 H${i * 28 + 22} V16 H${i * 28 + 8} V9 H${i * 28 + 16}`} fill="none" stroke={color} strokeWidth="2.2" />)}</svg>);
};

/* ---------- stage chrome around a rect ---------- */
const Chrome: React.FC<{v: Variant; r: Rect; f: number; o: number; full: boolean}> = ({v, r, f, o, full}) => {
  if (o <= 0.001) return null;
  const L = 64;
  const common: React.CSSProperties = {position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, opacity: o, pointerEvents: 'none'};
  if (v === 'A') {
    const corner = (rot: number, x: number, y: number) => (
      <svg key={rot} width={L + 20} height={L + 20} style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, overflow: 'visible'}}>
        <path d={`M4,${L} V4 H${L}`} fill="none" stroke="url(#brassA)" strokeWidth="5" />
        <circle cx="4" cy="4" r="6" fill={C.brass} stroke="#6B5530" strokeWidth="1.5" /><circle cx="4" cy="4" r="1.8" fill="#6B5530" />
        <defs><linearGradient id="brassA"><stop offset="0" stopColor="#F1D9A0" /><stop offset="1" stopColor={C.brass} /></linearGradient></defs>
      </svg>);
    const inset = full ? 36 : -10;
    return (<div style={common}>
      <div style={{position: 'absolute', inset, border: `1.5px solid rgba(190,160,108,${full ? 0.55 : 0.9})`, boxShadow: full ? undefined : '0 0 0 6px rgba(32,60,58,.9), 0 0 0 7.5px rgba(190,160,108,.6), 0 30px 60px rgba(0,0,0,.45)'}} />
      {corner(0, inset - 4, inset - 4)}{corner(90, r.w - inset - L - 16, inset - 4)}{corner(270, inset - 4, r.h - inset - L - 16)}{corner(180, r.w - inset - L - 16, r.h - inset - L - 16)}
      <div style={{position: 'absolute', left: inset + 18, top: inset + 14, fontFamily: FONT_SANS, fontSize: 22, letterSpacing: 4, color: C.brass}}>OBS-001 · 会员卡后的购物车</div>
      <div style={{position: 'absolute', right: inset + 18, top: inset + 14, fontFamily: 'monospace', fontSize: 22, color: C.brass}}>{`T+${(f / 30).toFixed(2)}s`}</div>
    </div>);
  }
  if (v === 'B') {
    const inset = full ? 30 : -16;
    return (<div style={common}>
      <div style={{position: 'absolute', inset, border: `${full ? 10 : 18}px solid #FFFDF6`, filter: 'url(#deckle)', boxShadow: '0 14px 0 rgba(80,52,24,.22)'}} />
      {/* tape */}
      <div style={{position: 'absolute', left: inset + 40, top: inset - 18, width: 150, height: 44, background: 'rgba(213,138,71,.55)', transform: 'rotate(-6deg)', filter: 'url(#deckle)'}} />
      <div style={{position: 'absolute', right: inset + 40, bottom: inset - 18, width: 130, height: 44, background: 'rgba(110,157,163,.55)', transform: 'rotate(4deg)', filter: 'url(#deckle)'}} />
      {/* folder tab */}
      
    </div>);
  }
  const inset = full ? 40 : -8;
  return (<div style={common}>
    <div style={{position: 'absolute', inset, border: `1.5px solid ${full ? 'rgba(241,228,204,.9)' : C.ink}`}} />
    {!full && <div style={{position: 'absolute', left: inset, top: inset - 30}}><Huiwen w={r.w + 16} color={C.red} /></div>}
    <div style={{position: 'absolute', left: inset + 20, bottom: inset + 18, fontFamily: FONT_SERIF, fontSize: 24, letterSpacing: 6, color: full ? C.cream : C.ink}}>观 · 会员卡后的购物车</div>
    <div style={{position: 'absolute', right: inset + 14, top: inset + 10, transform: 'scale(.7)', transformOrigin: 'right top'}}><svg width="140" height="70" viewBox="-70 -40 140 70"><Cloud color={full ? C.cream : C.cyan} /></svg></div>
  </div>);
};

/* ---------- 朱红观察印记 (not an official seal: rounded, irregular, “观察记录”) ---------- */
const Seal: React.FC<{v: Variant; f: number; x: number; y: number; text: string}> = ({v, f, x, y, text}) => {
  if (f < 0) return null;
  const s = v === 'B' ? (f < 4 ? 1.6 : 1) : interpolate(f, [0, 5, 9], [1.8, 0.94, 1], clamp);
  const o = interpolate(f, [0, 3], [0, 1], clamp);
  return (<div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(-8deg) scale(${s})`, opacity: o}}>
    <div style={{padding: '14px 22px', border: `5px solid ${C.red}`, borderRadius: 26, color: C.red, fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 52, lineHeight: 1.05, textAlign: 'center', filter: 'url(#inkbleed)', background: v === 'A' ? 'rgba(241,228,204,.92)' : 'rgba(255,253,246,.6)'}}>
      <div style={{fontSize: 20, letterSpacing: 8, fontWeight: 700}}>观察记录</div>{text}</div>
  </div>);
};

/* ---------- small compat examples ---------- */
const StickerMG: React.FC<{f: number}> = ({f}) => {
  const b = spring({frame: f, fps: 30, config: {damping: 9, stiffness: 180}});
  return (<AbsoluteFill style={{background: '#F6D9A8', alignItems: 'center', justifyContent: 'center'}}>
    <svg width="190" height="170" viewBox="0 0 190 170" style={{transform: `scale(${b}) rotate(${-4 + 4 * b}deg)`, filter: 'drop-shadow(0 8px 0 rgba(0,0,0,.18))'}}>
      <g stroke="#fff" strokeWidth="14" strokeLinejoin="round" fill="none"><path d="M20,40 H45 L65,120 H150 L168,62 H55" /><circle cx="78" cy="145" r="10" /><circle cx="140" cy="145" r="10" /><rect x="70" y="20" width="60" height="44" /></g>
      <g stroke={C.ink} strokeWidth="6" strokeLinejoin="round" fill="none"><path d="M20,40 H45 L65,120 H150 L168,62 H55" /><circle cx="78" cy="145" r="10" fill={C.ink} /><circle cx="140" cy="145" r="10" fill={C.ink} /><rect x="70" y="20" width="60" height="44" fill={C.amber} /></g>
    </svg>
    <div style={{position: 'absolute', right: 18, top: 26, background: C.red, color: '#fff', fontFamily: FONT_SANS, fontWeight: 900, fontSize: 30, padding: '4px 12px', borderRadius: 10, border: '4px solid #fff', transform: `scale(${spring({frame: f - 8, fps: 30, config: {damping: 8}})}) rotate(8deg)`}}>+3件</div>
  </AbsoluteFill>);
};
const Collage: React.FC<{f: number}> = ({f}) => {
  const lines = ['大包装  ×1', '凑满减  ×1', '再逛逛  ×1', '合计 ¥1036'];
  return (<AbsoluteFill style={{background: `radial-gradient(${C.ink}33 1.4px, transparent 1.6px) 0 0/9px 9px, #E4D3B2`}}>
    <div style={{position: 'absolute', left: -20, top: 30, width: 170, height: 200, overflow: 'hidden', transform: 'rotate(-7deg)', border: '6px solid #fff', boxShadow: '3px 5px 0 rgba(0,0,0,.2)'}}>
      <Img src={staticFile('g1/sh02.png')} style={{width: 340, marginLeft: -150, marginTop: -40, filter: 'grayscale(1) contrast(1.3) sepia(.3)'}} /></div>
    <div style={{position: 'absolute', right: 14, top: 40 - Math.max(0, 20 - f) * 3, width: 140, padding: '10px 10px 18px', background: '#FFFDF6', fontFamily: '"Noto Sans Mono CJK SC",monospace', fontSize: 15, color: '#333', transform: 'rotate(5deg)', boxShadow: '2px 4px 0 rgba(0,0,0,.2)', clipPath: 'polygon(0 0,100% 0,100% 94%,90% 100%,80% 94%,70% 100%,60% 94%,50% 100%,40% 94%,30% 100%,20% 94%,10% 100%,0 94%)'}}>
      <div style={{fontWeight: 900, borderBottom: '1px dashed #999', marginBottom: 4}}>小票 RECEIPT</div>
      {lines.map((l, i) => <div key={i} style={{opacity: f > 6 + i * 5 ? 1 : 0, color: i === 3 ? C.red : '#333', fontWeight: i === 3 ? 900 : 400}}>{l}</div>)}
    </div>
    <div style={{position: 'absolute', left: 60, top: 18, width: 90, height: 26, background: 'rgba(241,228,204,.8)', transform: 'rotate(-20deg)'}} />
  </AbsoluteFill>);
};
/* pixel world: 72x128 grid, crisp edges (code-drawn, 16-bit inspired) */
const PixelWorld: React.FC<{f: number; big?: boolean}> = ({f, big}) => {
  const W2 = 72, H2 = 128;
  const px: React.ReactNode[] = [];
  let k = 0;
  const R = (x: number, y: number, w: number, h: number, c: string) => px.push(<rect key={k++} x={x} y={y} width={w} height={h} fill={c} />);
  // wall bands
  ['#1B3532', '#203C3A', '#264541', '#2C4D48'].forEach((c, i) => R(0, i * 18, W2, 18, c));
  for (let y = 0; y < 72; y += 2) for (let x = (y / 2) % 2; x < W2; x += 4) if ((x * 7 + y * 3) % 11 === 0) R(x, y, 1, 1, '#355955');
  // sign
  R(20, 8, 32, 9, C.red); R(21, 9, 30, 7, '#C95A4A'); R(20, 17, 32, 1, '#7A2C24');
  // lamps
  [12, 36, 60].forEach((x) => { R(x, 0, 1, 22, '#0E1E1D'); R(x - 3, 22, 7, 2, C.brass); R(x - 2, 24, 5, 1, '#FFE6A8'); R(x - 6, 25, 13, 6, 'rgba(255,220,150,.10)'); });
  // shelves (3 units)
  const cols = [C.amber, C.red, C.cyan, C.cream, '#7FA35B', '#E2B65A'];
  [[2, 30], [50, 30]].forEach(([sx, sy], u) => { R(sx, sy, 20, 44, '#6B4E2E'); R(sx + 1, sy + 1, 18, 42, '#3A2A1A');
    for (let r = 0; r < 4; r++) { R(sx + 1, sy + 10 + r * 11, 18, 1, '#8C6A3E'); for (let j = 0; j < 4; j++) { const h = 4 + ((j + r + u) % 3); R(sx + 2 + j * 4.4, sy + 10 + r * 11 - h, 3, h, cols[(r * 3 + j + u) % 6]); R(sx + 2 + j * 4.4, sy + 10 + r * 11 - h, 3, 1, 'rgba(255,255,255,.35)'); } } });
  // floor
  const fy = 84; R(0, fy, W2, H2 - fy, '#5B4630');
  for (let y = fy; y < H2; y += 4) for (let x = ((y - fy) / 4) % 2 ? 4 : 0; x < W2; x += 8) R(x, y, 4, 4, '#6A5238');
  R(0, fy, W2, 1, '#2A1E12');
  // customer (generic pixel shopper)
  const lx = 10, ly = fy - 17, bob = Math.floor(f / 6) % 2;
  R(lx + 1, ly + bob, 5, 3, '#1E1E1E'); R(lx + 1, ly + 3 + bob, 5, 3, '#F0C9A0'); R(lx + 2, ly + 4 + bob, 1, 1, '#222'); R(lx + 4, ly + 4 + bob, 1, 1, '#222');
  R(lx, ly + 6, 7, 6, C.ink); R(lx + 3, ly + 6, 1, 6, C.cream); R(lx + 1, ly + 12, 2, 5, '#4A4038'); R(lx + 4, ly + 12, 2, 5, '#4A4038'); R(lx + 7, ly + 8, 4, 1, '#F0C9A0');
  // cart + growing stack
  const cx = 26, base = fy - 4;
  R(cx - 6, base - 12, 6, 1, '#C9B48A'); R(cx, base - 10, 24, 1, '#E6D5A8'); R(cx, base - 10, 1, 8, '#C9B48A'); R(cx + 23, base - 10, 1, 8, '#C9B48A'); R(cx, base - 3, 24, 1, '#C9B48A');
  for (let x = cx + 3; x < cx + 23; x += 3) R(x, base - 10, 1, 7, 'rgba(201,180,138,.6)');
  R(cx + 3, base - 2, 3, 3, '#111'); R(cx + 18, base - 2, 3, 3, '#111');
  const max = big ? 30 : 12; const n = Math.min(max, Math.floor(f / (big ? 1.4 : 3)));
  for (let i = 0; i < n; i++) { const row = Math.floor(i / 4), col = i % 4; const drop = i === n - 1 ? Math.max(0, 3 - ((f * 2) % 3)) : 0;
    const x = cx + 1 + col * 5.5 + (row % 2 ? 1 : 0), y = base - 15 - row * 5 - drop; R(x, y, 5, 5, cols[(i * 7) % 6]); R(x, y, 5, 1, 'rgba(255,255,255,.4)'); R(x + 4, y, 1, 5, 'rgba(0,0,0,.2)'); }
  // HUD
  const money = Math.round(800 + (n / max) * 236);
  R(2, 88, 68, 16, 'rgba(10,22,21,.85)'); R(2, 88, 68, 1, C.brass);
  R(6, 98, 60, 3, '#0B1C1B'); R(6, 98, Math.round(60 * 800 / 1036), 3, C.cyan); R(6 + Math.round(60 * 800 / 1036), 98, Math.round(60 * (money - 800) / 1036), 3, C.red);
  return (<svg width="100%" height="100%" viewBox={big ? `0 0 ${W2} ${H2}` : `14 40 46 56`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" style={{position: 'absolute', inset: 0, imageRendering: 'pixelated'}}>
    {px}
    <text x="36" y="15.5" textAnchor="middle" fontFamily='"Noto Sans Mono CJK SC",monospace' fontSize="6" fontWeight="900" fill={C.cream}>会员价</text>
    <text x="6" y="95" fontFamily="monospace" fontSize="6" fontWeight="900" fill={C.cream}>{`¥${money}`}</text>
    <text x="66" y="95" textAnchor="end" fontFamily="monospace" fontSize="5" fill={money > 800 ? '#FF8A7A' : C.cream}>{`+${money - 800}`}</text>
  </svg>);
};

/* ---------- caption ---------- */
const Cap: React.FC<{v: Variant; text: React.ReactNode; o: number; y?: number}> = ({v, text, o, y = 1390}) => (
  <div style={{position: 'absolute', left: 90, right: 150, top: y, opacity: o, textAlign: 'center', fontFamily: FONT_SANS, fontWeight: 900, fontSize: 60, lineHeight: 1.2, color: '#fff', textShadow: v === 'B' ? '0 5px 0 rgba(60,40,20,.55), 0 0 2px #000' : '0 3px 12px rgba(0,0,0,.65), 0 0 2px #000'}}>{text}</div>
);
const K: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{color: '#FFD27A'}}>{children}</span>;

/* ---------- main ---------- */
export const G1Stage: React.FC<{v: Variant}> = ({v}) => {
  const raw = useCurrentFrame();
  const th = theme[v];
  const f = th.stepped ? Math.floor(raw / 2) * 2 : raw; // B: animate on twos (stop-motion)
  // stage rect for the main scene
  const toS2 = iv(f, T.s2, T.s2 + 14);
  const backFull = iv(f, T.back, T.back + 12);
  const sceneR = f < T.back ? lerpR(FULL, MAIN, toS2) : FULL;
  const chromeO = f < T.s1 ? 0 : iv(f, T.s1, T.s1 + 8);
  const sceneFull = toS2 < 0.02 || f >= T.back;
  // S3: pixel mini window expands to full
  const exp = iv(f, T.s3, T.s3 + 14) * (1 - iv(f, T.back - 6, T.back + 6));
  const miniO = (i: number) => iv(f, T.s2 + 14 + i * 5, T.s2 + 22 + i * 5);
  const pixR = lerpR(MINI(2), FULL, exp);
  const s2Visible = f >= T.s2 && f < T.back;
  const panelBg = v === 'A' ? `radial-gradient(ellipse at 50% 30%, #2B4E4B 0%, ${C.ink} 55%, #102422 100%)` : v === 'B' ? `#E9DABD` : th.bg;
  // data bar
  const cnt = Math.round(interpolate(f, [T.s2 + 16, T.s2 + 40], [800, 1036], clamp));
  const barO = iv(f, T.s2 + 10, T.s2 + 18);
  const scanY = iv(f, T.s1, T.s1 + 22, -0.1, 1.1, Easing.inOut(Easing.quad));
  return (
    <AbsoluteFill style={{background: panelBg, overflow: 'hidden'}}>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id="deckle"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="7" /></filter>
        <filter id="inkbleed"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="4" /></filter>
      </svg>
      {/* background textures for S2 */}
      {v === 'A' && <AbsoluteFill style={{opacity: toS2 * 0.5, backgroundImage: `linear-gradient(rgba(190,160,108,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(190,160,108,.12) 1px, transparent 1px)`, backgroundSize: '54px 54px'}} />}
      {v === 'B' && <AbsoluteFill style={{opacity: toS2, background: 'radial-gradient(ellipse at 50% 20%, #F3E7CF, #DCC8A3)'}}>
        <div style={{position: 'absolute', left: -60, top: 1080, width: 1300, height: 900, background: C.cyan, opacity: .5, transform: 'rotate(-4deg)', filter: 'url(#deckle)', boxShadow: '0 -10px 0 rgba(255,255,255,.7)'}} />
        <div style={{position: 'absolute', left: -60, top: 1140, width: 1300, height: 900, background: '#C9D5C4', transform: 'rotate(2deg)', filter: 'url(#deckle)', boxShadow: '0 -10px 0 #fff, 0 -24px 30px rgba(60,40,20,.2)'}} /></AbsoluteFill>}
      {v === 'C' && <AbsoluteFill style={{opacity: toS2}}>
        <svg width={W} height={H} style={{position: 'absolute'}}><circle cx="930" cy="190" r="120" fill={C.red} opacity=".9" /><g transform="translate(120,1180) scale(3)" opacity=".25"><Cloud color={C.cyan} /></g><g transform="translate(980,1100) scale(2)" opacity=".2"><Cloud color={C.ink} /></g></svg></AbsoluteFill>}

      {/* title in S2 */}
      {s2Visible && <div style={{position: 'absolute', left: 90, top: 120 + (1 - toS2) * -40, opacity: toS2, fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 54, color: th.text, letterSpacing: 2}}>
        {v === 'C' ? <span>办卡之后，<span style={{color: C.red}}>购物车</span>变大了</span> : <span>办卡之后，购物车<span style={{color: th.accent}}>变大</span>了</span>}
        <div style={{fontFamily: FONT_SANS, fontWeight: 500, fontSize: 24, letterSpacing: 6, marginTop: 4, color: v === 'A' ? C.brass : C.ink, opacity: .75}}>{th.title} · S2 展示状态</div></div>}

      {/* L1 scene */}
      <Scene f={f} r={sceneR} />
      {v === 'B' && !sceneFull && <div style={{position: 'absolute', left: sceneR.x, top: sceneR.y, width: sceneR.w, height: sceneR.h, boxShadow: '0 22px 0 rgba(80,52,24,.25)', pointerEvents: 'none'}} />}
      <Chrome v={v} r={f >= T.back ? FULL : sceneR} f={f} o={chromeO * (f >= T.s3 && f < T.back ? 1 - exp : 1)} full={sceneFull} />

      {/* S1 scan line */}
      {f >= T.s1 && f < T.s2 && <div style={{position: 'absolute', left: 0, right: 0, top: scanY * H, height: v === 'B' ? 10 : 3, background: v === 'A' ? `linear-gradient(90deg, transparent, ${C.brass}, transparent)` : v === 'B' ? '#fff' : C.red, boxShadow: v === 'A' ? `0 0 24px ${C.brass}` : undefined, opacity: .85, filter: v === 'B' ? 'url(#deckle)' : undefined}} />}

      {/* observer ring: S1 locks on cart; S2 small in data card; end locks again */}
      {f >= T.s1 && f < T.s2 + 4 && <Ring v={v} f={f} size={360} x={iv(f, T.s1, T.s1 + 18, 300, 720)} y={iv(f, T.s1, T.s1 + 18, 1500, 760)} o={iv(f, T.s1, T.s1 + 6) * (1 - iv(f, T.s2, T.s2 + 4))} />}
      {f >= T.back + 4 && <Ring v={v} f={f} size={300} x={720} y={iv(f, T.back + 4, T.back + 16, 1700, 720)} o={iv(f, T.back + 4, T.back + 10)} />}

      {/* S2 data card */}
      {s2Visible && <div style={{position: 'absolute', left: 84, top: 1040, width: 912, height: 158, opacity: barO * (1 - exp), transform: `translateY(${(1 - barO) * 30}px)`,
        background: v === 'A' ? 'rgba(16,36,34,.85)' : v === 'B' ? '#FFFDF6' : '#FFFFFF', border: v === 'A' ? `1.5px solid ${C.brass}` : v === 'C' ? `1.5px solid ${C.ink}` : 'none', boxShadow: v === 'B' ? '0 10px 0 rgba(80,52,24,.22)' : undefined, borderRadius: v === 'B' ? 6 : 0, filter: v === 'B' ? 'url(#deckle)' : undefined}}>
        <div style={{position: 'absolute', left: 30, top: 22, fontFamily: FONT_SANS, fontSize: 26, color: v === 'A' ? C.brass : C.ink}}>每月支出</div>
        <div style={{position: 'absolute', left: 30, top: 62, fontFamily: FONT_SANS, fontWeight: 900, fontSize: 64, color: v === 'A' ? C.cream : C.ink}}>¥{cnt}</div>
        <div style={{position: 'absolute', left: 260, top: 80, width: 420, height: 34, background: v === 'A' ? '#0B1C1B' : '#EADFCB'}}>
          <div style={{width: `${(800 / 1036) * 100}%`, height: '100%', background: C.cyan}} />
          <div style={{position: 'absolute', left: `${(800 / 1036) * 100}%`, top: 0, height: '100%', width: `${((cnt - 800) / 1036) * 100}%`, background: C.red}} /></div>
        <div style={{position: 'absolute', left: 260, top: 40, fontFamily: FONT_SANS, fontSize: 22, color: v === 'A' ? C.brass : C.ink, opacity: .8}}>上月 ¥800 → 本月</div>
        <div style={{position: 'absolute', right: 30, top: 50, fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 70, color: C.red}}>+{cnt - 800}</div>
      </div>}

      {/* S2 mini windows: sticker MG / retro collage / pixel */}
      {s2Visible && [0, 1, 2].map((i) => {
        const r = i === 2 ? pixR : MINI(i);
        const o = miniO(i) * (i === 2 ? 1 : 1 - exp);
        const lf = f - (T.s2 + 14 + i * 5);
        const label = ['贴纸 MG', '复古拼贴', '像素沙盘'][i];
        const isBig = i === 2 && exp > 0.02;
        return (<div key={i} style={{position: 'absolute', left: r.x, top: r.y + (1 - o) * 40, width: r.w, height: r.h, opacity: o, overflow: 'hidden',
          border: isBig ? undefined : v === 'A' ? `1.5px solid ${C.brass}` : v === 'B' ? '8px solid #FFFDF6' : `1.5px solid ${C.ink}`, boxShadow: v === 'B' ? '0 10px 0 rgba(80,52,24,.22)' : v === 'A' ? '0 16px 30px rgba(0,0,0,.4)' : undefined,
          transform: v === 'B' && !isBig ? `rotate(${[-2, 1.5, -1][i]}deg)` : undefined, borderRadius: v === 'C' && !isBig ? 18 : 0}}>
          {i === 0 && <StickerMG f={lf} />}{i === 1 && <Collage f={lf} />}{i === 2 && <PixelWorld f={exp > 0.02 ? f - T.s3 : lf} big={isBig} />}
          {!isBig && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '6px 0', textAlign: 'center', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 24, color: v === 'A' ? C.cream : '#fff', background: v === 'A' ? 'rgba(16,36,34,.85)' : v === 'B' ? C.ink : C.red}}>{label}</div>}
        </div>);
      })}

      {/* S3 overlay caption + chrome break-out */}
      {f >= T.s3 && f < T.back && <>
        <Chrome v={v} r={FULL} f={f} o={exp} full />
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: iv(f, T.s3 + 10, T.s3 + 16) * (1 - iv(f, T.back - 6, T.back)), fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 64, color: C.cream, textShadow: '0 6px 0 rgba(0,0,0,.35)'}}>进入沙盘：一个月<br /><span style={{color: '#FFD27A'}}>多花 ¥236</span></div>
        <div style={{position: 'absolute', left: 90, top: 140, fontFamily: FONT_SANS, fontSize: 24, letterSpacing: 6, color: C.cream, opacity: exp * .8}}>S3 穿越状态 · 规则推演层</div>
      </>}

      {/* captions */}
      {f < T.s2 && <Cap v={v} o={iv(f, 4, 10)} text={f < T.s1 ? <>办了会员卡之后……</> : <>购物车一节一节<K>变高</K>了</>} />}
      {f >= T.back && <Cap v={v} o={iv(f, T.back + 6, T.back + 12)} text={<>省的是<K>单价</K>，多的是<K>总支出</K></>} />}

      {/* seal */}
      <Seal v={v} f={f - (T.back + 14)} x={300} y={300} text="多花¥236" />
      {f >= T.s2 + 44 && f < T.s3 && <Seal v={v} f={f - (T.s2 + 44)} x={850} y={1010} text="+236" />}

      {/* stage-state label for reviewers */}
      <div style={{position: 'absolute', right: 24, top: 40, fontFamily: 'monospace', fontSize: 20, color: v === 'A' || sceneFull ? 'rgba(241,228,204,.7)' : 'rgba(32,60,58,.6)'}}>{f < T.s1 ? 'S0' : f < T.s2 ? 'S1' : f < T.s3 ? 'S2' : f < T.back ? 'S3' : 'S1'}</div>
    </AbsoluteFill>
  );
};
