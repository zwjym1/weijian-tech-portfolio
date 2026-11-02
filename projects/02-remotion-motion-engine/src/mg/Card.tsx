import React from 'react';
import {C, FONT_SANS} from '../core/tokens';
// 纸片卡底：米白卡纸 + 轻投影 + 微旋转，所有 MG 的基础外观
export const PaperCard: React.FC<{x: number; y: number; w: number; rot?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({x, y, w, rot = 0, style, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, background: C.cream, borderRadius: 10,
    boxShadow: '0 10px 0 rgba(32,60,58,0.18), 0 18px 30px rgba(32,60,58,0.25)', border: `3px solid ${C.brass}`,
    transform: `rotate(${rot}deg)`, fontFamily: FONT_SANS, color: C.ink, padding: '26px 34px', boxSizing: 'border-box', ...style}}>
    {children}
  </div>
);
