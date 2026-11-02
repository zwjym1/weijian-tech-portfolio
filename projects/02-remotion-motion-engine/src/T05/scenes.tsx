import React from 'react';
import {Img, interpolate} from 'remotion';
import {FONT_SANS, FONT_SERIF} from '../core/tokens';
import {Card, Prop, Hl, D, ez, exz, sp, q, numStyle, RED, INK, COP, clampO, pose} from './kit';
import {KW, lf, DUR, HITS, W} from './timeline';

type P = {f: number};
const Tag: React.FC<{x: number; y: number; w?: number; text: string; color?: string; size?: number; f: number; at: number; bg?: string; fg?: string; z?: number; rot?: number; outAt?: number}> = ({x, y, w, text, f, at, bg = INK, fg = '#F6EBD3', size = 32, z = 40, rot = 0, outAt}) => {
  const p = sp(q(f), at, 10, 220); if (f < at) return null; const eo = outAt !== undefined && f >= outAt ? exz(f, outAt, outAt + 10) : 0; if (eo >= 1) return null;
  return <div style={{position: 'absolute', left: x, top: y, width: w, zIndex: z, transform: `translateY(${-eo * 14}px) scale(${0.6 + 0.4 * p}) rotate(${rot}deg)`, opacity: Math.min(1, p * 2) * (1 - eo), transformOrigin: '0% 50%', padding: '8px 22px 10px', background: bg, color: fg, borderRadius: 10,
    fontFamily: FONT_SANS, fontWeight: 900, fontSize: size, whiteSpace: 'nowrap', boxShadow: '0 8px 16px rgba(32,60,58,.22)', display: 'inline-block'}}>{text}</div>;
};
const Num: React.FC<{x: number; y: number; w: number; text: string; size: number; color: string; f: number; at: number; z?: number; scale0?: number}> = ({x, y, w, text, size, color, f, at, z = 50, scale0 = 0.6}) => {
  if (f < at) return null; const p = sp(f, at, 10, 190);
  return <div style={{position: 'absolute', left: x, top: y, width: w, textAlign: 'center', zIndex: z, transform: `scale(${scale0 + (1 - scale0) * p})`, opacity: Math.min(1, p * 2.5), ...numStyle(size, color)}}>{text}</div>;
};
const Label: React.FC<{x: number; y: number; w: number; text: string; color: string; size: number; f: number; at: number; tagImg?: string; rot?: number; strikeAt?: number; z?: number}> = ({x, y, w, text, color, size, f, at, tagImg = 'D13a_nametag_white', rot = 0, strikeAt, z = 30}) => {
  const ps = pose(f, at, 'drop'); if (ps.op <= 0) return null;
  const h = w * 160 / 220;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, zIndex: z, opacity: ps.op, transform: `translateY(${ps.ty}px) rotate(${rot}deg) scale(${ps.sc})`}}>
    <Img src={D(tagImg + '_shadow')} style={{position: 'absolute', left: 0, top: 6, width: '100%'}} />
    <Img src={D(tagImg)} style={{position: 'absolute', left: 0, top: 0, width: '100%'}} />
    <div style={{position: 'absolute', left: w * 0.24, top: h * 0.55, width: w * 0.7, height: h * 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_SANS, fontWeight: 900, fontSize: size, color, whiteSpace: 'nowrap'}}>{text}</div>
    {strikeAt !== undefined && f >= strikeAt && <div style={{position: 'absolute', left: w * 0.2, top: h * 0.7, width: w * 0.76, height: 22, clipPath: `inset(0 ${(1 - ez(f, strikeAt, strikeAt + 8)) * 100}% 0 0)`, mixBlendMode: 'multiply'}}>
      <Img src={D('D04c_highlighter')} style={{width: '100%', height: '100%'}} /></div>}
  </div>;
};
const Under: React.FC<{x: number; y: number; w: number; h?: number; f: number; at: number; z?: number}> = ({x, y, w, h = 30, f, at, z = 35}) => {
  if (f < at) return null; const p = ez(f, at, at + 10);
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, zIndex: z, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, mixBlendMode: 'multiply'}}><Img src={D('D04c_highlighter')} style={{width: '100%', height: '100%'}} /><Img src={D('D04c_highlighter')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} /></div>;
};

