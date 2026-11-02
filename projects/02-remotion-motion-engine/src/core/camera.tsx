import React, {createContext, useContext} from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
export type Cam = {x: number; y: number; zoom: number};
const Ctx = createContext<Cam>({x: 0, y: 0, zoom: 1});
export const useCamera = () => useContext(Ctx);
export type Move = {from: Cam; to: Cam; start?: number; end: number};
// 推拉/平移镜头：子图层按自身 depth 读取，形成视差
export const CameraRig: React.FC<{move: Move; children: React.ReactNode}> = ({move, children}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [move.start ?? 0, move.end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const cam = {x: lerp(move.from.x, move.to.x), y: lerp(move.from.y, move.to.y), zoom: lerp(move.from.zoom, move.to.zoom)};
  return <Ctx.Provider value={cam}>{children}</Ctx.Provider>;
};
// 从 shotlist 的中文镜头描述推断运动
export const moveFromText = (txt: string, frames: number): Move => {
  const p = Number((txt.match(/(\d+)%/) || [])[1] || 5) / 100;
  const sec = Number((txt.match(/([\d.]+)\s*秒内/) || [])[1] || 0);
  const end = sec ? Math.min(frames, sec * 30) : frames;
  const base = {x: 0, y: 0, zoom: 1.04};
  if (/拉/.test(txt)) return {from: {...base, zoom: 1.04 + p}, to: base, end};
  if (/推/.test(txt)) return {from: base, to: {...base, zoom: 1.04 + p}, end};
  if (/横移|侧移|平移/.test(txt)) return {from: {...base, x: -30}, to: {...base, x: 30}, end};
  if (/下摇/.test(txt)) return {from: {...base, y: -40}, to: {...base, y: 40}, end};
  return {from: base, to: {...base, zoom: 1.055}, end}; // “静止”也给极轻的呼吸推，避免死帧
};
