import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useCamera} from './camera';
// 图层顺序（下→上）。evd = 真实证据截图/字卡，永远在 MG 之下、字幕之上无遮挡
export type LayerType = 'bg' | 'shd' | 'prp' | 'chr' | 'evd' | 'mg';
export const LAYER_Z: Record<LayerType, number> = {bg: 0, shd: 10, prp: 20, chr: 30, evd: 40, mg: 50};
// 默认视差深度：1 = 跟镜头完全一起动（最近），0 = 不动
export const LAYER_DEPTH: Record<LayerType, number> = {bg: 0.85, shd: 1, prp: 1.1, chr: 1.25, evd: 0, mg: 0};

export const Layer: React.FC<{type: LayerType; depth?: number; z?: number; children: React.ReactNode}> = ({type, depth, z = 0, children}) => {
  const cam = useCamera();
  const d = depth ?? LAYER_DEPTH[type];
  const s = 1 + (cam.zoom - 1) * d;
  return (
    <AbsoluteFill style={{zIndex: LAYER_Z[type] + z, transformOrigin: '50% 50%',
      transform: `translate(${-cam.x * d}px, ${-cam.y * d}px) scale(${s})`}}>
      {children}
    </AbsoluteFill>
  );
};

// 一个分层素材：src 为 public/ 下路径，坐标为 1080×1920 画布像素
export const Sprite: React.FC<{src: string; x: number; y: number; w: number; style?: React.CSSProperties}> = ({src, x, y, w, style}) => (
  <Img src={staticFile(src)} style={{position: 'absolute', left: x, top: y, width: w, ...style}} />
);
