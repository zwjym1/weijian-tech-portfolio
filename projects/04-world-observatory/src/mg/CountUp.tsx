import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {clamp} from './anim';
// 数字滚动
export const CountUp: React.FC<{from?: number; to: number; start: number; dur?: number; prefix?: string; suffix?: string; decimals?: number}> = ({from = 0, to, start, dur = 24, prefix = '', suffix = '', decimals = 0}) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [start, start + dur], [from, to], {...clamp, easing: Easing.out(Easing.cubic)});
  return <span style={{fontVariantNumeric: 'tabular-nums'}}>{prefix}{v.toFixed(decimals)}{suffix}</span>;
};
