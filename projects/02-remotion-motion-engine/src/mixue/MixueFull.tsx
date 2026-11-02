import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, spring} from 'remotion';
import {PAL, SERIF, SANS, iv, PaperFrame} from '../g2/ObservationStage';
import {GRID} from '../g6/Kit';
import {BrandMark} from '../g6/BrandMark';
import {Big} from '../g6/G6Sample';
import {PoseCharacter, PoseSet} from '../g6/PoseCharacter';
import xlP from '../g6/poses/xl.json';
import vo from './data/vo_full.json';
import owP from './owner.json';
const XL = xlP as unknown as PoseSet; const XH = 880;
type Seg = {text: string; start: number; end: number};
type Ln = {shot: string; text: string; start: number; sec: number; segs: Seg[]};
const L = (vo as any).lines as Ln[];
export const FPS = 30;
export const MX_FRAMES = Math.ceil((vo as any).totalSec * FPS) + 24;
const F = (s: number) => Math.round(s * FPS);
const PUNCT = /[，。；：！？、,]/;
// 字级定位：第 i 句里词 w 开始的绝对秒
const kw = (i: number, w: string, n = 0) => { const l = L[i]; const tx = l.segs.map((s) => s.text).join(''); let p = -1; for (let k = 0; k <= n; k++) p = tx.indexOf(w, p + 1); if (p < 0) throw new Error(`kw ${i} ${w}`);
  let c = 0; for (const sg of l.segs) { if (c + sg.text.length > p) return l.start + sg.start; c += sg.text.length; } return l.start; };
const kf = (i: number, w: string, n = 0) => F(kw(i, w, n));
// 字幕显示替换（口播读中文数字，字幕显示阿拉伯数字）
const DISP: [string, string][] = [['三百三十五亿', '335亿'], ['百分之九十七点六', '97.6%'], ['百分之二点四', '2.4%'], ['两千五百多', '2500多'], ['一万四千多', '1.4万多'], ['五万九千多', '5.9万多'], ['两万七千多', '2.7万多'], ['五十九亿', '59亿'], ['十万', '10万']];
const KEY = ['总部', '隔壁', '年报', '335亿', '97.6%', '2.4%', '设备', '卖铲子', '2500多', '1.4万多', '5.9万多', '2.7万多', '59亿', '10万', '门店', '总部', '加盟商', '卖货给我'];
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
  return <div style={{position: 'absolute', left: GRID.L, width: GRID.W, top: GRID.capY, textAlign: 'center', opacity: inn, fontFamily: SANS, fontWeight: 900, fontSize: 56, lineHeight: 1.25}}>
    {tk.slice(cur[0], cur[1]).map((x, k) => { const id = cur[0] + k; const said = t >= x.start; const p = Math.min(1, Math.max(0, (t - x.start) / Math.max(0.06, x.end - x.start))); const hk = mask[off[id]];
      return <span key={k} style={{position: 'relative', display: 'inline-block', color: hk && said ? PAL.vermilion : PAL.ink, opacity: said ? 1 : 0.38, transform: `translateY(${said ? -6 * (1 - p) : 0}px)`, WebkitTextStroke: '8px #FFFDF6', paintOrder: 'stroke fill'}}>
        {hk && <span style={{position: 'absolute', left: -2, right: -2, bottom: 6, height: 16, background: PAL.copper, opacity: .3, transformOrigin: 'left', transform: `scaleX(${p})`}} />}<span style={{position: 'relative'}}>{x.text}</span></span>; })}
  </div>;
};

// —— 美术部件（代码绘制，v1 占位；正式素材见 MIXUE_ASSET_LIST.md） ——
const sticker = 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 12px 10px rgba(40,25,10,.3))';
const PaperBg: React.FC<{tone?: string}> = ({tone}) => <AbsoluteFill style={{background: tone ?? 'radial-gradient(ellipse at 50% 28%, #F8F0E1 0%, #EEDFC4 62%, #E3CFAE 100%)'}}>
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .15  0 0 0 .07 0" /></filter>
    <rect width="1080" height="1920" filter="url(#gr)" />
    <circle cx="960" cy="330" r="260" fill="none" stroke={PAL.brass} strokeOpacity=".18" strokeWidth="2" />
    <circle cx="960" cy="330" r="200" fill="none" stroke={PAL.brass} strokeOpacity=".12" strokeWidth="1.5" strokeDasharray="4 10" />
    <circle cx="90" cy="1380" r="180" fill={PAL.teal} fillOpacity=".06" />
    {[[150, 190], [930, 1300], [70, 760]].map(([x, y], k) => <path key={k} d={`M${x},${y - 12} L${x + 8},${y} L${x},${y + 12} L${x - 8},${y}Z`} fill={PAL.copper} fillOpacity=".35" />)}
  </svg></AbsoluteFill>;
const Ground: React.FC = () => <AbsoluteFill style={{top: 1440}}>
  <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(110,157,163,.10) 0%, rgba(32,60,58,.16) 100%)'}} />
  <div style={{position: 'absolute', left: 84, right: 84, top: 0, height: 2, background: PAL.ink, opacity: .18}} /></AbsoluteFill>;
