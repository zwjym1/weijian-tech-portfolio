import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, spring, interpolate, Audio, Sequence} from 'remotion';
import {PoseCharacter, PoseSet} from '../g6/PoseCharacter';
import xlP from '../g6/poses/xl.json';
import mmP from '../g6/poses/mm.json';
import {PAL, SERIF, SANS, Rect, iv, twos, ObservationStage, BrassRing, ObsSeal, Caption, Title, CornerMarks} from '../g2/ObservationStage';

export const G4_FRAMES = 318;
import voFull from '../g6/data/vo_full.json';
// 片头三句的帧位来自 vo_full.json（重配音后自动跟随）
export const V = (voFull as any).lines.slice(0, 3).map((l: any) => ({from: Math.round(l.start * 30), sec: l.sec})) as {from: number; sec: number}[];
export const vf = (i: number, t: number) => V[i].from + Math.round(t * 30); // 语音字级时间 -> 帧
export const K = {card: vf(0, 1.28), save: vf(0, 2.16), s1: 100, tzsOut: 126, mmIn: 118, point: vf(1, 0.8), stack: 150, s2: 206, morph: vf(2, 1.12), seal: vf(2, 2.0) + 6, collapse: 292};
type Lay = {win: Rect; crop: Rect; card: Rect; capY: number; title: boolean; tag?: boolean; cardTitle?: boolean; sealX: number; sealY: number};
// 版式网格：左右边距 84，内容宽 912；安全区 y 240–1540
export const LAYOUTS: Record<string, Lay> = {
  A: {win: {x: 84, y: 372, w: 912, h: 880}, crop: {x: 0, y: 536, w: 1080, h: 1042}, card: {x: 84, y: 1292, w: 912, h: 128}, capY: 1452, title: true, sealX: 900, sealY: 286},
  B: {win: {x: 84, y: 372, w: 912, h: 1048}, crop: {x: 0, y: 430, w: 1080, h: 1241}, card: {x: 352, y: 420, w: 376, h: 196}, capY: 1452, title: true, tag: true, sealX: 900, sealY: 286},
  C: {win: {x: 84, y: 250, w: 912, h: 960}, crop: {x: 0, y: 512, w: 1080, h: 1137}, card: {x: 84, y: 1250, w: 912, h: 176}, capY: 1458, title: false, cardTitle: true, sealX: 905, sealY: 1262},
};
let L: Lay = LAYOUTS.C;
let WIN: Rect = L.win;
// 取景框 C：全屏设计坐标里被“缩进窗口”的那块（同一张画面的真实拉远，FLIP）
let CROP: Rect = L.crop;
const g4 = (n: string) => staticFile(`g4/${n}`);
const g2 = (n: string) => staticFile(`g2/${n}`);

const GOODS = [
  {src: '02_goods_rice', w: 170, x: 430, b: 1330, rot: -4, t: K.stack, nat: [508, 784]},
  {src: '05_goods_oil', w: 96, x: 610, b: 1330, rot: 5, t: K.stack + 8, nat: [372, 1171]},
  {src: '06_goods_snack', w: 150, x: 510, b: 1250, rot: 8, t: K.stack + 16, nat: [523, 863]},
  {src: '03_goods_eggs', w: 160, x: 420, b: 1080, rot: -6, t: K.stack + 24, nat: [478, 469]},
  {src: '04_goods_greens', w: 250, x: 470, b: 1020, rot: -9, t: K.stack + 32, nat: [869, 596]},
];
let NEWC = false; // G7：小林/林妈妈改用 PoseCharacter 整图姿态
const gh = (g: typeof GOODS[0]) => (g.w * g.nat[1]) / g.nat[0];
const sticker = 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 12px 10px rgba(40,25,10,.32))';

