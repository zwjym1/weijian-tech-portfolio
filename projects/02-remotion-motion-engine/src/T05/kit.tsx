import React from 'react';
import {Img, staticFile, interpolate, Easing, spring} from 'remotion';
import {C, FONT_SANS, FONT_SERIF} from '../core/tokens';
import HL from './data/hl.json';

export const FPS = 30;
export const clampO = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const R = (n: string) => staticFile(`T05/real/${n}.png`);
export const D = (n: string) => staticFile(`T05/draw/${n}.png`);
export const SF = (n: string) => staticFile(`T05/sfx/${n}.wav`);
// 纸卡/道具"一拍二"：15fps 阶梯；文字/镜头/数字 30fps
export const q = (f: number) => f; // v2：全片 30fps 真运动（去掉一拍二）
export const ez = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clampO, easing: Easing.bezier(0.22, 1, 0.36, 1)});
export const exz = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clampO, easing: Easing.inOut(Easing.quad)});
export const sp = (f: number, at: number, damping = 11, stiffness = 170) => f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping, stiffness}});

export const RED = C.red, INK = C.ink, COP = C.amber, CREAM = C.cream, TEAL = C.cyan;
export const sticker = 'drop-shadow(2px 0 0 #FFFDF6) drop-shadow(-2px 0 0 #FFFDF6) drop-shadow(0 2px 0 #FFFDF6) drop-shadow(0 -2px 0 #FFFDF6) drop-shadow(0 8px 8px rgba(32,60,58,.25))';
export const numStyle = (size: number, color: string): React.CSSProperties => ({
  fontFamily: FONT_SERIF, fontWeight: 900, fontSize: size, color, lineHeight: 1, whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums', WebkitTextStroke: '12px #FFFDF6', paintOrder: 'stroke fill', textShadow: '0 10px 0 rgba(32,60,58,.12)',
});

// ───────── 纸卡 + 荧光笔 ─────────
export const DIM: Record<string, [number, number]> = {
  R01_gov_body: [1760, 749], R02_court_body: [1760, 746], R03_court_body: [1760, 716], R04_iresearch_body: [1838, 1740], R04_title_strip: [1640, 120], R04_local_chart: [1130, 545], R05_iresearch_body: [2125, 1125],
  R06_sdnews_head: [1672, 469], R06_sdnews_body: [1760, 369], R07_sdnews_body: [1760, 489], R08_caixin_head: [1672, 280], R08_caixin_body: [1760, 483], R08_caixin_body_lede: [1760, 501],
  R09_wuhan_body: [1760, 858], R10_mofcom_body: [1760, 577], R11a_sina_body: [1760, 130], R11b_sina_body: [1760, 525], R12_sina_body: [1760, 660],
};
export type Part = {n: string; hl?: {k: string; at: number; zoom?: boolean}[]; box?: {x: number; y: number; w: number; h: number; at: number}};
const PAD = 14, GAP = 6, TAGLH = 31;
export const cardH = (w: number, parts: Part[], tagLines: number) => PAD * 2 + parts.reduce((a, p) => a + (w - PAD * 2) * DIM[p.n][1] / DIM[p.n][0], 0) + GAP * (parts.length - 1) + (tagLines ? tagLines * TAGLH + 8 : 0);