// ───────── S1 L1：第0帧会员卡已在滑动 → 翻面折成借条 ─────────
export const S1: React.FC<P> = ({f}) => {
  const n = 1; const flip = KW(n, '其实不是卡'); const a1 = lf(n, HITS['A1 借条的借条'].onset); const out = DUR(n);
  const p = ez(f, 0, 22);
  const cx = interpolate(p, [0, 1], [960, 540]), cy = interpolate(p, [0, 1], [1010, 780]);
  const rot = interpolate(p, [0, 1], [-8, 0]) + (f > 22 && f < flip ? Math.sin(f / 11) * 1.1 : 0);
  const tF = q(f);
  const sx = tF < flip ? 1 : tF < flip + 4 ? 1 - (tF - flip) / 4 : tF < flip + 8 ? (tF - flip - 4) / 4 : 1;
  const isIou = tF >= flip + 4;
  const settle = f >= a1 && f < a1 + 10 ? Math.sin((f - a1) / 10 * Math.PI) * 7 : 0;
  const ex = f >= out ? exz(f, out, out + 10) : 0;
  const tagOn = f >= KW(n, '两千'); const tagFall = f >= flip ? ez(f, flip, flip + 8) : 0;
  return <>
    <div style={{position: 'absolute', left: cx - (isIou ? 320 : 351) - ex * 900, top: cy - (isIou ? 210 : 218) + settle, width: isIou ? 640 : 702, zIndex: 20, opacity: 1 - ex * 0.9,
      transform: `rotate(${isIou ? 0 : rot}deg) scaleX(${sx})`, filter: f < 22 ? `blur(${(1 - p) * 7}px)` : undefined}}>
      {isIou ? <><Img src={D('D03b_iou_folded_shadow')} style={{position: 'absolute', top: 6, width: '100%'}} /><Img src={D('D03b_iou_folded')} style={{position: 'relative', width: '100%', display: 'block'}} /></>
        : <><Img src={D('D02a_card_green_front_shadow')} style={{position: 'absolute', top: 6, width: '100%'}} /><Img src={D('D02a_card_green_front')} style={{position: 'relative', width: '100%', display: 'block'}} /></>}
    </div>
    {tagOn && tagFall < 1 && <div style={{position: 'absolute', left: cx + 100 - ex * 900, top: cy - 330 + tagFall * 500, width: 210, zIndex: 25, opacity: 1 - tagFall, transform: `rotate(${8 + tagFall * 40}deg) scale(${0.7 + 0.3 * sp(f, KW(n, '两千'), 9, 230)})`}}>
      <Img src={D('D13b_nametag_copper_shadow')} style={{position: 'absolute', top: 6, width: '100%'}} /><Img src={D('D13b_nametag_copper')} style={{position: 'relative', width: '100%', display: 'block'}} />
      <div style={{position: 'absolute', left: 36, top: 82, width: 160, textAlign: 'center', fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 33, color: '#FFF8E6', lineHeight: '56px'}}>2000元</div></div>}
  </>;
};

// ───────── S2 L2：钱交出去 → 收入划掉 → 欠你的服务 + R05 ─────────
export const S2: React.FC<P> = ({f}) => {
  const n = 2; const out = DUR(n); const k = KW(n, '交出去'); const sh = KW(n, '收入'); const qi = KW(n, '欠你的服务');
  const handIn = pose(f, k - 12, 'right', k + 26, 'fade'); const drop = f >= k + 4;
  const coinT = ez(f, k + 4, k + 20);
  const hand = handIn;
  return <>
    <Prop f={f} n="D03b_iou_folded" x={84} y={345} w={560} rot={-1.5} inAt={2} outAt={out} />
    {hand.op > 0 && <div style={{position: 'absolute', left: 170 + hand.tx, top: 280, width: 380, zIndex: 28, opacity: hand.op}}>
      <Img src={D((drop ? 'D18b_hand_drop' : 'D18a_hand_coin') + '_shadow')} style={{position: 'absolute', top: 6, width: '100%'}} />
      <Img src={D(drop ? 'D18b_hand_drop' : 'D18a_hand_coin')} style={{position: 'relative', width: '100%', display: 'block'}} />
    </div>}
    {f >= k + 4 && coinT < 1 && <div style={{position: 'absolute', left: 340 - 32 * (1 - coinT) * 0 - 30, top: 370 + coinT * 150, width: 70 * (1 - coinT * 0.55), opacity: 1 - Math.max(0, coinT - 0.8) * 5, zIndex: 27}}><Img src={D('D08a_coin')} style={{width: '100%'}} /></div>}
    <Label f={f} x={655} y={350} w={230} text="收入" color={INK} size={40} at={sh - 10} strikeAt={sh + 14} rot={3} />
    <Label f={f} x={640} y={500} w={270} text="欠你的服务" color={RED} size={32} at={qi - 2} rot={-3} z={34} />
    <Card f={f} x={84} y={760} w={826} parts={[{n: 'R05_iresearch_body', hl: [{k: 'R05_debt', at: qi + 10}]}]} tag={['艾瑞咨询 · 2024 年中国健身行业经营白皮书']} tilt={0.8} inAt={KW(n, '记下的') - 6} outAt={out} kind="br" />
  </>;
};

