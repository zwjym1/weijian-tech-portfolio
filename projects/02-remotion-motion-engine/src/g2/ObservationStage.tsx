// 通政使·万象观察台 —— 可复用组件（G2）
// 资产：codex G2 (assets/G2) 经 public/g2 预处理。状态 S0–S3 见 docs/VISUAL_BIBLE.md
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, Easing} from 'remotion';
export const PAL = {paper: '#F1E4CC', ink: '#203C3A', copper: '#D58A47', brass: '#BEA06C', vermilion: '#B8483A', teal: '#6E9DA3'};
export const SERIF = '"Noto Serif CJK SC","Source Han Serif SC",serif';
export const SANS = '"Noto Sans CJK SC","Source Han Sans SC",sans-serif';
export type Rect = {x: number; y: number; w: number; h: number};
export type StageState = 'S0' | 'S1' | 'S2' | 'S3';
export const FULL: Rect = {x: 0, y: 0, w: 1080, h: 1920};
export const SAFE = {top: 240, bottom: 1540, left: 72, right: 920 /* y 900–1540 右列避让 */, rightTop: 1008};
const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const EASE = Easing.bezier(0.22, 1, 0.36, 1);
export const iv = (f: number, a: number, b: number, from = 0, to = 1, e = EASE) => interpolate(f, [a, b], [from, to], {...cl, easing: e});
export const twos = (f: number) => Math.floor(f / 2) * 2; // 纸雕“一拍二”
export const lerpR = (a: Rect, b: Rect, t: number): Rect => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t});

/* 纸雕边框（S2）：边条平铺 + 四角件；o 透明度，flip 0..1 为纸窗翻开 */
export const PaperFrame: React.FC<{r: Rect; o?: number; corner?: number}> = ({r, o = 1, corner = 200}) => {
  const t = 44; // 边条厚度
  const edgeH = (side: 'top' | 'bottom') => (
    <div style={{position: 'absolute', left: corner * 0.4, right: corner * 0.4, height: t, [side]: -t / 2, backgroundImage: `url(${staticFile(`g2/edge_${side}.png`)})`, backgroundSize: `auto ${t}px`, backgroundRepeat: 'repeat-x'}} />);
  const edgeV = (side: 'left' | 'right') => (
    <div style={{position: 'absolute', top: corner * 0.4, bottom: corner * 0.4, width: t, [side]: -t / 2, backgroundImage: `url(${staticFile(`g2/edge_${side}.png`)})`, backgroundSize: `${t}px auto`, backgroundRepeat: 'repeat-y'}} />);
  const C = (k: string, s: React.CSSProperties) => <Img src={staticFile(`g2/corner_${k}.png`)} style={{position: 'absolute', width: corner, height: corner, ...s}} />;
  return (
    <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, opacity: o, pointerEvents: 'none', filter: 'drop-shadow(0 10px 8px rgba(60,40,20,.28))'}}>
      {edgeH('top')}{edgeH('bottom')}{edgeV('left')}{edgeV('right')}
      {C('TL', {left: -t * 0.6, top: -t * 0.6})}{C('TR', {right: -t * 0.6, top: -t * 0.6})}{C('BL', {left: -t * 0.6, bottom: -t * 0.6})}{C('BR', {right: -t * 0.6, bottom: -t * 0.6})}
    </div>);
};

/* S1 角标：缩小的回纹/祥云角件 + 细墨线，不占观看面积 */
export const CornerMarks: React.FC<{o: number; size?: number}> = ({o, size = 120}) => {
  const m = 34;
  const s = (k: string, st: React.CSSProperties) => <Img src={staticFile(`g2/corner_${k}.png`)} style={{position: 'absolute', width: size, height: size, opacity: 0.92, ...st}} />;
  return (<AbsoluteFill style={{opacity: o, pointerEvents: 'none'}}>
    {s('TL', {left: m, top: 210})}{s('BR', {right: m, bottom: 400})}
    <div style={{position: 'absolute', left: m + 8, top: 210 + size + 10, width: 1.5, height: 220, background: 'rgba(241,228,204,.75)'}} />
    <div style={{position: 'absolute', right: m + 8, bottom: 400 + size + 10, width: 1.5, height: 220, background: 'rgba(241,228,204,.75)'}} />
  </AbsoluteFill>);
};

