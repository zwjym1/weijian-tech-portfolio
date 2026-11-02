import React from 'react';
import {Img, interpolate, spring, staticFile} from 'remotion';
import {PAL, SERIF} from '../g2/ObservationStage';

// 栏目标识：秘书丞「丞」朱印（账号统一）+ 栏目变体。本栏目=通政使（生活账本观察）。
// A 角印+栏目签（与黑洞片 BrandBadge 同一套：第 4 帧盖下停右上角）；B 开场大印飞入角落；C 书签纸条垂挂
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SEAL = () => staticFile('g6/brand/seal_t.png');
const CX = 1080 - 40 - 42, CY = 102, S = 84; // 角印中心与尺寸（顶部 UI 区内的小标识，不压正文）

const Tab: React.FC<{f: number; from: number}> = ({f, from}) => {
  const o = interpolate(f, [from, from + 8, 78, 88], [0, 1, 1, 0], cl);
  const w = 300 * spring({frame: f - from, fps: 30, config: {damping: 14, stiffness: 160}});
  return <div style={{position: 'absolute', left: CX - S / 2 - 12 - w, top: CY - 26, width: w, height: 52, overflow: 'hidden', opacity: o, borderRadius: '6px 0 0 6px', background: PAL.ink, boxShadow: '0 4px 10px rgba(0,0,0,.25)'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 6, height: 52, background: PAL.vermilion}} />
    <div style={{position: 'absolute', right: 16, top: 0, lineHeight: '52px', whiteSpace: 'nowrap', fontFamily: SERIF, fontWeight: 900, fontSize: 26, letterSpacing: 3, color: PAL.paper}}>通政使 · 观察记录</div>
  </div>;
};
const CornerSeal: React.FC<{f: number; at: number}> = ({f, at}) => {
  if (f < at) return null;
  const st = spring({frame: f - at, fps: 30, config: {damping: 11, stiffness: 230}});
  const op = interpolate(f - at, [0, 3, 40, 54], [0, 1, 1, 0.85], cl);
  return <Img src={SEAL()} style={{position: 'absolute', left: CX - S / 2, top: CY - S / 2, width: S, height: S, opacity: op, transform: `scale(${interpolate(st, [0, 1], [2.2, 1])}) rotate(${interpolate(st, [0, 1], [-16, -6])}deg)`, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.35))', zIndex: 95}} />;
};

export const BrandMark: React.FC<{f: number; v: 'A' | 'B' | 'C'}> = ({f, v}) => {
  if (v === 'A') return <><Tab f={f} from={10} /><CornerSeal f={f} at={4} /></>;
  if (v === 'B') {
    // 0–0.5s 开场大印：盖下→停 6 帧→缩飞到右上角
    const st = spring({frame: f - 2, fps: 30, config: {damping: 10, stiffness: 260}});
    const fly = interpolate(f, [16, 28], [0, 1], {...cl, easing: (t) => 1 - Math.pow(1 - t, 3)});
    const size = interpolate(fly, [0, 1], [300, S]), x = interpolate(fly, [0, 1], [540, CX]), y = interpolate(fly, [0, 1], [700, CY]);
    const flash = interpolate(f, [2, 4, 10], [0, 0.7, 0], cl);
    return <>
      <div style={{position: 'absolute', inset: 0, background: PAL.paper, opacity: flash, zIndex: 94}} />
      {f >= 2 && <Img src={SEAL()} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 95, opacity: f >= 40 ? interpolate(f, [40, 54], [1, 0.85], cl) : 1,
        transform: `scale(${fly > 0 ? 1 : interpolate(st, [0, 1], [1.5, 1])}) rotate(${interpolate(st, [0, 1], [-14, -6])}deg)`, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.35))'}} />}
      {f >= 4 && f < 22 && <div style={{position: 'absolute', left: 0, width: 1080, top: 880, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 64, letterSpacing: 18, color: PAL.ink, opacity: 1 - fly * 3, zIndex: 95}}>通政使</div>}
      <Tab f={f} from={28} />
    </>;
  }
  // C 书签纸条：从顶边垂下，竖排“通政使”，底部小印；常驻轻晃
  const drop = spring({frame: f - 4, fps: 30, config: {damping: 9, stiffness: 120}});
  const sway = Math.sin(f / 22) * 1.4;
  return <div style={{position: 'absolute', left: 952, top: -10, width: 76, height: 330 * drop, transformOrigin: '38px 0', transform: `rotate(${sway}deg)`, zIndex: 95}}>
    <div style={{position: 'absolute', inset: 0, background: '#FFFDF6', boxShadow: '0 6px 12px rgba(0,0,0,.25)', clipPath: 'polygon(0 0,100% 0,100% 100%,50% 94%,0 100%)'}} />
    <div style={{position: 'absolute', left: 0, width: 76, top: 92, textAlign: 'center', writingMode: 'vertical-rl', fontFamily: SERIF, fontWeight: 900, fontSize: 32, letterSpacing: 8, color: PAL.ink, marginLeft: 20}}>通政使</div>
    <Img src={SEAL()} style={{position: 'absolute', left: 8, top: 22, width: 60, height: 60, transform: 'rotate(-6deg)'}} />
  </div>;
};