export const Hl: React.FC<{box: {x: number; y: number; w: number; h: number}; W: number; Hh: number; f: number; at: number; dur?: number}> = ({box, W, Hh, f, at, dur = 10}) => {
  const p = ez(f, at, at + dur); if (p <= 0) return null;
  const x = box.x * W - 6, w = box.w * W + 12, h = Math.min(box.h * Hh, Hh * 0.2) * 0.92, y = box.y * Hh + (box.h * Hh - h) / 2 + 3;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, mixBlendMode: 'multiply', pointerEvents: 'none'}}>
    <Img src={D('D04c_highlighter')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
    <Img src={D('D04c_highlighter')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
  </div>;
};

type Kind = 'br' | 'rise' | 'drop' | 'right' | 'still';
export const pose = (f: number, inAt: number, kind: Kind, outAt?: number, exit: 'left' | 'down' | 'fade' = 'left', dist = 900) => {
  const t = q(f); let tx = 0, ty = 0, rot = 0, op = 1, sc = 1, blur = 0;
  const p = ez(t, inAt, inAt + (kind === 'drop' ? 12 : 10));
  if (f < inAt) op = 0;
  else if (kind === 'br') { tx = (1 - p) * 140; ty = (1 - p) * 190; rot = (1 - p) * 5; op = Math.min(1, p * 2); }
  else if (kind === 'rise') { ty = (1 - p) * 360; op = Math.min(1, p * 2.4); }
  else if (kind === 'right') { tx = (1 - p) * 700; op = Math.min(1, p * 2.4); }
  else if (kind === 'drop') { const s = sp(t, inAt, 11, 150); ty = (1 - s) * -420; op = Math.min(1, (t - inAt + 1) / 3); const sq = t > inAt + 8 && t < inAt + 16 ? 1 - 0.04 * Math.sin((t - inAt - 8) / 8 * Math.PI) : 1; sc = sq; }
  if (f >= inAt && kind !== 'still') blur = (1 - p) * 6;
  if (outAt !== undefined && f >= outAt) {
    const e = exz(f, outAt, outAt + 10); blur = Math.max(blur, e * 5);
    if (exit === 'left') { tx -= e * dist; op *= 1 - e; } else if (exit === 'down') { ty += e * 700; op *= 1 - e; } else { op *= 1 - e; }
  }
  return {tx, ty, rot, op, sc, blur};
};
export const idle = (f: number, s: number) => ({x: Math.sin((f + s) / 37) * 2.4, y: Math.cos((f + s * 1.7) / 47) * 2.0, r: Math.sin((f + s * 0.6) / 71) * 0.18});

export const Card: React.FC<{f: number; x: number; y: number; w: number; parts: Part[]; tag?: string[]; tilt?: number; inAt: number; outAt?: number; kind?: Kind; exit?: 'left' | 'down' | 'fade'; z?: number; opacity?: number; zoom?: boolean; veil?: boolean}> = ({f, x, y, w, parts, tag = [], tilt = 0, inAt, outAt, kind = 'br', exit = 'left', z = 10, opacity = 1, zoom = true, veil = true}) => {
  const ps = pose(f, inAt, kind, outAt, exit);
  if (ps.op <= 0.001) return null;
  const iw = w - PAD * 2; const h = cardH(w, parts, tag.length);
  // 注意力：放大并圈出关键行再退回（缩放原点=高亮中心；多目标按权重平滑过渡）
  const tg: {cx: number; cy: number; a: number; d: number}[] = [];
  { let y0 = PAD; parts.forEach(p => { const ih = iw * DIM[p.n][1] / DIM[p.n][0]; const top = y0; y0 += ih + GAP;
    (p.hl ?? []).forEach(hh => { if (hh.zoom === false) return; const bs = (HL as any)[hh.k] as any[]; const x0 = Math.min(...bs.map(b => b.x)), x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.min(...bs.map(b => b.y)), y2 = Math.max(...bs.map(b => b.y + b.h));
      tg.push({cx: PAD + (x0 + x1) / 2 * iw, cy: top + (y1 + y2) / 2 * ih, a: hh.at, d: 36}); });
    if (p.box) tg.push({cx: PAD + (p.box.x + p.box.w / 2) * iw, cy: top + (p.box.y + p.box.h / 2) * ih, a: p.box.at - 30, d: 56}); }); }
  const ws = zoom ? tg.map(t => Math.max(0, ez(f, t.a - 8, t.a + 4) - ez(f, t.a + t.d, t.a + t.d + 16))) : tg.map(() => 0);
  const bump = ws.length ? Math.max(...ws) : 0; const sumw = ws.reduce((a, b) => a + b, 0) || 1;
  const ox = tg.length ? tg.reduce((s, t, i) => s + ws[i] * t.cx, 0) / sumw : w / 2, oy = tg.length ? tg.reduce((s, t, i) => s + ws[i] * t.cy, 0) / sumw : h / 2;
  const zs = 1 + 0.2 * bump; const lft = x + ox * (1 - zs), rgt = x + ox + (w - ox) * zs; const zdx = lft < 24 ? 24 - lft : rgt > 1056 ? 1056 - rgt : 0; const id = idle(f, x + y);
  let yy = PAD;
  return <>
    {veil && bump > 0.01 && <div style={{position: 'absolute', left: -120, top: -120, width: 1320, height: 2160, zIndex: 55, background: `rgba(241,228,204,${0.55 * bump})`, pointerEvents: 'none'}} />}
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, zIndex: bump > 0.01 ? 60 : z, opacity: ps.op * opacity, filter: ps.blur > 0.3 ? `blur(${ps.blur}px)` : undefined,
      transform: `translate(${ps.tx + id.x}px, ${ps.ty + id.y}px) rotate(${tilt + ps.rot + id.r}deg) scale(${ps.sc})`, transformOrigin: '50% 50%'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${zdx}px) scale(${zs})`, transformOrigin: `${ox}px ${oy}px`}}>
    <div style={{position: 'absolute', inset: 0, background: '#FFFDF6', borderRadius: 8, border: '3px solid #F4E9D2', boxShadow: '0 18px 40px rgba(32,60,58,.20), 0 2px 0 rgba(32,60,58,.10)'}} />
    {parts.map((p, i) => {
      const ih = iw * DIM[p.n][1] / DIM[p.n][0]; const top = yy; yy += ih + GAP;
      const boxes = (p.hl ?? []).flatMap(hh => ((HL as any)[hh.k] as any[]).map(b => ({b, at: hh.at})));
      return <div key={i} style={{position: 'absolute', left: PAD, top, width: iw, height: ih}}>
        <Img src={R(p.n)} style={{width: '100%', height: '100%', display: 'block'}} />
        {boxes.map((o, j) => <Hl key={j} box={o.b} W={iw} Hh={ih} f={f} at={o.at + (j > 0 ? 4 : 0)} />)}
        {p.box && f >= p.box.at && (() => { const b = p.box!; const s = sp(q(f), b.at, 11, 230);
          return <div style={{position: 'absolute', left: b.x * iw - 8, top: b.y * ih - 8, width: b.w * iw + 16, height: b.h * ih + 16, border: `6px solid ${RED}`, borderRadius: 12, boxSizing: 'border-box', opacity: Math.min(1, s * 3), transform: `scale(${1.35 - 0.35 * s})`, boxShadow: '0 0 0 3px rgba(255,253,246,.9)'}} />; })()}
      </div>;
    })}
    {tag.length > 0 && <div style={{position: 'absolute', left: PAD + 4, right: PAD, bottom: 8, fontFamily: FONT_SANS, fontSize: 26, lineHeight: `${TAGLH}px`, color: INK, opacity: .85}}>
      {tag.map((t, i) => <div key={i} style={{whiteSpace: 'nowrap'}}>{t}</div>)}</div>}
      </div>
    </div>
  </>;
};

// ───────── 无字道具（带投影） ─────────
export const Prop: React.FC<{f: number; n: string; x: number; y: number; w: number; rot?: number; inAt?: number; outAt?: number; kind?: Kind; exit?: 'left' | 'down' | 'fade'; z?: number; shadow?: boolean; extra?: React.CSSProperties; ox?: number; oy?: number; flipX?: boolean; children?: React.ReactNode; hold?: boolean}> =
  ({f, n, x, y, w, rot = 0, inAt = 0, outAt, kind = 'br', exit = 'left', z = 20, shadow = true, extra, ox = 0, oy = 0, flipX, children, hold}) => {
    const ps = hold ? {tx: 0, ty: 0, rot: 0, op: 1, sc: 1} : pose(f, inAt, kind, outAt, exit, 700);
    if (ps.op <= 0.001) return null; const id = idle(f, x * 0.7 + y);
    return <div style={{position: 'absolute', left: x, top: y, width: w, zIndex: z, opacity: ps.op, filter: (ps as any).blur > 0.3 ? `blur(${(ps as any).blur}px)` : undefined, transform: `translate(${ps.tx + ox + id.x}px, ${ps.ty + oy + id.y}px) rotate(${rot + ps.rot + id.r}deg) scale(${ps.sc}${flipX ? ', 1' : ''})`, transformOrigin: '50% 50%', ...extra}}>
      {shadow && <Img src={D(n + '_shadow')} style={{position: 'absolute', left: 0, top: 6, width: '100%', opacity: .9}} />}
      <Img src={D(n)} style={{position: 'relative', width: '100%', display: 'block'}} />
      {children}
    </div>;
  };

// 小丞印章（代码绘制：朱红印框 + 宋体“小丞”，盖章在左上角，60% 透明）
export const Seal: React.FC = () => (
  <div style={{position: 'absolute', left: 84, top: 250, width: 62, height: 84, zIndex: 95, opacity: .6, border: `5px solid ${RED}`, borderRadius: 9, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 31, lineHeight: '34px', color: RED, mixBlendMode: 'multiply', transform: 'rotate(-3deg)'}}>
    <div>小</div><div>丞</div></div>
);

// 底：D01 纸张 + 颗粒两张交替(12fps) + 极慢漂移
export const PaperBG: React.FC<{f: number}> = ({f}) => {
  const gw = 0.5 + 0.5 * Math.sin(f / 9); const dx = Math.sin(f / 190) * 12, dy = Math.cos(f / 230) * 14;
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: CREAM}}>
    <Img src={D('D01_paper_texture')} style={{position: 'absolute', left: -30, top: -50, width: 1140, height: 2020, transform: `translate(${dx}px, ${dy}px)`}} />
    <Img src={D('D01_grain_a')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, mixBlendMode: 'multiply', opacity: .55 * gw}} />
    <Img src={D('D01_grain_b')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, mixBlendMode: 'multiply', opacity: .55 * (1 - gw)}} />
  </div>;
};
