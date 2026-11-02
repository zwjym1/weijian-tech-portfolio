import React from 'react';
import {Img} from 'remotion';
import {FONT_SANS, FONT_SERIF} from '../core/tokens';
import {D, RED, INK, CREAM} from './kit';

export type Fmt = '916' | '34' | '43' | '169';
export const COVER_SIZE: Record<Fmt, [number, number]> = {'916': [1080, 1920], '34': [1080, 1440], '43': [1440, 1080], '169': [1920, 1080]};
const glow = '0 0 14px rgba(241,228,204,.95), 0 0 5px rgba(241,228,204,.95)';

const Paper: React.FC<{w: number; h: number}> = ({w, h}) => {
  const land = w > h;
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: CREAM}}>
    <Img src={D('D01_paper_texture')} style={{position: 'absolute', left: w / 2, top: h / 2, width: 1140, height: 2020, transform: `translate(-50%, -50%) rotate(${land ? 90 : 0}deg)`}} />
    <Img src={D('D01_grain_a')} style={{position: 'absolute', left: w / 2, top: h / 2, width: 1080, height: 1920, transform: `translate(-50%, -50%) rotate(${land ? 90 : 0}deg) scale(${Math.max(w, h) / 1920 > 1 ? 1.1 : 1})`, mixBlendMode: 'multiply', opacity: .5}} />
  </div>;
};
const Seal: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 62 * s, height: 84 * s, opacity: .7, border: `${5 * s}px solid ${RED}`, borderRadius: 9 * s, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 31 * s, lineHeight: `${34 * s}px`, color: RED, mixBlendMode: 'multiply', transform: 'rotate(-3deg)'}}><div>小</div><div>丞</div></div>
);
// 借条纸 + 大字“借条”（焦点）+ 荧光笔下划线 + 露出一角的会员卡
const Iou: React.FC<{x: number; y: number; w: number; fs: number}> = ({x, y, w, fs}) => {
  const h = w * 460 / 700;
  return <>
    <div style={{position: 'absolute', left: x + w * 0.5, top: y + h * 0.64, width: w * 0.44, transform: 'rotate(9deg)'}}>
      <Img src={D('D02a_card_green_front_shadow')} style={{position: 'absolute', top: 8, width: '100%'}} /><Img src={D('D02a_card_green_front')} style={{position: 'relative', width: '100%', display: 'block'}} /></div>
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: 'rotate(-2deg)'}}>
      <Img src={D('D03b_iou_folded_shadow')} style={{position: 'absolute', top: 10, width: '100%'}} />
      <Img src={D('D03b_iou_folded')} style={{position: 'relative', width: '100%', display: 'block'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.12, textAlign: 'center', fontFamily: FONT_SERIF, fontWeight: 900, fontSize: fs, lineHeight: 1.1, color: RED, letterSpacing: fs * 0.06, textShadow: '0 4px 0 rgba(255,253,246,.7)', whiteSpace: 'nowrap'}}>借条</div>
      <div style={{position: 'absolute', left: w * 0.1, width: w * 0.8, top: h * 0.12 + fs * 0.98, height: fs * 0.2, mixBlendMode: 'multiply'}}>
        <Img src={D('D04c_highlighter')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} /><Img src={D('D04c_highlighter')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} /></div>
    </div>
  </>;
};
const Lines: React.FC<{x: number; y: number; w: number; a: number; b: number; c: number; align?: 'center' | 'left'}> = ({x, y, w, a, b, c, align = 'center'}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, textAlign: align, textShadow: glow}}>
    <div style={{fontFamily: FONT_SERIF, fontWeight: 900, fontSize: a, lineHeight: 1.15, color: INK}}>你的健身卡</div>
    <div style={{fontFamily: FONT_SANS, fontWeight: 900, fontSize: b, lineHeight: 1.3, color: INK, opacity: .85}}>其实是一张</div>
    <div style={{fontFamily: FONT_SANS, fontWeight: 900, fontSize: c, lineHeight: 1.3, color: INK}}>没打<span style={{color: RED}}>借条</span>的</div>
  </div>
);

export const Cover: React.FC<{fmt: Fmt}> = ({fmt}) => {
  const [W, H] = COVER_SIZE[fmt]; const land = W > H;
  // 舞台：竖版 1080×1440（9:16 画布上下各留 240 的纸底，平台 3:4 裁切也完整）；横版 1440×1080 居中
  const sw = land ? 1440 : 1080, sh = land ? 1080 : 1440; const ox = (W - sw) / 2, oy = (H - sh) / 2;
  return <div style={{position: 'relative', width: W, height: H, overflow: 'hidden'}}>
    <Paper w={W} h={H} />
    <div style={{position: 'absolute', left: ox, top: oy, width: sw, height: sh}}>
      {!land ? <>
        <Lines x={0} y={130} w={1080} a={138} b={84} c={104} />
        <Iou x={95} y={610} w={890} fs={330} />
        <Seal x={64} y={1290} s={1.3} />
      </> : <>
        <Lines x={70} y={300} w={660} a={128} b={80} c={100} align="left" />
        <Iou x={740} y={290} w={640} fs={240} />
        <Seal x={70} y={930} s={1.3} />
      </>}
    </div>
  </div>;
};
