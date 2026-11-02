import React from 'react';
import {Img, staticFile} from 'remotion';
import {twos} from '../g2/ObservationStage';

// 整张姿态图切换角色（替代散件骨骼）。脚底锚点固定：每张图按自己的 foot 对齐到 (x, y)。
export type PoseSet = {id: string; figH: number; poses: Record<string, {file: string; w: number; h: number; foot: [number, number]; figH: number}>; placeholder: string[]};
export type PoseKey = {at: number; pose: string}; // 帧号 → 姿态（来自 timeline）
export type PoseProps = {
  set: PoseSet; f: number; x: number; y: number; height: number; // height = 站姿人物像素高
  track: PoseKey[]; talk?: [number, number][]; walk?: {fromX: number; start: number; dur: number}; flip?: boolean; o?: number;
  blinkEvery?: number; xfade?: number;
};
const has = (s: PoseSet, k: string) => !!s.poses[k];
const pick = (s: PoseSet, k: string) => s.poses[k] ?? s.poses.stand_neutral;

export const PoseCharacter: React.FC<PoseProps> = ({set, f, x, y, height, track, talk = [], walk, flip, o = 1, blinkEvery = 96, xfade = 4}) => {
  const k = height / set.figH;
  // 当前/上一个姿态
  const keys = [...track].sort((a, b) => a.at - b.at);
  let ci = 0; keys.forEach((kk, i) => { if (f >= kk.at) ci = i; });
  const cur = keys[ci], prev = ci > 0 ? keys[ci - 1] : null;
  const since = f - cur.at;
  // 走路：帧循环 + 位移（walk_1-4 每 4 帧换一张）；没有走路图就整图上下颠
  let wx = x, bob = 0, walking = false;
  if (walk) { const t = Math.min(1, Math.max(0, (twos(f) - walk.start) / walk.dur)); const e = 1 - Math.pow(1 - t, 1.6);
    wx = walk.fromX + (x - walk.fromX) * e; walking = t > 0 && t < 1;
    if (walking && !has(set, 'walk_1')) bob = -Math.abs(Math.sin(((f - walk.start) / 8) * Math.PI)) * 14; }
  const resolve = (pose: string, ff: number) => {
    if (walking && has(set, 'walk_1')) return `walk_${(Math.floor(ff / 4) % 4) + 1}`;
    const talking = talk.some(([a, b]) => ff >= a && ff < b);
    if (talking && pose === 'stand_neutral' && has(set, 'talk_open') && Math.floor(ff / 4) % 2 === 0) return 'talk_open';
    const bp = (ff + set.id.length * 23) % blinkEvery;
    if (pose === 'stand_neutral' && !talking && has(set, 'stand_blink') && bp < 3) return 'stand_blink';
    return pose;
  };
  const layer = (pose: string, op: number, pop: number) => { const p = pick(set, pose);
    return <Img key={pose + op} src={staticFile(p.file)} style={{position: 'absolute', left: -p.foot[0] * k, top: -p.foot[1] * k, width: p.w * k, height: p.h * k, opacity: op,
      transform: `scale(${pop})`, transformOrigin: `${p.foot[0] * k}px ${p.foot[1] * k}px`}} />; };
  // 切换：短交叉淡入 + 轻弹缩放
  const t = Math.min(1, since / xfade);
  const pop = since < 8 && prev ? 1 + 0.035 * Math.sin((since / 8) * Math.PI) : 1;
  // 呼吸微缩放 + 待机轻晃（以脚底为轴，不跳）
  const br = 1 + 0.008 * Math.sin((f / 30) * Math.PI * 0.9);
  const sway = walking ? 0 : 0.6 * Math.sin((f / 30) * Math.PI * 0.45);
  const ph = set.id !== 'tzs' && (!set.poses[cur.pose] || set.placeholder.includes(cur.pose));
  return <><div style={{position: 'absolute', left: wx, top: y + bob, width: 0, height: 0, opacity: o,
    transform: `${flip ? 'scaleX(-1) ' : ''}rotate(${sway}deg) scaleY(${br})`, transformOrigin: '0 0'}}>
    {prev && t < 1 && layer(resolve(prev.pose, f), 1 - t, 1)}
    {layer(resolve(cur.pose, f), prev ? t : 1, pop)}
  </div></>;
};
