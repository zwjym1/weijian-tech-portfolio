import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CameraRig, useCamera} from '../core/camera';
import {Layer, LayerType} from '../core/layers';
import {PaperTexture, Vignette} from '../core/paper';
import {C, FONT_SANS} from '../core/tokens';
import {DashedArrow, KeyChip, LabelTag, CountUp, PaperCard} from '../mg';
import {clamp} from '../mg/anim';
import L from './sh06_layers.json';
// SH06 分层技术验证：bg 干净地面 / shd 代码接触阴影 / prp 钱堆 / chr 小林×2 / mg 叠加
// 0–5s 推+横移展示视差；5–7s “分层爆炸视图”标出每层
export const LAYER_TEST_FRAMES = 210;
const ex = (f: number) => interpolate(f, [150, 175], [0, 1], clamp);
const Tag: React.FC<{t: string; x: number; y: number}> = ({t, x, y}) => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', left: x, top: y, opacity: ex(f), fontFamily: FONT_SANS, fontSize: 30, color: C.cream, background: C.ink, padding: '2px 10px', borderRadius: 4, whiteSpace: 'nowrap'}}>{t}</div>;
};
type K = keyof typeof L;
const Obj: React.FC<{n: K; type: LayerType; depth: number; lift: number; grow?: boolean; bob?: number}> = ({n, type, depth, lift, grow, bob = 0}) => {
  const f = useCurrentFrame(); const o = L[n];
  const g = grow ? interpolate(f, [25, 90], [0.55, 1], {...clamp}) : 1;
  const b = Math.sin(f / 9 + bob) * 3 * (bob ? 1 : 0);
  const e = ex(f);
  const shW = o.w * (grow ? 0.95 : 0.7) * (0.75 + 0.25 * g);
  return (<>
    {/* 接触阴影：随物体高度变宽变淡；爆炸视图中阴影留在地面 */}
    <Layer type="shd" depth={depth}>
      <div style={{position: 'absolute', left: o.x + o.w / 2 - shW / 2, top: o.footY - 26, width: shW, height: 52, borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(20,24,22,.55) 0%, rgba(20,24,22,.25) 50%, rgba(20,24,22,0) 72%)', mixBlendMode: 'multiply'}} />
    </Layer>
    <Layer type={type} depth={depth}>
      <div style={{position: 'absolute', left: o.x, top: o.y, width: o.w, height: o.h, transformOrigin: '50% 100%',
        transform: `translateY(${b - e * lift}px) scaleY(${g})`, outline: e > 0.01 ? `3px dashed rgba(184,72,58,${e})` : undefined}}>
        <Img src={staticFile(`layers/${n}_v01.png`)} style={{width: '100%', height: '100%'}} />
      </div>
      <Tag t={`${type}_${n.replace(/^(chr|prp)_/, '')}`} x={o.x} y={o.y - 44 - lift} />
    </Layer>
  </>);
};
const Scene: React.FC = () => {
  const f = useCurrentFrame(); const cam = useCamera(); const e = ex(f);
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Layer type="bg" depth={0.45}>
        <Img src={staticFile('layers/bg_sh06_floor_v01.png')} style={{position: 'absolute', left: -54, top: -96, width: 1188, height: 2112, filter: `brightness(${1 - e * 0.35})`}} />
        <Tag t="bg_sh06_floor（修补后的空地面）" x={110} y={420} />
        <Tag t="shd_（代码生成的接触阴影）" x={110} y={1440} />
      </Layer>
      <Obj n="prp_stack_small" type="prp" depth={0.8} lift={60} />
      <Obj n="prp_stack_big" type="prp" depth={0.8} lift={60} grow />
      <Obj n="chr_xiaolin_a" type="chr" depth={1.15} lift={120} bob={1} />
      <Obj n="chr_xiaolin_b" type="chr" depth={1.15} lift={120} bob={2.5} />
      <Layer type="mg">
        <div style={{opacity: 1 - e}}>
          <KeyChip text="省 ¥768" x={110} y={560} start={20} />
          <KeyChip text="多买 ¥3600" x={600} y={470} start={70} color={C.red} />
          <DashedArrow x1={300} y1={700} x2={760} y2={600} start={95} color={C.amber} />
          <PaperCard x={260} y={1160} w={560} style={{textAlign: 'center', opacity: interpolate(f, [110, 122], [0, 1], clamp)}}>
            <div style={{fontSize: 64, fontWeight: 800, color: C.red}}>总支出 <CountUp to={3092} start={112} prefix="+¥" /></div>
          </PaperCard>
        </div>
        <Tag t="mg_（Remotion 代码层，不进图片）" x={110} y={300} />
        <div style={{position: 'absolute', right: 90, top: 230, fontFamily: FONT_SANS, fontSize: 28, color: C.cream, background: 'rgba(32,60,58,.8)', padding: '4px 12px', borderRadius: 6}}>
          LAYER TEST · cam x {cam.x.toFixed(0)} zoom {cam.zoom.toFixed(3)}</div>
      </Layer>
      <LabelTag text="示意" />
      <PaperTexture opacity={0.1} /><Vignette />
    </AbsoluteFill>
  );
};
export const LayerTest: React.FC = () => (
  <CameraRig move={{from: {x: -45, y: 10, zoom: 1.0}, to: {x: 45, y: -10, zoom: 1.08}, end: 150}}><Scene /></CameraRig>
);