/* 平面贴纸购物车（代码绘制，白描边） */
const Cart: React.FC<{swell: number}> = ({swell}) => (
  <svg width="420" height="380" viewBox="0 0 420 380" style={{position: 'absolute', left: 360, top: 1150, overflow: 'visible', filter: 'drop-shadow(0 12px 10px rgba(40,25,10,.3))', transform: `scale(${1 + swell * 0.04}, ${1 + swell * 0.07})`, transformOrigin: '50% 100%'}}>
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M20,40 L70,40 L105,250 L360,250 L395,90 L80,90" fill="none" stroke="#fff" strokeWidth="26" />
      <path d="M80,90 L395,90 L360,250 L105,250 Z" fill="rgba(213,138,71,.18)" />
      <path d="M20,40 L70,40 L105,250 L360,250 L395,90 L80,90" fill="none" stroke={PAL.ink} strokeWidth="12" />
      {[130, 180, 230, 280, 330].map((x) => <line key={x} x1={x - 8} y1="94" x2={x - 22} y2="246" stroke={PAL.ink} strokeWidth="5" opacity=".7" />)}
      <line x1="92" y1="170" x2="378" y2="170" stroke={PAL.ink} strokeWidth="5" opacity=".7" />
      <path d="M105,250 L120,300 L350,300" fill="none" stroke={PAL.ink} strokeWidth="10" />
      {[140, 330].map((x) => <g key={x}><circle cx={x} cy="330" r="26" fill="#fff" /><circle cx={x} cy="330" r="18" fill={PAL.ink} /><circle cx={x} cy="330" r="6" fill={PAL.brass} /></g>)}
      <rect x="296" y="196" width="54" height="40" rx="4" fill={PAL.vermilion} stroke="#fff" strokeWidth="4" />
    </g>
  </svg>
);

/* 会员卡（代码绘制） */
const Card: React.FC<{f: number}> = ({f}) => {
  const t = iv(f, 16, K.card), inW = iv(f, K.card + 4, K.card + 14);
  if (f < 16 || inW >= 1) return null;
  const x = interpolate(t, [0, 1], [700, 330]) + inW * -20, y = interpolate(t, [0, 1], [300, 980]) - Math.sin(t * Math.PI) * 120 + inW * 40;
  return (<div style={{position: 'absolute', left: x, top: y, width: 200, height: 126, borderRadius: 14, transform: `rotate(${(1 - t) * 260 - 12}deg) scale(${1 - inW * 0.7})`, opacity: 1 - inW,
    background: `linear-gradient(135deg, ${PAL.ink}, #2F5A55)`, border: '5px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,.3)'}}>
    <div style={{position: 'absolute', left: 14, top: 12, width: 34, height: 26, borderRadius: 5, background: PAL.brass}} />
    <div style={{position: 'absolute', right: 14, bottom: 12, fontFamily: SERIF, fontWeight: 900, fontSize: 26, color: PAL.paper, letterSpacing: 4}}>会员</div>
  </div>);
};

/* 表情贴纸徽章：表情替换 */
const Badge: React.FC<{src: string; x: number; y: number; f: number; o: number; flip?: boolean}> = ({src, x, y, f, o, flip}) => {
  const s = spring({frame: f, fps: 30, config: {damping: 10, stiffness: 200}});
  return (<div style={{position: 'absolute', left: x - 95, top: y - 95, width: 190, height: 190, borderRadius: '50%', overflow: 'hidden', background: PAL.paper, border: '7px solid #fff', boxShadow: `0 0 0 3px ${PAL.ink}, 0 10px 14px rgba(0,0,0,.28)`, transform: `scale(${s * o})`}}>
    <Img src={g4(src)} style={{position: 'absolute', width: 230, left: -20, top: -6, transform: flip ? 'scaleX(-1)' : undefined}} /></div>);
};