const Shop: React.FC<{x: number; y: number; w?: number; c?: string; label?: string; p?: number; closed?: boolean}> = ({x, y, w = 300, c = '#C9483C', label = '奶茶', p = 1, closed}) => {
  const s = spring({frame: p * 30, fps: 30, config: {damping: 10, stiffness: 200}}); const h = w * 1.05;
  return <svg width={w} height={h} viewBox="0 0 300 315" style={{position: 'absolute', left: x, top: y - h, transform: `scale(${s})`, transformOrigin: 'bottom center', filter: closed ? 'grayscale(1) brightness(.85)' : undefined}}>
    <rect x="10" y="40" width="280" height="270" fill="#FBF4E4" stroke={PAL.ink} strokeWidth="6" />
    <rect x="0" y="20" width="300" height="70" rx="6" fill={c} stroke={PAL.ink} strokeWidth="6" />
    <text x="150" y="70" textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize="40" fill="#FFFDF6">{label}</text>
    {[0, 1, 2, 3, 4, 5].map((k) => <path key={k} d={`M${k * 50},90 h50 l-8,34 h-34z`} fill={k % 2 ? '#FFFDF6' : c} stroke={PAL.ink} strokeWidth="4" />)}
    <rect x="30" y="150" width="140" height="110" fill="#BFD6D4" stroke={PAL.ink} strokeWidth="5" />
    <rect x="190" y="150" width="80" height="160" fill={PAL.ink} opacity=".85" />
    {closed && <g transform="rotate(-8 150 200)"><rect x="40" y="170" width="220" height="70" fill="#FFFDF6" stroke={PAL.vermilion} strokeWidth="6" /><text x="150" y="220" textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize="40" fill={PAL.vermilion}>暂停营业</text></g>}
  </svg>;
};
const SnowKing: React.FC<{x: number; y: number; s?: number; f: number; sing?: boolean}> = ({x, y, s = 1, f, sing}) => {
  const bob = Math.sin(f / 5) * (sing ? 6 : 2);
  return <svg width={340 * s} height={420 * s} viewBox="0 0 340 420" style={{position: 'absolute', left: x - 170 * s, top: y - 420 * s + bob, filter: sticker}}>
    <ellipse cx="170" cy="300" rx="130" ry="115" fill="#FFFFFF" stroke={PAL.ink} strokeWidth="7" />
    <circle cx="170" cy="150" r="95" fill="#FFFFFF" stroke={PAL.ink} strokeWidth="7" />
    <path d="M100 75 L120 25 L150 60 L170 15 L190 60 L220 25 L240 75 Z" fill="#E7B53C" stroke={PAL.ink} strokeWidth="6" />
    <circle cx="140" cy="140" r="9" fill={PAL.ink} /><circle cx="200" cy="140" r="9" fill={PAL.ink} />
    {sing ? <ellipse cx="170" cy="185" rx="20" ry={14 + 6 * Math.abs(Math.sin(f / 3))} fill={PAL.vermilion} stroke={PAL.ink} strokeWidth="5" /> : <path d="M145 180 Q170 200 195 180" stroke={PAL.ink} strokeWidth="6" fill="none" strokeLinecap="round" />}
    <circle cx="118" cy="168" r="12" fill="#F4A7A0" opacity=".7" /><circle cx="222" cy="168" r="12" fill="#F4A7A0" opacity=".7" />
    <path d="M40 260 Q10 230 30 200" stroke={PAL.ink} strokeWidth="8" fill="none" strokeLinecap="round" />
    <path d="M300 260 Q335 230 312 196" stroke={PAL.ink} strokeWidth="8" fill="none" strokeLinecap="round" />
  </svg>;
};
const Box: React.FC<{x: number; y: number; s?: number; label?: string; rot?: number}> = ({x, y, s = 1, label = '原料', rot = 0}) => <div style={{position: 'absolute', left: x, top: y, width: 150 * s, height: 120 * s, transform: `rotate(${rot}deg)`, background: '#D9A86C', border: `${5 * s}px solid ${PAL.ink}`, borderRadius: 6 * s, boxShadow: `inset 0 ${-14 * s}px 0 rgba(0,0,0,.12)`, fontFamily: SERIF, fontWeight: 900, fontSize: 34 * s, color: PAL.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
  <div style={{position: 'absolute', left: '44%', top: 0, width: '12%', height: '100%', background: '#EBD3A8', opacity: .8}} /><span style={{position: 'relative'}}>{label}</span></div>;
const Shovel: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => <svg width={160 * s} height={420 * s} viewBox="0 0 160 420" style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, filter: sticker}}>
  <rect x="70" y="10" width="20" height="250" rx="8" fill="#B07A45" stroke={PAL.ink} strokeWidth="5" /><rect x="45" y="0" width="70" height="26" rx="10" fill="#B07A45" stroke={PAL.ink} strokeWidth="5" />
  <path d="M30 250 H130 V330 Q80 420 30 330 Z" fill="#9FB3B6" stroke={PAL.ink} strokeWidth="6" /></svg>;
const Bubble: React.FC<{f: number; at: number; x?: number; y?: number; w?: number; tag: string; children: React.ReactNode}> = ({f, at, x = 120, y = 300, w = 840, tag, children}) => {
  if (f < at) return null; const s = spring({frame: f - at, fps: 30, config: {damping: 12, stiffness: 200}});
  return <div style={{position: 'absolute', left: x, top: y, width: w, padding: '26px 36px 30px', background: '#FFFDF6', borderRadius: 26, boxShadow: `0 0 0 4px ${PAL.ink}, 0 14px 20px rgba(0,0,0,.22)`, transform: `scale(${interpolate(s, [0, 1], [.6, 1])})`, transformOrigin: '20% 100%', opacity: Math.min(1, s * 2)}}>
    <div style={{fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .6, marginBottom: 10}}>💬 {tag}</div>
    <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 46, lineHeight: 1.35, color: PAL.ink}}>{children}</div>
    <div style={{position: 'absolute', left: 90, bottom: -34, width: 0, height: 0, borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderTop: `36px solid ${PAL.ink}`}} /></div>;
};
const Stamp: React.FC<{f: number; at: number; x: number; y: number; text: string; rot?: number; size?: number}> = ({f, at, x, y, text, rot = -10, size = 54}) => {
  if (f < at) return null; const k = iv(f, at, at + 5);
  return <div style={{position: 'absolute', left: x, top: y, padding: '8px 22px', border: `6px solid ${PAL.vermilion}`, borderRadius: 10, color: PAL.vermilion, fontFamily: SERIF, fontWeight: 900, fontSize: size, transform: `rotate(${rot}deg) scale(${1.8 - 0.8 * k})`, opacity: k * .92, mixBlendMode: 'multiply', whiteSpace: 'nowrap'}}>{text}</div>;
};
const Win: React.FC<{children?: React.ReactNode; title?: React.ReactNode; sub?: string; o?: number}> = ({children, title, sub, o = 1}) => <div style={{opacity: o}}>
  <div style={{position: 'absolute', left: GRID.win.x, top: GRID.win.y, width: GRID.win.w, height: GRID.win.h, background: '#FBF4E4', overflow: 'hidden'}}>
    {title && <div style={{position: 'absolute', left: 60, top: 60, fontFamily: SERIF, fontWeight: 900, fontSize: 62, color: PAL.ink}}>{title}</div>}
    {sub && <div style={{position: 'absolute', left: 64, top: 146, fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .6}}>{sub}</div>}
    {children}</div><PaperFrame r={GRID.win} /></div>;
