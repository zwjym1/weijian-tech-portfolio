import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CameraRig, moveFromText} from '../core/camera';
import {Layer} from '../core/layers';
import {PaperTexture, Vignette} from '../core/paper';
import {TIMELINE, TimedShot} from '../core/timeline';
import {C, FONT_SANS, SAFE} from '../core/tokens';
import {KeyChip, LabelTag, SyncedCaption} from '../mg';
import {SHOT_MG, CHIP_SKIP} from './shotMG';
import NUM from '../data/display_numbers.json';
const toDigits = (t: string) => (NUM.map as string[][]).reduce((a, [x, y]) => a.split(x).join(y), t);
// 临时底图：G3 故事板（G5 后替换为分层素材，见 docs/TECH_PIPELINE.md）
// 人物脸在左上的镜头，关键词条改放右侧
const CHIP_RIGHT = new Set(['SH03']);
const ShotView: React.FC<{s: TimedShot}> = ({s}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <CameraRig move={moveFromText(s.camera, s.frames)}>
        <Layer type="bg" depth={1}><Img src={staticFile(`sb/${s.id}.png`)} style={{width: 1080, height: 1920, objectFit: 'cover'}} /></Layer>
      </CameraRig>
      <AbsoluteFill style={{zIndex: 45, background: 'linear-gradient(180deg, rgba(241,228,204,.55) 0%, rgba(241,228,204,0) 30%, rgba(241,228,204,0) 75%, rgba(241,228,204,.5) 100%)'}} />
      <Layer type="mg">{SHOT_MG[s.id]?.(s.frames)}
        {s.captions.filter(c => !CHIP_SKIP.has(c)).map((c, i, arr) => <KeyChip key={i} text={toDigits(c)} x={CHIP_RIGHT.has(s.id) ? SAFE.x1 - 40 - c.length * 56 : SAFE.x0} y={310 + i * 96} start={8 + Math.round(i * s.frames * 0.55 / Math.max(1, arr.length))} color={/[+多]/.test(c) && !/真省/.test(c) ? C.red : C.ink} />)}
      </Layer>
      <LabelTag text={s.label} />
      <div style={{position: 'absolute', right: 1080 - SAFE.x1, top: SAFE.y0, zIndex: 80, fontFamily: FONT_SANS, fontSize: 30, color: C.cream, background: 'rgba(32,60,58,.8)', padding: '4px 14px', borderRadius: 6}}>
        {s.id} · 草稿 {(f / 30).toFixed(1)}s/{(s.frames / 30).toFixed(1)}s</div>
      <SyncedCaption shotId={s.id} />
      {s.audio && <Audio src={staticFile(s.audio)} />}
      <PaperTexture opacity={0.1} /><Vignette />
    </AbsoluteFill>
  );
};
export const Animatic: React.FC = () => (
  <AbsoluteFill style={{background: C.cream}}>
    {TIMELINE.map(s => <Sequence key={s.id} from={s.from} durationInFrames={s.frames}><ShotView s={s} /></Sequence>)}
  </AbsoluteFill>
);