// ───────── S3 L3：日历 7 格 → 七日内 + R01 ─────────
const CAL = {x: 72, y: 470, w: 836};
export const calCell = (k: number) => ({x: CAL.x + (26 + 118 * k) * CAL.w / 880, w: 112 * CAL.w / 880 * 1.0, y: CAL.y + 16 * CAL.w / 880});
export const S3: React.FC<P> = ({f}) => {
  const n = 3; const out = DUR(n); const a2 = lf(n, HITS['A2 七天之内'].onset);
  const sc = CAL.w / 880; const cells = [0, 1, 2, 3, 4, 5, 6];
  return <>
    <Num x={240} y={345} w={600} text="7 天" size={130} color={RED} f={f} at={a2 - 2} />
    <Prop f={f} n="D06a_calendar_strip" x={CAL.x} y={CAL.y} w={CAL.w} inAt={2} outAt={out} rot={-0.5} kind="rise" />
    {cells.map(k => { const at = a2 - (6 - k) * 3; if (f < at) return null; const c = calCell(k); const p = sp(q(f), at, 12, 240);
      return <div key={k} style={{position: 'absolute', left: c.x, top: c.y + 4, width: c.w, height: 107 * sc * 1.15, zIndex: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 2),
        fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 54, color: k === 6 ? RED : INK, WebkitTextStroke: 0}}>{k + 1}</div>; })}
    {f >= a2 && <Under x={calCell(6).x - 6} y={calCell(6).y + 86} w={calCell(6).w + 12} h={26} f={f} at={a2 + 2} z={32} />}
    <Card f={f} x={84} y={640} w={826} parts={[{n: 'R01_gov_body', hl: [{k: 'R01_ri', at: a2 - 2, zoom: false}, {k: 'R01_benjin', at: KW(n, '本金')}]}]} tag={['《预付式消费纠纷司法解释》第十四条 · 2025-05-01 起施行', '人民法院报 2025-03-15 · 中国政府网转载']} tilt={-0.8} inAt={6} outAt={out} kind="br" />
  </>;
};

// ───────── S4 L4：格子撕下 → 你的会员卡变借条 → 金币沿弧线滑向健身房 → 卷帘落下（停点）─────────
export const S4: React.FC<P> = ({f}) => {
  const n = 4; const out = DUR(n); const sc = CAL.w / 880; const real = lf(n, HITS['B1 借出去了'].onset);
  const cIn = lf(n, 19.55), flip = lf(n, 20.1), fly0 = lf(n, 20.5);
  const tF = q(f);
  const cardP = ez(tF, cIn, cIn + 10);
  const sx = tF < flip ? 1 : tF < flip + 4 ? 1 - (tF - flip) / 4 : tF < flip + 8 ? (tF - flip - 4) / 4 : 1;
  const isIou = tF >= flip + 4;
  const u = ez(f, fly0, real); const cx = 330 + 500 * u, cy = 800 - 250 * Math.sin(u * Math.PI);
  const sh = f < real ? 'a' : f < real + 3 ? 'b' : 'c';
  const bounce = f >= real && f < real + 12 ? Math.sin((f - real) / 12 * Math.PI) * 10 : 0;
  const ex = f >= out ? exz(f, out, out + 10) : 0;
  const op = 1 - ex;
  const breathe = f > real + 14 && f < out ? 1 + 0.006 * Math.sin((f - real) / 10) : 1;
  return <>
    {f < 40 && [0, 1, 2, 3, 4, 5, 6].map(k => { const c = calCell(k); const t = Math.max(0, q(f) - 2 - k * 3); const y = c.y + 0.9 * t * t, r = t * (k % 2 ? 5 : -6);
      return <div key={k} style={{position: 'absolute', left: c.x + t * (k - 3) * 1.5, top: y, width: c.w + 8, height: 125 * sc, zIndex: 30, transform: `rotate(${r}deg)`, opacity: 1 - Math.min(1, t / 26)}}>
        <Img src={D('D06_cell' + (k + 1))} style={{width: '100%', height: '100%'}} />
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 54, color: k === 6 ? RED : INK}}>{k + 1}</div></div>; })}
    <Card f={f} x={84} y={640} w={826} parts={[{n: 'R01_gov_body'}]} tag={['《预付式消费纠纷司法解释》第十四条 · 2025-05-01 起施行', '人民法院报 2025-03-15 · 中国政府网转载']} tilt={-0.8} inAt={-99} outAt={0} kind="still" exit="down" />
    <div style={{position: 'absolute', inset: 0, transform: `translateY(120px) scale(${breathe * 1.25})`, transformOrigin: '540px 800px', opacity: op}}>
      {/* 你这边：会员卡 → 借条 */}
      {f >= cIn && <div style={{position: 'absolute', left: 150 - (1 - cardP) * 560, top: 700 + bounce * 0.5, width: 380, zIndex: 20, opacity: Math.min(1, cardP * 3), transform: `scaleX(${sx}) rotate(${isIou ? -1 : -4 * (1 - cardP)}deg)`}}>
        {isIou ? <><Img src={D('D03b_iou_folded_shadow')} style={{position: 'absolute', top: 6, width: '100%'}} /><Img src={D('D03b_iou_folded')} style={{position: 'relative', width: '100%', display: 'block'}} /><div style={{position: 'absolute', left: '9%', top: '14%', fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 48, color: INK, letterSpacing: 6}}>借 条</div><div style={{position: 'absolute', left: '9%', right: '9%', top: '52%', height: 4, background: 'rgba(60,45,30,.35)', boxShadow: '0 26px 0 rgba(60,45,30,.35), 0 52px 0 rgba(60,45,30,.35)'}} /></>
          : <><Img src={D('D02a_card_green_front_shadow')} style={{position: 'absolute', top: 6, width: '100%'}} /><Img src={D('D02a_card_green_front')} style={{position: 'relative', width: '100%', display: 'block'}} /></>}</div>}
      <Label f={f} x={150} y={560} w={190} text="你" color={INK} size={44} at={cIn + 6} rot={-4} />
      {/* 健身房那边：卷帘 */}
      <Prop f={f} n={'D09' + sh + '_shutter_' + (sh === 'a' ? 'open' : sh === 'b' ? 'half' : 'closed')} x={650} y={690 + bounce * 0.4} w={290} inAt={cIn + 4} kind="drop" hold={f > cIn + 20} z={19} />
      <Label f={f} x={690} y={520} w={230} text="健身房" color={INK} size={34} at={cIn + 10} rot={3} />
      {/* 金币弧线（虚线轨迹 + 金币） */}
      {f >= fly0 && <svg width={1080} height={1000} style={{position: 'absolute', left: 0, top: 0, zIndex: 18}}><path d="M 330 800 Q 580 330 830 800" fill="none" stroke={INK} strokeOpacity={0.45} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" pathLength={1} strokeDashoffset={0} style={{clipPath: `inset(0 ${(1 - u) * 100}% 0 0)`}} /></svg>}
      {f >= fly0 && u < 1 && <div style={{position: 'absolute', left: cx - 55, top: cy - 60, width: 110 * (1 - u * 0.25), zIndex: 40, transform: `rotate(${u * 300}deg)`}}><Img src={D('D08b_coin_stack3')} style={{width: '100%'}} /></div>}
      {f >= real && <div style={{position: 'absolute', left: 735, top: 960, width: 150, zIndex: 25, opacity: Math.min(1, sp(f, real + 4) * 3), transform: `scale(${0.6 + 0.4 * sp(f, real + 4, 9, 200)})`}}><Img src={D('D08c_coin_pile_shadow')} style={{position: 'absolute', top: 5, width: '100%'}} /><Img src={D('D08c_coin_pile')} style={{position: 'relative', width: '100%'}} /></div>}
    </div>
  </>;
};

