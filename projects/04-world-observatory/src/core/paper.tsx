import React from 'react';
import {AbsoluteFill} from 'remotion';
// 纸张纹理叠加：SVG 噪声 + 纤维，multiply 混合，全程固定种子（不闪烁）
export const PaperTexture: React.FC<{opacity?: number}> = ({opacity = 0.16}) => (
  <AbsoluteFill style={{zIndex: 90, pointerEvents: 'none', mixBlendMode: 'multiply', opacity}}>
    <svg width="100%" height="100%">
      <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves={3} seed={7} />
        <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0.9 0" /></filter>
      <filter id="fiber"><feTurbulence type="turbulence" baseFrequency="0.004 0.08" numOctaves={2} seed={3} />
        <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.33  0 0 0 0 0.25  0 0 0 0.5 0" /></filter>
      <rect width="100%" height="100%" filter="url(#paper)" />
      <rect width="100%" height="100%" filter="url(#fiber)" opacity={0.5} />
    </svg>
  </AbsoluteFill>
);
// 暗角，让纸面更像微缩摄影
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{zIndex: 91, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(32,60,58,0.35) 100%)'}} />
);