const Src: React.FC<{t: string; y?: number}> = ({t, y = 1170}) => <div style={{position: 'absolute', left: 120, width: 840, top: y, textAlign: 'right', fontFamily: SANS, fontSize: 22, color: PAL.ink, opacity: .6}}>{t}</div>;
const Count: React.FC<{f: number; a: number; b: number; to: number; dec?: number; pre?: string; suf?: string}> = ({f, a, b, to, dec = 0, pre = '', suf = ''}) => <>{pre}{(to * iv(f, a, b)).toFixed(dec)}{suf}</>;

// —— 场景（v2：codex 素材；f 为全片帧） ——
const A = (n: string) => staticFile(`mixue/a/${n}.png`);
const OW = owP as unknown as PoseSet;
const Pic: React.FC<{n: string; x: number; y: number; w: number; rot?: number; o?: number; s?: number; st?: boolean; origin?: string}> = ({n, x, y, w, rot = 0, o = 1, s = 1, st, origin = 'center bottom'}) =>
  <Img src={A(n)} style={{position: 'absolute', left: x, top: y, width: w, opacity: o, transform: `rotate(${rot}deg) scale(${s})`, transformOrigin: origin, filter: st ? 'drop-shadow(0 12px 10px rgba(40,25,10,.3))' : undefined}} />;