// ───────── S5 L5：R02 案例 + 法槌 + 2000 / 12 次 ─────────
export const S5: React.FC<P> = ({f}) => {
  const n = 5; const out = DUR(n); const a = KW(n, '两千'), b = KW(n, '十二次'); const land = 10;
  const hit1 = land + 6, hit2 = land + 15; const down = (f >= hit1 && f < hit1 + 4) || (f >= hit2 && f < hit2 + 4);
  return <>
    <Card f={f} x={84} y={340} w={826} parts={[{n: 'R02_court_body', hl: [{k: 'R02_fee', at: a}, {k: 'R02_12', at: b}]}]} tag={['最高人民法院典型案例 · 案例三 · 2025-03-14']} tilt={-1.1} inAt={2} outAt={out} kind="br" zoom={false} />
    <Prop f={f} n={down ? 'D07b_gavel_down' : 'D07a_gavel_up'} x={96} y={800} w={230} rot={-6} inAt={land} outAt={out} kind="drop" />
    {f >= a && <div style={{position: 'absolute', left: 340, top: 800, width: 580, zIndex: 40, opacity: Math.min(1, sp(f, a) * 2), transform: `translateX(${(1 - sp(f, a)) * 60}px)`, display: 'flex', alignItems: 'baseline', gap: 18, ...numStyle(96, INK)}}><span>2000</span><span style={{fontSize: 56}}>元的卡</span></div>}
    {f >= b && <div style={{position: 'absolute', left: 340, top: 940, width: 580, zIndex: 41, opacity: Math.min(1, sp(f, b) * 2), transform: `scale(${0.7 + 0.3 * sp(f, b)})`, transformOrigin: '0% 60%', display: 'flex', alignItems: 'baseline', gap: 14, ...numStyle(150, COP)}}><span style={{fontSize: 56, color: INK}}>才用了</span><span>12</span><span style={{fontSize: 70}}>次</span></div>}
  </>;
};