/* B 黄铜观察环：环体 + 冷青镜片 + 扫描高光；代码旋转 */
export const BrassRing: React.FC<{f: number; x: number; y: number; size: number; o?: number; scan?: number; lens?: boolean}> = ({f, x, y, size, o = 1, scan = -1, lens = true}) => (
  <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: o, filter: 'drop-shadow(0 18px 16px rgba(30,20,10,.38))'}}>
    {lens && <Img src={staticFile('g2/lens.png')} style={{position: 'absolute', inset: '8%', width: '84%', height: '84%', opacity: 0.55, mixBlendMode: 'screen'}} />}
    <Img src={staticFile('g2/ring.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', transform: `rotate(${f * 0.6}deg)`}} />
    {scan >= 0 && <div style={{position: 'absolute', inset: '9%', borderRadius: '50%', overflow: 'hidden'}}>
      <Img src={staticFile('g2/scan.png')} style={{position: 'absolute', width: '140%', height: '140%', left: `${-90 + scan * 120}%`, top: '-20%', mixBlendMode: 'screen', opacity: 0.9}} /></div>}
  </div>
);

/* E 朱红观察印记（已柔化：超椭圆、斑驳、斜置、非官方） */
export const ObsSeal: React.FC<{f: number; x: number; y: number; size?: number; blend?: 'multiply' | 'normal'}> = ({f, x, y, size = 200, blend = 'multiply'}) => {
  if (f < 0) return null;
  const s = interpolate(f, [0, 4, 8], [1.7, 0.94, 1], cl);
  return <Img src={staticFile('g2/seal.png')} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${s})`, opacity: iv(f, 0, 3), mixBlendMode: blend, filter: blend === 'normal' ? 'drop-shadow(0 0 0 #FFFDF6) drop-shadow(0 4px 6px rgba(0,0,0,.4))' : undefined}} />;
};

/* 字幕：一句一条，关键词铜橙加粗；放在安全区内 */
export const Caption: React.FC<{parts: (string | [string])[]; o: number; y?: number; dark?: boolean}> = ({parts, o, y = 1360, dark}) => (
  <div style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: y, opacity: o, transform: `translateY(${(1 - o) * 14}px)`, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 62, lineHeight: 1.22,
    color: dark ? PAL.ink : '#FFFDF6', WebkitTextStroke: dark ? undefined : '10px rgba(32,60,58,.92)', paintOrder: 'stroke fill', textShadow: dark ? undefined : '0 6px 0 rgba(32,60,58,.45)'}}>
    {parts.map((p, i) => typeof p === 'string' ? <span key={i}>{p}</span> : <span key={i} style={{color: dark ? PAL.vermilion : '#FFC277', fontSize: 72}}>{p[0]}</span>)}
  </div>
);

/* 标题（S2 用，y≥240） */
export const Title: React.FC<{text: React.ReactNode; sub?: string; o: number; y?: number}> = ({text, sub, o, y = 262}) => (
  <div style={{position: 'absolute', left: SAFE.left + 12, top: y, opacity: o, transform: `translateY(${(1 - o) * -20}px)`}}>
    <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: PAL.ink, letterSpacing: 2}}>{text}</div>
    {sub && <div style={{fontFamily: SANS, fontSize: 26, letterSpacing: 8, color: PAL.ink, opacity: 0.7, marginTop: 6}}>{sub}</div>}
  </div>
);

/* 观察台主体：根据状态返回不同壳；children 为内容层 */
export const ObservationStage: React.FC<{state: StageState; r: Rect; f: number; frameO?: number; children: React.ReactNode}> = ({state, r, f, frameO = 1, children}) => (
  <>
    <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden', borderRadius: state === 'S2' ? 6 : 0}}>{children}</div>
    {state === 'S1' && <CornerMarks o={frameO} />}
    {state === 'S2' && <PaperFrame r={r} o={frameO} />}
  </>
);