const popS = (f: number, at: number) => f < at ? 0 : interpolate(spring({frame: f - at, fps: 30, config: {damping: 10, stiffness: 220}}), [0, 1], [0, 1]);
const SignText: React.FC<{x: number; y: number; w: number; h: number; text: string; c?: string; s?: number}> = ({x, y, w, h, text, c = PAL.ink, s = 1}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: h * 0.62, color: c, letterSpacing: 4, transform: `scale(${s})`}}>{text}</div>;
const Street: React.FC<{f: number; z?: number}> = () => <><PaperBg /><Ground /></>;
const S01: React.FC<{f: number}> = ({f}) => {
  const you = kf(0, '不是'), fr = kf(0, '而是'), b = F(L[1].start), three = kf(1, '三家'), rob = kf(1, '抢客人'), hq = kf(1, '总部'), buy = kf(1, '进货');
  const push = interpolate(f, [0, 14], [1.18, 1], {extrapolateRight: 'clamp'}); const blur = interpolate(f, [0, 8], [5, 0], {extrapolateRight: 'clamp'});
  const p1 = 1 - iv(f, b - 6, b + 4); const p2 = iv(f, b - 4, b + 6);
  return <AbsoluteFill style={{transform: `scale(${push})`, filter: blur > .1 ? `blur(${blur}px)` : undefined}}>
    <PaperBg /><Ground />
    {/* 第 1 句：最大的客户 ≠ 你，= 加盟商 */}
    {p1 > 0 && <div style={{position: 'absolute', inset: 0, opacity: p1}}>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 300, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 76, color: PAL.ink}}>蜜雪冰城<span style={{color: PAL.vermilion}}>最大的客户</span>是？</div>
      <div style={{position: 'absolute', left: 150, top: 470, fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAL.ink, opacity: .75}}>买奶茶的你</div>
      <div style={{position: 'absolute', left: 640, top: 470, fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAL.vermilion, opacity: iv(f, fr, fr + 5)}}>开店的加盟商</div>
      {f >= fr && <div style={{position: 'absolute', left: 560, top: 560, width: 440, height: 880, borderRadius: 220, background: 'radial-gradient(ellipse, rgba(213,138,71,.28) 0%, rgba(213,138,71,0) 70%)', transform: `scale(${popS(f, fr)})`}} />}
      <div style={{position: 'absolute', inset: 0, filter: sticker}}>
        <div style={{opacity: f >= you + 8 ? .55 : 1}}><PoseCharacter set={XL} f={f} x={290} y={1430} height={XH - 280} xfade={1} track={[{at: 0, pose: 'stand_neutral'}, {at: you + 6, pose: 'confused'}]} /></div>
        {f >= fr - 2 && <div style={{transform: `scale(${popS(f, fr - 2)})`, transformOrigin: '780px 1430px'}}><PoseCharacter set={OW} f={f} x={780} y={1430} height={XH - 280} xfade={1} track={[{at: 0, pose: 'happy'}]} /></div>}
      </div>
      {f >= you + 4 && <Stamp f={f} at={you + 4} x={160} y={760} text="✕ 不是你" rot={-10} />}
      {f >= fr + 4 && <Stamp f={f} at={fr + 4} x={660} y={600} text="✓ 是他" rot={8} />}
    </div>}
    {/* 第 2 句：一条街三家店，都找总部进货 */}
    {p2 > 0 && <div style={{position: 'absolute', inset: 0, opacity: p2}}>
      <Pic n="hq" x={290} y={250} w={500} s={popS(f, hq - 4)} />
      {[0, 1, 2].map((k) => { const at = b + 2 + k * 5; const sh = f >= rob && f < hq ? Math.sin((f + k * 7) * 1.4) * 5 : 0; return f >= at && <Pic key={k} n="shop_open" x={30 + k * 345 + sh} y={900} w={330} s={popS(f, at)} />; })}
      <div style={{position: 'absolute', left: 0, width: 1080, top: 1180, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: PAL.ink, opacity: iv(f, three, three + 6)}}>同一条街 · 三家店</div>
      {f >= rob && f < hq + 10 && <div style={{position: 'absolute', left: 380, top: 790, fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: PAL.vermilion, transform: `rotate(-4deg) scale(${popS(f, rob)})`}}>抢客人！</div>}
      {f >= buy - 4 && [0, 1, 2].map((k) => { const p = iv(f, buy - 4 + k * 3, buy + 12 + k * 3); const x0 = 520, y0 = 600, x1 = 140 + k * 345, y1 = 900; return p < 1 && <Pic key={k} n="box_milk" x={x0 + (x1 - x0) * p} y={y0 + (y1 - y0) * p - Math.sin(p * Math.PI) * 120} w={110} origin="center" />; })}
      {f >= buy + 10 && <Stamp f={f} at={buy + 10} x={640} y={700} text="都找它进货" size={46} rot={6} />}
    </div>}
  </AbsoluteFill>;
};
const Donut: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = iv(f, at, at + 26); const R = 230, C = 2 * Math.PI * R; const a1 = 0.976 * p;
  return <svg width={600} height={600} viewBox="0 0 600 600" style={{position: 'absolute', left: 240, top: 480}}>
    <circle cx="300" cy="300" r={R} fill="none" stroke="#E7DAC2" strokeWidth="110" />
    <circle cx="300" cy="300" r={R} fill="none" stroke={PAL.vermilion} strokeWidth="110" strokeDasharray={`${C * a1} ${C}`} transform="rotate(-90 300 300)" />
    <circle cx="300" cy="300" r={R} fill="none" stroke={PAL.brass} strokeWidth="110" strokeDasharray={`${C * 0.024 * p} ${C}`} strokeDashoffset={-C * a1} transform="rotate(-90 300 300)" />
  </svg>;
};
const S02: React.FC<{f: number}> = ({f}) => {
  const rv = kf(2, '三百三十五亿'), pc = kf(2, '百分之九十七点六'), eq = kf(2, '原料'), dv = kf(2, '设备'), fee = kf(3, '百分之二点四');
  return <AbsoluteFill><PaperBg /><Ground />
    <Win title={<>收入 <span style={{color: PAL.vermilion, fontVariantNumeric: 'tabular-nums'}}><Count f={f} a={rv - 4} b={rv + 14} to={335} />亿</span></>} sub="蜜雪集团 · 2025 年">
      <div style={{position: 'absolute', left: -84, top: -290}}><Donut f={f} at={pc - 6} /></div>
      <div style={{position: 'absolute', left: 0, width: 912, top: 430, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 88, color: PAL.vermilion, opacity: iv(f, pc, pc + 6), fontVariantNumeric: 'tabular-nums'}}><Count f={f} a={pc} b={pc + 20} to={97.6} dec={1} suf="%" /></div>
      <div style={{position: 'absolute', left: 0, width: 912, top: 690, textAlign: 'center', fontFamily: SANS, fontSize: 36, color: PAL.ink, opacity: iv(f, eq, eq + 6)}}>卖给加盟店的原料和设备</div>
      {f >= fee - 4 && <div style={{position: 'absolute', left: 600, top: 60, padding: '10px 20px', background: '#FFFDF6', border: `4px solid ${PAL.brass}`, borderRadius: 10, fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: PAL.ink, transform: `scale(${1.3 - .3 * iv(f, fee - 4, fee)})`}}>加盟费+服务费 <span style={{color: PAL.copper}}>2.4%</span></div>}
      {['box_sugar', 'box_milk', 'box_equip'].map((n, k) => { const at = (k < 2 ? eq : dv) + k * 3; return <Pic key={k} n={n} x={190 + k * 200} y={790} w={130} s={popS(f, at)} rot={[-5, 3, -2][k]} />; })}
    </Win>
    <Src t="来源：蜜雪集团 2025 年度业绩公告（商品和设备 327.66 亿元；加盟及相关服务 7.94 亿元）" y={1180} />
  </AbsoluteFill>;
};
const S03: React.FC<{f: number}> = ({f}) => {
  const a = F(L[4].start), dev = kf(4, '设备'), goods = kf(4, '货上'), sh = kf(4, '这是'), no = kf(4, '不淘金'), sp = kf(4, '卖铲子');
  const gold = iv(f, sh - 4, sh + 6);
  return <AbsoluteFill>
    <Street f={f - a} z={0.0003} />
    <AbsoluteFill style={{background: '#F1E4CC', opacity: .25 + .6 * gold}} />
    {/* 前半：店主算账，物料箱一箱箱落下 */}
    <div style={{position: 'absolute', inset: 0, opacity: 1 - gold}}>
      {['box_equip', 'box_milk', 'box_sugar', 'box_tea', 'box_pack'].map((n, k) => { const at = (k < 2 ? dev : goods) + k * 3; const p = iv(f, at, at + 6); return f >= at && <Pic key={k} n={n} x={560 + (k % 3) * 150} y={1260 - Math.floor(k / 3) * 140 - (1 - p) * 300} w={160} rot={[-4, 5, -2, 3, -6][k]} />; })}
      <div style={{position: 'absolute', inset: 0, filter: sticker}}><PoseCharacter set={OW} f={f} x={300} y={1430} height={XH - 160} xfade={1} track={[{at: 0, pose: 'calc'}, {at: goods + 6, pose: 'sigh_sad'}]} /></div>
    </div>
    <Bubble f={f} at={a + 2} tag="评论区 · 180 赞" y={290}>加盟费不高，都卖<span style={{color: PAL.vermilion}}>装修卖设备</span>了</Bubble>
    {f >= sh - 4 && <div style={{opacity: gold}}>
      <Pic n="gold_rush_crowd" x={60 + (f - sh) * 1.5} y={780} w={600} o={f >= no ? .45 : 1} origin="center" />
      <div style={{position: 'absolute', left: 90, top: 960, fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: PAL.ink, opacity: .75}}>淘金的人（门店）</div>
      {f >= no && <Stamp f={f} at={no} x={110} y={820} text="不一定赚" size={44} rot={-8} />}
      <Pic n="shovel" x={720} y={620} w={220} rot={interpolate(spring({frame: f - sp, fps: 30, config: {damping: 8}}), [0, 1], [-30, 12])} st origin="center" />
      <Pic n="gold_nugget" x={600} y={1110} w={200} s={popS(f, sp + 4)} />
      <div style={{position: 'absolute', left: 640, top: 1080, fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: PAL.ink, opacity: iv(f, sp, sp + 6)}}>卖铲子的人（总部）</div>
    </div>}
    <Big f={f} a={sp} b={F(L[5].start) + 8} y={300}>不淘金，<span style={{color: PAL.vermilion}}>卖铲子</span></Big>
  </AbsoluteFill>;
};
// 门店示意：1 间 ≈ 2400 家；关店→切 closed，新开→弹出
const S04: React.FC<{f: number}> = ({f}) => {
  const cl = kf(5, '关了'), op = kf(5, '新开'), cols = 4, w = 220;
  const slots = Array.from({length: 16}, (_, k) => k); const init = [0, 1, 2, 4, 5, 6, 8, 9, 10]; const closeK = 5; const newK = [3, 7, 11, 12, 13, 14];
  return <AbsoluteFill><PaperBg /><Ground />
    <Win title={<>门店越多，<span style={{color: PAL.vermilion}}>铲子</span>卖得越多</>} sub="示意：1 间 ≈ 2400 家店（2025 年，含 12 月并入的福鹿家）">
      {slots.map((k) => { const x = 6 + (k % cols) * 222, y = 160 + Math.floor(k / cols) * 172; const isInit = init.includes(k); const ni = newK.indexOf(k);
        if (!isInit && ni < 0) return null;
        const at = ni >= 0 ? op + ni * 4 : 0; const s = ni >= 0 ? popS(f, at) : 1; const closed = k === closeK && f >= cl;
        const shake = closed ? Math.sin((f - cl) * 2.2) * 6 * Math.exp(-(f - cl) / 6) : 0;
        return <React.Fragment key={k}><Pic n='shop_open' x={x + shake} y={y} w={w} s={s} />{closed && <Pic n='shop_closed' x={x + shake} y={y} w={w} o={iv(f, cl, cl + 4)} />}</React.Fragment>; })}
      <div style={{position: 'absolute', left: 40, top: 860, fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: '#6B6B6B', opacity: iv(f, cl, cl + 6)}}>关店 2527</div>
      <div style={{position: 'absolute', left: 440, top: 860, fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: PAL.copper, opacity: iv(f, op, op + 6)}}>新开 14496</div>
      {f >= cl + 2 && <Stamp f={f} at={cl + 2} x={6 + (closeK % cols) * 222 + 30} y={160 + Math.floor(closeK / cols) * 172 + 50} text="关" size={48} rot={-12} />}
    </Win>
    <Src t="来源：蜜雪集团 2025 年度业绩公告（加盟门店变动表）" y={1180} />
  </AbsoluteFill>;
};
const S05: React.FC<{f: number}> = ({f}) => {
  const st = kf(6, '五万九千多'), fr = kf(6, '两万七千多'), pr = kf(6, '五十九亿'), av = kf(6, '十万');
  return <AbsoluteFill><PaperBg /><Ground />
    <Win title={<>店 <span style={{color: PAL.vermilion}}>5.9万</span> · 人 <span style={{color: PAL.teal}}>2.7万</span></>} sub="门店 59,823 家；加盟商 27,450 名（2025 年末）">
      {Array.from({length: 22}, (_, k) => <Img key={k} src={A('icon_store_512')} style={{position: 'absolute', left: 60 + (k % 11) * 74, top: 230 + Math.floor(k / 11) * 76, width: 64, opacity: iv(f, st + k, st + k + 4)}} />)}
      {Array.from({length: 10}, (_, k) => <Img key={k} src={A('icon_person_512')} style={{position: 'absolute', left: 60 + k * 82, top: 420, width: 68, opacity: iv(f, fr + k, fr + k + 4)}} />)}
      <div style={{position: 'absolute', left: 60, top: 510, fontFamily: SANS, fontSize: 30, color: PAL.ink, opacity: iv(f, fr + 8, fr + 14)}}>平均每位加盟商 ≈ 2.2 家店（推算）</div>
      {f >= pr - 4 && <div style={{position: 'absolute', left: 60, top: 600, width: 560, height: 260, background: '#FFFDF6', borderRadius: 8, boxShadow: '0 8px 0 rgba(80,52,24,.14)', opacity: iv(f, pr - 4, pr + 4)}}>
        <div style={{position: 'absolute', left: 30, top: 20, fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .7}}>年内利润 ÷ 门店数（平均数）</div>
        <div style={{position: 'absolute', left: 30, top: 70, fontFamily: SERIF, fontWeight: 900, fontSize: 80, color: PAL.ink, fontVariantNumeric: 'tabular-nums'}}><Count f={f} a={pr - 2} b={pr + 14} to={59.27} dec={2} suf="亿" /></div>
        {f >= av - 3 && <div style={{position: 'absolute', left: 30, top: 160, fontFamily: SERIF, fontWeight: 900, fontSize: 76, color: PAL.vermilion, transform: `scale(${1.3 - .3 * iv(f, av - 3, av + 2)})`, transformOrigin: 'left center'}}>≈ 10万 / 店</div>}
      </div>}
      <Pic n="king_count" x={630} y={560} w={300} s={popS(f, pr - 6)} />
    </Win>
    <Src t="来源：蜜雪集团 2025 年度业绩公告；59.27 亿 ÷ 59,823 ≈ 9.9 万" y={1180} />
  </AbsoluteFill>;
};
const S06: React.FC<{f: number}> = ({f}) => {
  const rent = kf(7, '房租'), lab = kf(7, '人工'), sell = kf(7, '卖不卖'), pay = kf(7, '货款'), hq = kf(7, '总部');
  const items = [{t: '房租', at: rent}, {t: '人工', at: lab}, {t: '卖不卖得出去', at: sell}];
  return <AbsoluteFill><PaperBg /><Ground />
    <div style={{position: 'absolute', left: 70, top: 290, fontFamily: SERIF, fontWeight: 900, fontSize: 50, color: PAL.ink}}>门店扛</div>
    {items.map((it, k) => <div key={k} style={{position: 'absolute', left: 70, top: 380 + k * 110 - (1 - iv(f, it.at, it.at + 6)) * 60, opacity: iv(f, it.at, it.at + 6), padding: '12px 26px', background: '#FFFDF6', borderRadius: 10, boxShadow: `0 0 0 4px ${PAL.ink}`, fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: PAL.ink}}>{it.t}</div>)}
    <div style={{position: 'absolute', left: 600, top: 290, fontFamily: SERIF, fontWeight: 900, fontSize: 50, color: PAL.vermilion, opacity: iv(f, pay - 4, pay + 4)}}>货款先进总部</div>
    <Pic n="hq" x={560} y={420} w={440} s={popS(f, pay - 6)} />
    {f >= hq && <Stamp f={f} at={hq} x={720} y={560} text="先收" size={54} />}
    {f >= pay && [0, 1, 2, 3, 4].map((k) => { const p = iv(f, pay + k * 4, pay + k * 4 + 16); return p < 1 && <Img key={k} src={A('coin')} style={{position: 'absolute', left: 360 + p * 420, top: 1000 - p * 420 - Math.sin(p * Math.PI) * 140, width: 90}} />; })}
    <Pic n="box_equip" x={560} y={1200} w={170} rot={-4} /><Pic n="box_milk" x={740} y={1220} w={150} rot={5} />
    <div style={{position: 'absolute', inset: 0, filter: sticker}}><PoseCharacter set={OW} f={f} x={300} y={1430} height={XH - 160} xfade={1} track={[{at: 0, pose: 'calc'}, {at: sell, pose: 'sigh_sad'}]} /></div>
  </AbsoluteFill>;
};
const S07: React.FC<{f: number}> = ({f}) => {
  const a = F(L[8].start), bill = kf(8, '账单'), song = kf(8, '歌是');
  return <AbsoluteFill><PaperBg tone="radial-gradient(ellipse at 50% 30%, #FFF6E6 0%, #F0DFC2 100%)" /><Ground />
    <Pic n={f < bill ? 'king_sing' : 'king_count'} x={40} y={690 + Math.sin(f / 5) * (f < song ? 8 : 2)} w={560} />
    {Array.from({length: 6}, (_, k) => { const t0 = a + k * 9; const p = ((f - t0) % 54) / 54; return f >= t0 && f < song + 10 && <div key={k} style={{position: 'absolute', left: 430 + p * 260 + Math.sin(p * 6 + k) * 30, top: 700 - p * 300, fontSize: 70, color: [PAL.vermilion, PAL.teal, PAL.copper][k % 3], opacity: 1 - p}}>♪</div>; })}
    <div style={{position: 'absolute', left: 100, top: 300, fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: PAL.ink, opacity: iv(f, a, a + 6) * (1 - iv(f, bill - 6, bill))}}>“你爱我，我爱你”</div>
    {f >= bill - 6 && <><Pic n="bill_roll" x={540 + (1 - iv(f, bill - 6, bill + 4)) * 500} y={280} w={420} rot={6} st />
      <div style={{position: 'absolute', left: 600 + (1 - iv(f, bill - 6, bill + 4)) * 500, top: 330, fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: PAL.vermilion, transform: 'rotate(6deg)'}}>账单 → 加盟商</div></>}
    <div style={{position: 'absolute', inset: 0, filter: sticker}}><PoseCharacter set={OW} f={f} x={810} y={1430} height={XH - 160} xfade={1} track={[{at: 0, pose: 'happy'}, {at: bill + 2, pose: 'sigh_sad'}]} /></div>
  </AbsoluteFill>;
};
const S08: React.FC<{f: number}> = ({f}) => {
  const o1 = kf(9, '是我'), o2 = kf(9, '还是'), end = F(L[9].start + L[9].sec);
  return <AbsoluteFill><PaperBg /><Ground />
    <Win title={<>加盟前，<span style={{color: PAL.vermilion}}>先问一句</span></>} sub="总部的钱，从哪来？">
      {[{t: '我卖奶茶的钱', at: o1}, {t: '卖货给我的钱', at: o2}].map((o, k) => <div key={k} style={{position: 'absolute', left: 70, top: 260 + k * 190, width: 770, height: 150, borderRadius: 14, background: '#FFFDF6', boxShadow: `0 0 0 4px ${PAL.ink}`, opacity: iv(f, o.at - 3, o.at + 4), transform: `scale(${1.15 - .15 * iv(f, o.at - 3, o.at + 4)})`, display: 'flex', alignItems: 'center', padding: '0 40px', fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: k ? PAL.vermilion : PAL.ink}}>
        <span style={{display: 'inline-block', width: 60, height: 60, border: `5px solid ${PAL.ink}`, borderRadius: 8, marginRight: 30}} />{o.t}</div>)}
      {f >= end && <Stamp f={f} at={end} x={520} y={660} text="先算清楚" size={56} />}
    </Win>
    <div style={{position: 'absolute', inset: 0, filter: sticker, transform: `translateY(${Math.sin(f / 9) * 6}px) scale(${1 + 0.05 * Math.max(0, 1 - Math.min(Math.abs(f - o1), Math.abs(f - o2), Math.abs(f - end)) / 5)})`, transformOrigin: '250px 1430px'}}><PoseCharacter set={OW} f={f} x={250} y={1430} height={XH - 380} xfade={1} track={[{at: 0, pose: 'calc'}, {at: o1, pose: 'happy'}, {at: o2, pose: 'sigh_sad'}, {at: end, pose: 'calc'}]} /></div>
  </AbsoluteFill>;
};