// ───────── S6 L6：R03 → “退 1600”（soft_boom）→ 静止 ─────────
export const S6: React.FC<P> = ({f}) => {
  const n = 6; const a3 = lf(n, HITS['A3 退一千六'].onset); const fadeAt = a3 - 8;
  const land = f >= a3 ? sp(f, a3, 9, 200) : 0;
  return <>
    <Card f={f} x={84} y={440} w={826} parts={[{n: 'R03_court_body', hl: [{k: 'R03_1600', at: KW(n, '法院判') + 10}]}]} tag={['最高人民法院典型案例 · 案例三 · 2025-03-14']} tilt={0.9} inAt={2} outAt={fadeAt} exit="fade" kind="right" />
    {f >= a3 && <div style={{position: 'absolute', left: 60, top: 700, width: 960, textAlign: 'center', zIndex: 50, opacity: Math.min(1, land * 3), transform: `scale(${1.7 - 0.7 * land}) translateY(${f < a3 + 3 ? -30 : 0}px)`, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 16, ...numStyle(168, RED)}}><span style={{fontSize: 110}}>退</span><span>1600</span><span style={{fontSize: 80}}>元</span></div>}
  </>;
};

// ───────── S7 L7：缩成标签 → 清空 → R04 + 放大镜 → 1.3% ─────────
export const S7: React.FC<P> = ({f}) => {
  const n = 7; const out = DUR(n); const a4 = lf(n, HITS['A4 百分之一点三'].onset); const r4 = KW(n, '艾瑞咨询') - 8;
  const sh = ez(f, 2, 14);
  const nIn = ez(f, a4 - 16, a4 - 3); // 1.3% 直接淡入，不滚动；口播起音(a4)前已完全稳定
  const mp = ez(q(f), r4 + 10, a4 - 4);
  return <>
    {f < 14 && <div style={{position: 'absolute', left: 60, top: 700, width: 960, textAlign: 'center', zIndex: 50, opacity: 1 - sh, transform: `translate(${-330 * sh}px, ${-330 * sh}px) scale(${1 - 0.7 * sh})`, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 16, ...numStyle(168, RED)}}><span style={{fontSize: 110}}>退</span><span>1600</span><span style={{fontSize: 80}}>元</span></div>}
    <Tag x={84} y={348} text="官司打赢了 · 拿回 1600" f={f} at={10} z={42} size={32} outAt={r4 - 14} />
    <Card f={f} x={84} y={430} w={826} parts={[{n: 'R04_title_strip'}, {n: 'R04_local_chart', box: {x: 0.2385, y: 0.4367, w: 0.1190, h: 0.1138, at: a4}}]} tag={['艾瑞咨询 · 2024 年中国健身行业经营白皮书（2023 年数据）· 局部放大']} tilt={-0.5} inAt={r4} outAt={out} kind="rise" veil={false} />
    {f >= r4 + 10 && f < a4 - 2 && <Prop f={f} n="D14_magnifier" x={640 - 420 * mp} y={560 + 160 * mp} w={190} rot={-12} hold shadow extra={{opacity: Math.min(1, (a4 - 2 - f) / 6)}} />}
    {f >= a4 - 16 && <div style={{position: 'absolute', left: 140, top: 1050, width: 800, textAlign: 'center', zIndex: 50, ...numStyle(150, RED), opacity: nIn * (f >= out ? Math.max(0, 1 - (f - out) / 8) : 1), transform: `scale(${0.88 + 0.12 * nIn})`}}>1.3%</div>}
    {f >= a4 + 4 && <Tag x={84} y={1075} text="2023 年" f={f} at={a4 + 4} z={45} size={30} bg={COP} fg="#2a1a08" />}
    {f >= a4 + 8 && <div style={{position: 'absolute', left: 140, top: 1215, width: 800, textAlign: 'center', zIndex: 50, fontFamily: FONT_SANS, fontWeight: 700, fontSize: 30, color: INK, opacity: f >= out ? Math.max(0, 1 - (f - out) / 8) : 1}}>倒闭门店一次性退款</div>}
  </>;
};