/* 故事层（设计坐标 1080x1920） */
const Story: React.FC<{f: number; raw: number; morphT?: (i: number) => number}> = ({f, raw, morphT}) => {
  const bob = (p: number) => Math.sin((f + p) / 6) * 4;
  const xlPoint = f >= K.save && f < K.mmIn; // 小林“省了”时得意一指
  const mmX = interpolate(twos(f), [K.mmIn, K.mmIn + 16], [1200, 760], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const mmPoint = f >= K.point;
  const nGoods = GOODS.filter((g) => f >= g.t).length;
  const xlExpr = f < K.save ? 'xl_neutral.png' : f < 214 ? 'xl_happy.png' : 'xl_surprised.png';
  const mmExpr = f < K.point ? 'mm_neutral.png' : 'mm_happy.png';
  return (<AbsoluteFill>
    <Img src={g2('bg.jpg')} style={{position: 'absolute', left: -100, top: 0, width: 1280, height: 1920, filter: 'blur(3px) saturate(.9)', transform: `scale(${1.04 + raw * 0.0002})`}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(241,228,204,.15), rgba(32,60,58,.28))'}} />
    {/* 地面阴影 */}
    <div style={{position: 'absolute', left: 90, top: 1490, width: 900, height: 60, borderRadius: '50%', background: 'rgba(40,25,10,.18)', filter: 'blur(10px)'}} />
    <Cart swell={nGoods / 5} />
    {GOODS.map((g, i) => {
      const lf = f - g.t; if (lf < 0) return null;
      const mt = morphT ? morphT(i) : 0; if (mt > 0) return null;
      const sp = spring({frame: lf, fps: 30, config: {damping: 11, stiffness: 170}});
      return <Img key={i} src={g2(`${g.src}.png`)} style={{position: 'absolute', left: g.x + (1 - sp) * 300, top: g.b - gh(g) - (1 - sp) * 600, width: g.w, transform: `rotate(${g.rot + (1 - sp) * 90}deg)`, filter: sticker}} />;
    })}
    {/* 小林：站立↔指向（二拍切换），呼吸起伏 */}
    {NEWC ? <div style={{position: 'absolute', inset: 0, filter: sticker}}><PoseCharacter set={xlP as unknown as PoseSet} f={raw} x={230} y={1515} height={880}
      track={[{at: 0, pose: 'stand_neutral'}, {at: K.save, pose: 'point'}, {at: K.mmIn, pose: 'happy'}, {at: 214, pose: 'surprised'}]} /></div>
    : <Img src={g4(xlPoint ? 'xl_point.png' : 'xl_stand.png')} style={{position: 'absolute', left: xlPoint ? 20 : 50, top: 620 + bob(0), height: 900, filter: sticker}} />}
    {/* 林妈妈：右侧入画，镜像后指向购物车 */}
    {NEWC && f >= K.mmIn && <div style={{position: 'absolute', inset: 0, filter: sticker}}><PoseCharacter set={mmP as unknown as PoseSet} f={raw} x={860} y={1520} height={860} flip
      walk={{fromX: 1260, start: K.mmIn, dur: 16}} track={[{at: 0, pose: 'stand_neutral'}, {at: K.point, pose: 'point'}, {at: K.point + 40, pose: 'happy'}]} /></div>}
    {!NEWC && f >= K.mmIn && <Img src={g4(mmPoint ? 'mm_point.png' : 'mm_stand.png')} style={{position: 'absolute', left: mmX - (mmPoint ? 170 : 0), top: 640 + bob(9), height: 880, transform: 'scaleX(-1)', filter: sticker}} />}
    {/* 表情替换徽章 */}
    {!NEWC && <Badge src={xlExpr} x={330} y={560} f={f - (f < K.save ? 4 : f < 214 ? K.save : 214)} o={f < 206 ? 1 : 0} />}
    {!NEWC && f >= K.mmIn + 10 && f < 206 && <Badge src={mmExpr} x={930} y={560} f={f - (f < K.point ? K.mmIn + 10 : K.point)} o={1} flip />}
    <Card f={f} />
    {/* 已省 ¥64 小票贴纸 */}
    {f >= K.save && f < K.mmIn + 6 && <div style={{position: 'absolute', left: 330, top: 840, padding: '12px 22px', background: '#FFFDF6', borderRadius: 8, border: '5px solid #fff', boxShadow: `0 0 0 3px ${PAL.ink}, 0 10px 14px rgba(0,0,0,.25)`, fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: PAL.ink, transform: `rotate(-6deg) scale(${spring({frame: f - K.save, fps: 30, config: {damping: 9}})})`}}>已省 <span style={{color: PAL.vermilion}}>¥64</span></div>}
  </AbsoluteFill>);
};
const fit = (_r: Rect) => { const k = WIN.w / CROP.w; return {k, ox: -CROP.x * k, oy: -CROP.y * k}; };

/* 通政使轻量出场：圆形观察徽（S1 角标） */
const TzsMark: React.FC<{f: number; o: number}> = ({f, o}) => (o <= 0 ? null :
  <div style={{position: 'absolute', left: 120, top: 250, width: 230, height: 230, opacity: o, transform: `scale(${0.6 + o * 0.4}) rotate(${(1 - o) * -20}deg)`}}>
    <div style={{position: 'absolute', inset: 24, borderRadius: '50%', overflow: 'hidden', background: PAL.paper}}>
      <Img src={g4('tzs_avatar.png')} style={{position: 'absolute', width: 182, left: 0, top: 0}} /></div>
    <Img src={g4(`ring${1 + (Math.floor(f / 4) % 3)}.png`)} style={{position: 'absolute', inset: 0, width: 230, height: 230, objectFit: 'contain'}} />
    <div style={{position: 'absolute', left: 40, top: 214, padding: '4px 16px', background: PAL.ink, color: PAL.paper, fontFamily: SERIF, fontWeight: 900, fontSize: 26, borderRadius: 4, letterSpacing: 4}}>通政使</div>
  </div>);

export const G4Clip: React.FC<{layout?: string; noTzs?: boolean; noVo?: boolean; newChars?: boolean}> = ({layout = 'C', noTzs = false, noVo = false, newChars = false}) => {
  NEWC = newChars;
  L = LAYOUTS[layout]; WIN = L.win; CROP = L.crop; const CD = L.card;
  const raw = useCurrentFrame();
  const f = twos(raw);
  const toS2 = iv(raw, K.s2, K.s2 + 12) * (1 - iv(raw, K.collapse, K.collapse + 12));
  const inS2 = toS2 > 0.001;
  const r: Rect = {x: WIN.x * toS2, y: WIN.y * toS2, w: 1080 + (WIN.w - 1080) * toS2, h: 1920 + (WIN.h - 1920) * toS2};
  const mt = (i: number) => (raw >= K.collapse ? 0 : iv(raw, K.morph + i * 4, K.morph + 14 + i * 4));
  const {k, ox, oy} = fit(WIN);
  const VW = {x: CROP.x * toS2, y: CROP.y * toS2, w: 1080 + (CROP.w - 1080) * toS2};
  const k2 = r.w / VW.w, ox2 = -VW.x * k2, oy2 = -VW.y * k2;
  const barX = 280, barW = 440, base = (800 / 1036) * barW, seg = barW * (47.2 / 1036);
  const cnt = Math.round(800 + GOODS.reduce((a, _, i) => a + mt(i) * 47.2, 0));
  const s1 = (raw >= K.s1 && raw < K.s2) || raw >= K.collapse + 8;
  const tzsO = raw < K.collapse ? iv(raw, K.s1, K.s1 + 10) * (1 - iv(raw, K.tzsOut, K.tzsOut + 8)) : iv(raw, K.collapse + 10, K.collapse + 20);
  const capO = (i: number) => iv(raw, V[i].from - 2, V[i].from + 4) * (1 - iv(raw, V[i].from + V[i].sec * 30 + 4, V[i].from + V[i].sec * 30 + 9));
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 25%, #F6ECD9 0%, #EAD9BA 100%)', overflow: 'hidden'}}>
      {inS2 && <svg width={1080} height={420} viewBox="0 0 1080 420" style={{position: 'absolute', left: 0, top: 1560, opacity: iv(toS2, 0.4, 1)}}>
        <path d="M0,90 C180,40 330,120 540,70 C760,20 900,100 1080,60 L1080,420 L0,420Z" fill={PAL.teal} opacity=".35" />
        <path d="M0,150 C200,110 380,180 560,140 C760,100 920,170 1080,130 L1080,420 L0,420Z" fill="#C9D5C4" />
        <path d="M0,150 C200,110 380,180 560,140 C760,100 920,170 1080,130" fill="none" stroke="#FFFDF6" strokeWidth="8" />
        <path d="M0,250 C220,215 420,275 600,240 C800,205 940,262 1080,230 L1080,420 L0,420Z" fill={PAL.ink} opacity=".85" /></svg>}
      {inS2 && L.title && <Title o={iv(toS2, 0.7, 1)} text={<>单价便宜了，<span style={{color: PAL.vermilion}}>总账</span>呢？</>} sub="通政使 · 观察记录 E001" />}
      <ObservationStage state={inS2 && toS2 > 0.5 ? 'S2' : 'S0'} r={r} f={f} frameO={toS2}>
        <div style={{position: 'absolute', left: ox2, top: oy2, width: 1080, height: 1920, transform: `scale(${k2})`, transformOrigin: '0 0'}}>
          <Story f={f} raw={raw} morphT={mt} />
        </div>
      </ObservationStage>
      {/* 数据卡：独立区块（A/C）或挂在墙面空白处的纸签（B），不压故事内容 */}
      {inS2 && (() => { const tag = !!L.tag; const ct = !!L.cardTitle; const top0 = ct ? 64 : 0;
        return <div style={{position: 'absolute', left: CD.x, top: CD.y, width: CD.w, height: CD.h, opacity: iv(toS2, 0.6, 1), transform: `translateY(${(1 - iv(toS2, 0.6, 1)) * 30}px) rotate(${tag ? -2 : 0}deg)`, background: '#FFFDF6', borderRadius: 6, boxShadow: tag ? '0 8px 14px rgba(40,25,10,.35)' : '0 8px 0 rgba(80,52,24,.14), 0 14px 22px rgba(80,52,24,.12)'}}>
        {tag && <><div style={{position: 'absolute', left: CD.w / 2 - 1, top: -60, width: 2, height: 60, background: PAL.ink}} /><div style={{position: 'absolute', left: CD.w / 2 - 9, top: -8, width: 18, height: 18, borderRadius: 9, background: PAL.brass, border: '3px solid #FFFDF6'}} /></>}
        {ct && <div style={{position: 'absolute', left: 32, top: 18, fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAL.ink}}>单价便宜了，<span style={{color: PAL.vermilion}}>总账</span>呢？</div>}
        <div style={{position: 'absolute', left: 32, top: top0 + (tag ? 18 : 16), fontFamily: SANS, fontSize: 22, color: PAL.ink, opacity: .7}}>{tag ? '每月支出（示意）' : '小林每月支出（示意） · 上月 ¥800'}</div>
        <div style={{position: 'absolute', left: 30, top: top0 + (tag ? 46 : 42), fontFamily: SERIF, fontWeight: 900, fontSize: tag ? 64 : 60, lineHeight: 1, color: PAL.ink, fontVariantNumeric: 'tabular-nums'}}>¥{cnt}</div>
        <div style={{position: 'absolute', right: 30, top: top0 + (tag ? 54 : 46), fontFamily: SERIF, fontWeight: 900, fontSize: tag ? 44 : 50, color: PAL.vermilion}}>+{cnt - 800}</div>
        <div style={{position: 'absolute', left: tag ? 32 : 300, right: tag ? 32 : 170, top: top0 + (tag ? 136 : 58), height: tag ? 28 : 36, background: '#EADFCB', borderRadius: 4, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, height: '100%', width: `${(800 / 1036) * 100}%`, background: PAL.teal}} />
          {GOODS.map((_, i) => <div key={i} style={{position: 'absolute', left: `${((800 + i * 47.2) / 1036) * 100}%`, top: 0, height: '100%', width: `${(47.2 * mt(i) / 1036) * 100}%`, background: i % 2 ? PAL.copper : PAL.vermilion, borderLeft: '2px solid #FFFDF6'}} />)}
        </div></div>; })()}
      {/* 物体变形：商品从车里飞出 -> 数据色块（画风切换：纸雕实物 -> 数据图形） */}
      {GOODS.map((g, i) => {
        const t = mt(i); if (t <= 0 || t >= 1) return null;
        const sx = WIN.x + ox + (g.x + g.w / 2) * k, sy = WIN.y + oy + (g.b - gh(g) / 2) * k;
        const bx0 = CD.x + (L.tag ? 32 : 300), bw = CD.w - (L.tag ? 64 : 470); const tx = bx0 + bw * ((800 + (i + 0.5) * 47.2) / 1036), ty = CD.y + (L.cardTitle ? 64 : 0) + (L.tag ? 150 : 76);
        const x = sx + (tx - sx) * t, y = sy + (ty - sy) * t - Math.sin(t * Math.PI) * 220, s = (1 - t) * k + t * 0.15;
        const pix = t > 0.55; // 后半程碎成像素块
        return pix ? <div key={i} style={{position: 'absolute', left: x - 18, top: y - 18, width: 36, height: 36, background: i % 2 ? PAL.copper : PAL.vermilion, boxShadow: `14px 0 0 ${PAL.paper}, 0 14px 0 ${PAL.teal}`, imageRendering: 'pixelated'}} />
          : <Img key={i} src={g2(`${g.src}.png`)} style={{position: 'absolute', left: x - (g.w * s) / 2, top: y - (gh(g) * s) / 2, width: g.w * s, transform: `rotate(${t * 120}deg)`}} />;
      })}
      {inS2 && <ObsSeal f={raw - K.seal} x={L.sealX} y={L.sealY} size={130} />}
      {/* 观察环：S2 展开前扫一下购物车 */}
      {raw >= K.s2 - 14 && raw < K.s2 + 10 && <BrassRing f={raw} x={590} y={1250} size={380} o={iv(raw, K.s2 - 14, K.s2 - 6) * (1 - iv(raw, K.s2 + 2, K.s2 + 10))} scan={iv(raw, K.s2 - 10, K.s2 + 6)} />}
      {s1 && <CornerMarks o={raw < K.s2 ? iv(raw, K.s1, K.s1 + 8) : iv(raw, K.collapse + 8, K.collapse + 16)} />}
      {!noTzs && <TzsMark f={raw} o={tzsO} />}
      {/* 字幕：一句一条，跟随配音 */}
      <Caption o={capO(0)} y={1400} parts={['办了', ['会员卡'], '，首月', ['省64块']]} />
      <Caption o={capO(1)} y={1400} parts={['林妈妈：', ['会员价'], '更便宜']} />
      <Caption o={capO(2) * (1 - toS2 * 0.0)} y={toS2 > 0.5 ? L.capY : 1400} dark={toS2 > 0.5} parts={['这个月反而', ['多花两百多']]} />
      {raw >= K.collapse + 12 && <Caption o={iv(raw, K.collapse + 12, K.collapse + 18)} y={1400} parts={['省了', ['单价'], '，多了', ['总支出']]} />}
      {!noVo && V.map((v, i) => <Sequence key={i} from={v.from}><Audio src={g4(`vo${i}.mp3`)} /></Sequence>)}
    </AbsoluteFill>
  );
};