// 场景表：[起始句, 组件]
const SC: [number, React.FC<{f: number}>][] = [[0, S01], [2, S02], [4, S03], [5, S04], [6, S05], [7, S06], [8, S07], [9, S08]];
const SFXD = (n: string) => `g6/sfx_v3/${n}.wav`; // 已裁短/去刺/统一电平，规则见 docs/SFX_RULES.md
const V = {SUB: .38, WH: .26, POP: .28, TICK: .16, CHIME: .22, THOCK: .32, RISE: .22};
const S = (t: number, n: string, v: number): [number, string, number] => [t, n, v];
const sfx: [number, string, number][] = [
  S(0, 'soft_boom', V.SUB), S(0, 'whoosh-sfx', V.WH), S(kw(0, '不是') + 4 / 30, 'punch_u4LmMsr', V.THOCK * .7), S(kw(0, '而是') - 2 / 30, 'cartoon-boing_7vRWDlc', V.POP), S(kw(0, '而是') + 4 / 30, 'sparkle-sound-effect', V.CHIME * .8),
  S(L[1].start - 0.1, 'whoosh-wind', V.WH), ...[0, 1, 2].map((k) => S(L[1].start + (2 + k * 5) / 30, 'pop_7e9Is8L', V.POP)), S(kw(1, '总部') - 4 / 30, 'pop_7e9Is8L', V.POP), ...[0, 1, 2].map((k) => S(kw(1, '进货') + (k * 3 + 8) / 30, 'punch-gaming-sound-effect-hd_RzlG1GE', V.THOCK * .4)), S(kw(1, '进货') + 10 / 30, 'soft_boom', V.SUB * .8),
  S(L[2].start - 0.1, '166', V.WH), ...[0, 1, 2, 3, 4, 5].map((k) => S(kw(2, '三百三十五亿') + k * 0.08, 'keyboard-typing-sound-effect', V.TICK * .7)), S(kw(2, '三百三十五亿') + .5, 'ding-sound-effect_2', V.CHIME),
  S(kw(2, '百分之九十七点六') - 0.2, 'whoosh-sfx', V.WH), S(kw(2, '百分之九十七点六') + .65, 'soft_boom', V.SUB * .8), ...[0, 1, 2].map((k) => S(kw(2, '原料') + k * 0.13, 'pop_7e9Is8L', V.POP)),
  S(kw(3, '百分之二点四') - 0.13, 'pop_7e9Is8L', V.POP), S(kw(3, '百分之二点四') + 0.3, 'ding-sound-effect_2', V.CHIME * .8),
  S(L[4].start - 0.1, '166', V.WH), S(L[4].start + 0.07, 'pop_7e9Is8L', V.POP), ...[0, 1, 2, 3, 4].map((k) => S(kw(4, k < 2 ? '设备' : '货上') + (k * 3) / 30 + 0.12, 'punch-gaming-sound-effect-hd_RzlG1GE', V.THOCK * .45)), S(kw(4, '不淘金'), 'punch_u4LmMsr', V.THOCK * .7), S(kw(4, '卖铲子'), 'soft_boom', V.SUB * .7),
  S(L[5].start - 0.1, 'whoosh-wind', V.WH), S(kw(5, '关了') + 2 / 30, 'punch_u4LmMsr', V.THOCK), ...Array.from({length: 6}, (_, k) => S(kw(5, '新开') + k * 4 / 30, 'pop_7e9Is8L', V.POP * .8)), S(kw(5, '新开') + 1.4, 'ding-sound-effect_2', V.CHIME),
  S(L[6].start - 0.1, '166', V.WH), S(kw(6, '两万七千多'), 'pop_7e9Is8L', V.POP), S(kw(6, '五十九亿') - .1, 'whoosh-sfx', V.WH * .8), ...Array.from({length: 6}, (_, k) => S(kw(6, '五十九亿') + k * 0.09, 'keyboard-typing-sound-effect', V.TICK * .7)), S(kw(6, '十万') - .1, 'punch_u4LmMsr', V.THOCK), S(kw(6, '十万'), 'sparkle-sound-effect', V.CHIME),
  S(L[7].start - 0.1, 'whoosh-wind', V.WH), ...['房租', '人工', '卖不卖'].map((w) => S(kw(7, w), 'pop_7e9Is8L', V.POP)), ...[0, 1, 2, 3].map((k) => S(kw(7, '货款') + k / 6, 'ding-sound-effect_2', V.CHIME * .5)), S(kw(7, '总部'), 'punch_u4LmMsr', V.THOCK),
  S(L[8].start - 0.12, 'hanna-barbera-xylophone-quick-gliss-up', V.RISE), S(kw(8, '歌是'), 'pizzicato-violin', V.RISE * .8), S(kw(8, '账单') - .1, 'whoosh-sfx', V.WH), S(kw(8, '账单') + .05, 'soft_boom', V.SUB * .8),
  S(L[9].start - 0.1, '166', V.WH), S(kw(9, '先问'), 'pop_7e9Is8L', V.POP), S(kw(9, '是我'), 'pop_7e9Is8L', V.POP), S(kw(9, '还是'), 'punch_u4LmMsr', V.THOCK * .8), S(L[9].start + L[9].sec, 'punch_u4LmMsr', V.THOCK), S(L[9].start + L[9].sec + .05, 'soft_boom', V.SUB * .5),
];
export const MixueFull: React.FC = () => {
  const f = useCurrentFrame(); const t = f / FPS;
  const si = SC.reduce((m, [li], k) => (f >= F(L[li].start) - (k ? 4 : 0) ? k : m), 0); const Comp = SC[si][1];
  const s0 = si ? F(L[SC[si][0]].start) - 4 : 0; const p = iv(f, s0, s0 + 8);
  const li = L.reduce((m, l, k) => (t >= l.start - 0.1 ? k : m), 0);
  return <AbsoluteFill style={{background: '#EAD9BA'}}>
    <div style={{position: 'absolute', inset: 0, transform: si ? `scale(${0.94 + 0.06 * p})` : undefined, opacity: si ? Math.min(1, .3 + p) : 1}}><Comp f={f} /></div>
    <Caption i={li} t={t - L[li].start} />
    <BrandMark f={f} v="A" />
    <Audio src={staticFile('mixue/vo_full.wav')} />
    {sfx.map(([st, n, v], k) => <Sequence key={k} from={Math.max(0, Math.round(st * FPS))} durationInFrames={75}><Audio src={staticFile(SFXD(n))} volume={v} /></Sequence>)}
    <Audio src={staticFile('g6/audio/bgm_investigations.mp3')} loop volume={(g) => 0.085 * interpolate(g, [0, 10, MX_FRAMES - 30, MX_FRAMES], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
  </AbsoluteFill>;
};

// —— 封面（发布包）——
export const MixueCover: React.FC<{v: 'A' | 'B'}> = ({v}) => {
  const big = (t: string, c: string, sz: number, y: number, rot = 0) => <div style={{position: 'absolute', left: 0, width: 1080, top: y, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: sz, color: c, lineHeight: 1.1, transform: `rotate(${rot}deg)`, textShadow: '0 4px 0 rgba(255,253,246,.9)'}}>{t}</div>;
  return <AbsoluteFill><PaperBg /><Ground />
    {v === 'A' ? <>
      {big('蜜雪最大的客户', PAL.ink, 118, 330)}
      <div style={{position: 'absolute', left: 150, top: 560, fontFamily: SERIF, fontWeight: 900, fontSize: 96, color: '#8a7e6a', textDecoration: 'line-through', textDecorationColor: PAL.vermilion, textDecorationThickness: 10}}>不是你</div>
      <div style={{position: 'absolute', left: 480, top: 700, padding: '6px 34px', background: PAL.vermilion, color: '#FFFDF6', fontFamily: SERIF, fontWeight: 900, fontSize: 112, borderRadius: 14, transform: 'rotate(-4deg)', boxShadow: '0 8px 0 rgba(80,30,20,.25)'}}>是加盟商</div>
      <Pic n="hq" x={620} y={960} w={400} />
      <div style={{position: 'absolute', inset: 0, filter: sticker}}><PoseCharacter set={OW} f={0} x={330} y={1540} height={800} xfade={1} track={[{at: 0, pose: 'happy'}]} /></div>
      <Pic n="box_milk" x={620} y={1330} w={170} rot={-6} /><Pic n="box_equip" x={810} y={1350} w={170} rot={5} />
    </> : <>
      {big('蜜雪的账单', PAL.ink, 130, 330)}
      {big('开给谁？', PAL.vermilion, 150, 480, -3)}
      <Pic n="king_count" x={20} y={830} w={560} />
      <div style={{position: 'absolute', inset: 0, filter: sticker}}><PoseCharacter set={OW} f={0} x={800} y={1540} height={800} xfade={1} track={[{at: 0, pose: 'sigh_sad'}]} /></div>
      <Pic n="bill_roll" x={430} y={1020} w={330} rot={8} st />
    </>}
        <BrandMark f={40} v="A" />
  </AbsoluteFill>;
};

// —— 封面（多版式重排，不是裁切）——
type CF = {W: number; H: number; tx: number; ta: 'left' | 'center'; t1: number; t1y: number; t2: number; t2y: number; fa: number; fb: number; ch: number; cx: number; cy: number;
  strikeY: number; badgeX: number; badgeY: number; hq: [number, number, number]; box: [number, number, number]; king: [number, number, number]; bill: [number, number, number]; tx2: number};
const CFG: Record<string, CF> = {
  T: {W: 1080, H: 1440, tx: 0, ta: 'center', t1: 118, t1y: 170, t2: 96, t2y: 340, fa: 118, fb: 112, ch: 790, cx: 330, cy: 1340, strikeY: 340, badgeX: 470, badgeY: 335, hq: [630, 640, 400], box: [620, 1060, 170], king: [20, 640, 520], bill: [400, 820, 300], tx2: 0},
  L43: {W: 1440, H: 1080, tx: 70, ta: 'left', t1: 108, t1y: 200, t2: 90, t2y: 370, fa: 108, fb: 120, ch: 800, cx: 1150, cy: 1030, strikeY: 370, badgeX: 70, badgeY: 510, hq: [70, 760, 380], box: [500, 830, 160], king: [620, 450, 420], bill: [70, 680, 380], tx2: 70},
  L169: {W: 1920, H: 1080, tx: 100, ta: 'left', t1: 150, t1y: 190, t2: 110, t2y: 400, fa: 150, fb: 160, ch: 840, cx: 1500, cy: 1030, strikeY: 400, badgeX: 100, badgeY: 550, hq: [100, 790, 420], box: [570, 850, 170], king: [860, 470, 440], bill: [120, 640, 340], tx2: 100},
};
export const MixueCover2: React.FC<{v: 'A' | 'B'; fmt: 'T' | 'L43' | 'L169'}> = ({v, fmt}) => {
  const c = CFG[fmt]; const W = c.W, H = c.H;
  const txt = (t: string, col: string, sz: number, y: number, rot = 0) => <div style={{position: 'absolute', left: c.tx, width: c.ta === 'center' ? W : W - c.tx, top: y, textAlign: c.ta, fontFamily: SERIF, fontWeight: 900, fontSize: sz, color: col, lineHeight: 1.1, whiteSpace: 'nowrap', transform: `rotate(${rot}deg)`, transformOrigin: 'left center', textShadow: '0 4px 0 rgba(255,253,246,.9)'}}>{t}</div>;
  return <AbsoluteFill style={{width: W, height: H}}>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 28%, #F8F0E1 0%, #EEDFC4 62%, #E3CFAE 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round(H * .12), background: 'linear-gradient(180deg, rgba(110,157,163,.08), rgba(32,60,58,.14))'}} />
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><circle cx={W - 120} cy={260} r={240} fill="none" stroke={PAL.brass} strokeOpacity=".18" strokeWidth="2" /><circle cx={80} cy={H - 160} r={170} fill={PAL.teal} fillOpacity=".06" /></svg>
    {v === 'A' ? <>
      {txt('蜜雪最大的客户', PAL.ink, c.fa, c.t1y)}
      <div style={{position: 'absolute', left: fmt === 'T' ? 130 : c.tx, top: c.strikeY, fontFamily: SERIF, fontWeight: 900, fontSize: c.t2, color: '#8a7e6a', textDecoration: 'line-through', textDecorationColor: PAL.vermilion, textDecorationThickness: 10, whiteSpace: 'nowrap'}}>不是你</div>
      <div style={{position: 'absolute', left: c.badgeX, top: c.badgeY, padding: '6px 34px', background: PAL.vermilion, color: '#FFFDF6', fontFamily: SERIF, fontWeight: 900, fontSize: c.fb, borderRadius: 14, transform: 'rotate(-3deg)', boxShadow: '0 8px 0 rgba(80,30,20,.25)', whiteSpace: 'nowrap'}}>是加盟商</div>
      <Pic n="hq" x={c.hq[0]} y={c.hq[1]} w={c.hq[2]} />
      <Pic n="box_milk" x={c.box[0]} y={c.box[1]} w={c.box[2]} rot={-6} /><Pic n="box_equip" x={c.box[0] + c.box[2] + 20} y={c.box[1] + 20} w={c.box[2]} rot={5} />
      <div style={{position: 'absolute', inset: 0, filter: sticker}}><PoseCharacter set={OW} f={0} x={c.cx} y={c.cy} height={c.ch} xfade={1} track={[{at: 0, pose: 'happy'}]} /></div>
    </> : <>
      {txt('蜜雪的账单', PAL.ink, c.fb, c.t1y)}
      {txt('开给谁？', PAL.vermilion, c.fb + 20, c.t1y + c.fb + 30, -3)}
      <Pic n="king_count" x={c.king[0]} y={c.king[1]} w={c.king[2]} />
      <Pic n="bill_roll" x={c.bill[0]} y={c.bill[1]} w={c.bill[2]} rot={8} st />
      <div style={{position: 'absolute', inset: 0, filter: sticker}}><PoseCharacter set={OW} f={0} x={fmt === 'T' ? 810 : fmt === 'L169' ? 1640 : c.cx} y={c.cy} height={c.ch} xfade={1} track={[{at: 0, pose: 'sigh_sad'}]} /></div>
    </>}
    <div style={{position: 'absolute', right: 40 + 84 + 12, top: 76, height: 52, padding: '0 20px 0 24px', display: 'flex', alignItems: 'center', background: PAL.ink, borderLeft: `6px solid ${PAL.vermilion}`, borderRadius: '6px 0 0 6px', fontFamily: SERIF, fontWeight: 900, fontSize: 26, letterSpacing: 3, color: PAL.paper, whiteSpace: 'nowrap'}}>通政使 · 观察记录</div>
    <Img src={staticFile('g6/brand/seal_t.png')} style={{position: 'absolute', right: 40, top: 28 + 48 - 0, width: 84, height: 84, transform: 'rotate(-6deg)', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.35))'}} />
  </AbsoluteFill>;
};