// ───────── S8 L8：8 扇卷帘门 + R06 + 1000万 → R07 ─────────
export const S8: React.FC<P> = ({f}) => {
  const n = 8; const out = DUR(n); const k8 = KW(n, '八家店'); const m = KW(n, '超过'); const b0 = KW(n, '更扎心') - 4;
  const dim = ez(f, m - 4, m + 6);
  const sx = (i: number) => 84 + (i % 4) * 226, sy = (i: number) => 350 + Math.floor(i / 4) * 184;
  return <>
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const s = k8 + i * 6; const st = f < s ? 'a' : f < s + 4 ? 'b' : 'c';
      return <Prop key={i} f={f} n={'D09' + st + '_shutter_' + (st === 'a' ? 'open' : st === 'b' ? 'half' : 'closed')} x={sx(i)} y={sy(i)} w={160} inAt={2 + i * 2} outAt={out} kind="drop" extra={{opacity: undefined}} />; })}
    <div style={{position: 'absolute', left: 60, top: 330, width: 960, height: 400, zIndex: 36, background: 'rgba(241,228,204,.62)', opacity: dim, pointerEvents: 'none'}} />
    {f >= m && f < b0 + 6 && <div style={{position: 'absolute', left: 60, top: 400, width: 960, textAlign: 'center', zIndex: 50, opacity: (f > b0 ? 1 - (f - b0) / 6 : 1) * Math.min(1, sp(f, m) * 3), transform: `scale(${0.7 + 0.3 * sp(f, m)})`, ...numStyle(130, COP)}}>1000万+</div>}
    {f >= m + 6 && f < b0 + 6 && <div style={{position: 'absolute', left: 60, top: 560, width: 960, textAlign: 'center', zIndex: 50, fontFamily: FONT_SANS, fontWeight: 900, fontSize: 32, color: INK, opacity: f > b0 ? 1 - (f - b0) / 6 : 1}}>会员自发统计 · 没用完的预存</div>}
    <Card f={f} x={84} y={740} w={826} parts={[{n: 'R06_sdnews_head'}, {n: 'R06_sdnews_body', hl: [{k: 'R06_1000w', at: m - 2}]}]} tag={['鲁网财经 · 2026-03-17 · 来源：第一风口']} tilt={0.7} inAt={6} outAt={b0 - 2} exit="fade" kind="br" veil={false} />
    <Tag x={84} y={738} text="据会员反映" f={f} at={b0 + 4} bg="#4d8a92" fg="#FFF8E6" z={48} size={30} />
    <Card f={f} x={84} y={800} w={826} parts={[{n: 'R07_sdnews_body', hl: [{k: 'R07_5y', at: KW(n, '五年') - 4}]}]} tag={['鲁网财经 · 闭店前仍在推销 5 年卡 · 据会员反映']} tilt={-0.8} inAt={b0} outAt={out} kind="rise" />
  </>;
};

// ───────── S9 L9：R08 标题 + 会员卡堆 + 16亿（soft_boom）─────────
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const S9: React.FC<P> = ({f}) => {
  const n = 9; const out = DUR(n); const b4 = lf(n, HITS['B4 十六亿'].onset); const s = KW(n, '威尔仕'); const N = 26;
  return <>
    <Card f={f} x={84} y={340} w={826} parts={[{n: 'R08_caixin_head'}, {n: 'R08_caixin_body', hl: [{k: 'R08_16', at: KW(n, '预付') - 8}]}, {n: 'R08_caixin_body_lede'}]} tag={['据财新报道 · 报道标题 · 2025-10-23']} tilt={-0.5} inAt={2} outAt={out} kind="br" />
    {Array.from({length: N}).map((_, i) => { const at = s + Math.floor(i * (b4 - s - 8) / N); if (f < at) return null; const row = Math.floor(i / 7); const fx = 90 + ((i % 7) * 118 + rnd(i) * 40) , fy = 1150 - row * 38 + rnd(i + 9) * 16; const t = q(f) - at; const y = fy - Math.max(0, 1 - t / 6) * 700;
      const ex = f >= out ? exz(f, out, out + 10) : 0;
      return <div key={i} style={{position: 'absolute', left: fx, top: y + ex * 700, width: 270, zIndex: 20 + i, transform: `rotate(${(rnd(i + 3) - .5) * 40}deg)`, opacity: 1}}>
        <Img src={D(['D02a_card_green_front', 'D02c_card_copper', 'D02d_card_teal', 'D02b_card_green_back'][i % 4])} style={{width: '100%', display: 'block', filter: 'drop-shadow(0 6px 6px rgba(32,60,58,.25))'}} /></div>; })}
    {f >= b4 && <div style={{position: 'absolute', left: 60, top: 1016, width: 960, textAlign: 'center', zIndex: 60, ...numStyle(175, RED), opacity: Math.min(1, sp(f, b4) * 3) * (f >= out ? Math.max(0, 1 - (f - out) / 8) : 1), transform: `scale(${0.6 + 0.4 * sp(f, b4, 8, 200)})`}}>16 亿</div>}
    {f >= b4 + 6 && <div style={{position: 'absolute', left: 0, top: 1192, width: 1080, display: 'flex', justifyContent: 'center', zIndex: 61, opacity: f >= out ? Math.max(0, 1 - (f - out) / 8) : 1}}><div style={{padding: '4px 22px 6px', borderRadius: 8, background: 'rgba(255,253,246,.94)', fontFamily: FONT_SANS, fontWeight: 900, fontSize: 30, color: INK}}>据财新报道 · 预付费用</div></div>}
  </>;
};

