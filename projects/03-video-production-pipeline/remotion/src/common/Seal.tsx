// 可选「丞」印章（brand_config.seal.optional=true：不强制，按期选用）
import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
export const Seal: React.FC<{at: number; x: number; y: number; size?: number; rot?: number; opacityEnd?: number}> = ({at, x, y, size = 72, rot = -6, opacityEnd = 1}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s0 = Math.round(at * fps);
  if (f < s0) return null;
  const st = spring({frame: f - s0, fps, config: {damping: 11, stiffness: 230}});
  const scale = interpolate(st, [0, 1], [2.2, 1]);
  const op = interpolate(f - s0, [0, 3, 24, 40], [0, 1, 1, opacityEnd], {extrapolateRight: 'clamp'});
  return <div style={{position: 'absolute', left: x, top: y, width: size, height: size, opacity: op, transform: `translate(-50%,-50%) scale(${scale}) rotate(${interpolate(st, [0, 1], [-16, rot])}deg)`, zIndex: 95}}>
    <Img src={staticFile('brand/seal_t.png')} style={{width: size, height: size}} />
  </div>;
};