// ───────── S10 L10：保险箱 + 问号 → R10 / R09 → “健身卡：不在里面” ─────────
export const S10: React.FC<P> = ({f}) => {
  const n = 10; const out = DUR(n); const qm = KW(n, '替你看着'); const b = KW(n, '全国') - 8; const nm = KW(n, '不在里面');
  const mag = Math.min(1, f / Math.max(1, qm - 4)); const ang = mag * Math.PI * 2.2;
  const mvis = f < b ? 1 : 0;
  const stamp = f >= nm ? sp(f, nm, 9, 220) : 0;
  return <>
    {f < b + 4 && <Num x={240} y={345} w={600} text="?" size={190} color={RED} f={f} at={qm - 4} />}
    <Prop f={f} n="D15a_safe_open" x={330} y={540} w={420} inAt={4} outAt={b} kind="rise" exit="down" />
    {mvis > 0 && f < qm + 8 && <Prop f={f} n="D14_magnifier" x={150 + 330 + 260 * Math.cos(ang) * (1 - mag * 0.3)} y={640 + 150 * Math.sin(ang) * (1 - mag * 0.3)} w={150} rot={-15} hold />}
    <Card f={f} x={84} y={345} w={826} parts={[{n: 'R10_mofcom_body', hl: [{k: 'R10_a', at: KW(n, '管零售') - 6}]}]} tag={['商务部令 2012 年第 9 号（2016 年修订）· 第二条', '《单用途商业预付卡管理办法（试行）》适用范围']} tilt={-0.7} inAt={b + 6} outAt={out} kind="br" />
    <Card f={f} x={84} y={740} w={826} parts={[{n: 'R09_wuhan_body', hl: [{k: 'R09_gym', at: KW(n, '健身卡') - 4}, {k: 'R09_not', at: nm - 10}]}]} tag={['武汉市商务局 · 2024-03-12 提示']} tilt={0.7} inAt={b + 16} outAt={out} kind="br" />
    {f >= nm && <div style={{position: 'absolute', left: 84, top: 1232, zIndex: 60, transform: `scale(${1.5 - 0.5 * stamp}) rotate(-3deg)`, transformOrigin: '0% 50%', opacity: Math.min(1, stamp * 3) * (f >= out ? Math.max(0, 1 - (f - out) / 8) : 1)}}>
      <div style={{padding: '8px 26px 10px', background: RED, color: '#FFF8E6', borderRadius: 10, fontFamily: FONT_SANS, fontWeight: 900, fontSize: 42, whiteSpace: 'nowrap', boxShadow: '0 8px 16px rgba(32,60,58,.25)'}}>健身卡：不在里面</div></div>}
  </>;
};

// ───────── S11 L11：西装纸人换“法人” + R12 → R11a/R11b + 75万多 / 5年 + 法槌 ─────────
export const S11: React.FC<P> = ({f}) => {
  const n = 11; const out = DUR(n); const sw = KW(n, '雇个人'); const bS = KW(n, '上海一起') - 6; const b7 = lf(n, HITS['B7 判了五年'].onset);
  const swp = ez(q(f), sw, sw + 12);
  const hitD = f >= b7 && f < b7 + 5;
  return <>
    <Prop f={f} n="D11_treadmill" x={84} y={400} w={430} rot={-2} inAt={2} outAt={bS} kind="rise" extra={{opacity: undefined}} />
    <Prop f={f} n="D10_dumbbell" x={610} y={560} w={250} rot={4} inAt={6} outAt={bS} kind="rise" />
    {f < sw + 12 && <Prop f={f} n="D12a_suit_graublue" x={440 - swp * 520} y={360} w={200} inAt={4} outAt={bS} kind="rise" z={22} />}
    {f >= sw && f < bS + 8 && <Prop f={f} n="D12b_suit_green" x={440 + (1 - swp) * 520} y={360} w={200} hold z={22} extra={{opacity: f >= bS ? Math.max(0, 1 - (f - bS) / 8) : 1}} />}
    {f < bS + 8 && <Prop f={f} n={f >= sw + 8 ? 'D13b_nametag_copper' : 'D13a_nametag_white'} x={485} y={470} w={110} hold z={26} extra={{opacity: f >= bS ? Math.max(0, 1 - (f - bS) / 8) : 1}} />}
    <Card f={f} x={84} y={900} w={826} parts={[{n: 'R12_sina_body', hl: [{k: 'R12_hire', at: KW(n, '挂名') - 6}]}]} tag={['人民法院案例库刑事参考案例 · 北京日报客户端 · 2026-05-21']} tilt={-0.6} inAt={sw - 4} outAt={bS} kind="br" />
    <Card f={f} x={84} y={360} w={826} parts={[{n: 'R11a_sina_body', hl: [{k: 'R11a_75', at: KW(n, '七十五') - 2}]}, {n: 'R11b_sina_body', hl: [{k: 'R11b_5y', at: KW(n, '判了') - 4}]}]} tag={['人民法院案例库刑事参考案例 · 北京日报客户端 · 2026-05-21', '上海虹口法院 · 2026-01-29 判决（被告人姓名已遮）']} tilt={-0.5} inAt={bS + 6} outAt={out} kind="br" veil={false} />
    <Num x={0} y={885} w={460} text="75万多" size={104} color={COP} f={f} at={KW(n, '七十五')} />
    <Num x={470} y={850} w={330} text="5年" size={168} color={RED} f={f} at={b7} />
    <Prop f={f} n={hitD ? 'D07b_gavel_down' : 'D07a_gavel_up'} x={700} y={960} w={200} rot={-6} inAt={b7 - 8} outAt={out} kind="drop" />
  </>;
};

// ───────── S12 L12：购物袋 → 会员卡 → 借条（真变形），“债主”章盖下（soft_boom 原位）→ 末帧缓推 ─────────
export const S12: React.FC<P> = ({f}) => {
  const n = 12; const a5 = lf(n, HITS['A5 债主'].onset); const c = KW(n, '消费者'); const sd = KW(n, '店倒'); const t1 = KW(n, '你就'); const t2 = KW(n, '成了');
  const tp = q(f);
  // 阶段：bag →(t1 压扁翻转)→ card →(t2 压扁翻转)→ iou；每次 8 帧：4 帧压到 0，4 帧展开
  const stage = tp < t1 + 4 ? 0 : tp < t2 + 4 ? 1 : 2;
  const flipAt = stage === 0 ? t1 : stage === 1 ? t1 : t2;
  const sxv = (() => { const sq = (a: number) => tp < a ? 1 : tp < a + 4 ? 1 - (tp - a) / 4 : tp < a + 8 ? (tp - a - 4) / 4 : 1; return Math.min(sq(t1), sq(t2)); })();
  const grow = ez(f, t2 + 4, t2 + 14);
  const bx = 250 + grow * 0, W = stage < 2 ? 390 : 390 + 220 * grow;
  const left = stage < 2 ? 125 : 125 - 110 * grow * 0 + (540 - 125 - W / 2 - 0) * grow * 0 + 0;
  const L0 = stage < 2 ? 190 : 190 + 45 * grow; // 渐移到屏幕中央
  const stampT = f >= a5 - 5 ? ez(f, a5 - 5, a5) : 0; const hit = f >= a5 ? sp(f, a5, 14, 260) : 0;
  const stampScale = f >= a5 - 5 ? (f < a5 ? 2.6 - 1.6 * stampT : 1 + 0.06 * Math.sin(Math.min(1, (f - a5) / 8) * Math.PI)) : 2.6;
  const bagOp = pose(f, 4, 'rise');
  return <div style={{position: 'absolute', inset: 0, transform: 'translateY(110px) scale(1.25)', transformOrigin: '540px 700px'}}>
    <div style={{position: 'absolute', left: L0 - 0, top: 470, width: W, zIndex: 20, opacity: bagOp.op, transform: `translateY(${bagOp.ty}px) scaleX(${sxv})`}}>
      {stage === 0 && <><Img src={D('D16_paper_bag_shadow')} style={{position: 'absolute', top: 6, width: '100%'}} /><Img src={D('D16_paper_bag')} style={{position: 'relative', width: '100%'}} /></>}
      {stage === 1 && <div style={{marginTop: 120}}><Img src={D('D02a_card_green_front_shadow')} style={{position: 'absolute', top: 126, width: '100%'}} /><Img src={D('D02a_card_green_front')} style={{position: 'relative', width: '100%'}} /></div>}
      {stage === 2 && <div style={{marginTop: 20 + 100 * (1 - grow)}}><Img src={D('D03b_iou_folded_shadow')} style={{position: 'absolute', top: 26 + 100 * (1 - grow), width: '100%'}} /><Img src={D('D03b_iou_folded')} style={{position: 'relative', width: '100%'}} /><div style={{position: 'absolute', left: '9%', top: '14%', fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 60, color: INK, letterSpacing: 6}}>借 条</div><div style={{position: 'absolute', left: '9%', right: '9%', top: '52%', height: 4, background: 'rgba(60,45,30,.35)', boxShadow: '0 26px 0 rgba(60,45,30,.35), 0 52px 0 rgba(60,45,30,.35)'}} /></div>}
    </div>
    {stage === 0 && <Under x={190} y={900} w={390} h={36} f={f} at={c + 2} />}
    <Prop f={f} n="D09d_shutter_closed_large" x={640} y={330} w={300} inAt={sd - 2} kind="drop" outAt={t2} exit="fade" />
    {f >= a5 - 5 && <div style={{position: 'absolute', left: 540 - 130, top: 640, width: 380, zIndex: 60, opacity: Math.min(1, stampT * 2 + (f >= a5 ? 1 : 0)), transform: `rotate(-9deg) scale(${stampScale})`, transformOrigin: '50% 50%', mixBlendMode: 'multiply'}}>
      <div style={{border: `12px solid ${RED}`, borderRadius: 16, padding: '4px 20px 10px', textAlign: 'center', fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 168, lineHeight: 1.05, color: RED, background: 'rgba(184,72,58,.06)', boxShadow: `inset 0 0 0 4px rgba(184,72,58,.7)`, whiteSpace: 'nowrap'}}>债主</div></div>}
    {f >= a5 + 3 && <Prop f={f} n="D08b_coin_stack3" x={730} y={1010} w={170} hold z={31} extra={{opacity: Math.min(1, sp(f, a5 + 3) * 3), transform: `scale(${0.6 + 0.4 * sp(f, a5 + 3, 9, 220)})`}} />}
  </div>;
};
