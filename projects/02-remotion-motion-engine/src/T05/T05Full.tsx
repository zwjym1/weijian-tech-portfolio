import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {PaperBG, Seal, SF, clampO} from './kit';
import {Caption} from './Caption';
import {S0, DUR, TOTAL_FRAMES, HITS, FPS} from './timeline';
import {S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12} from './scenes';
import {KW, W, lf} from './timeline';
export {TOTAL_FRAMES};
const SC = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12];
const Cam: React.FC<{n: number; children: React.ReactNode}> = ({n, children}) => {
  const f = useCurrentFrame(); const d = DUR(n); const amt = n === 12 ? 0.035 : 0.022;
  const s = 1 + amt * Math.min(1, f / Math.max(1, d)); const dx = Math.sin(f / 61 + n) * 7, dy = Math.cos(f / 83 + n * 2) * 6;
  const a5 = lf(12, HITS['A5 债主'].onset); const k = n === 12 && f >= a5 && f < a5 + 6 ? (6 - (f - a5)) : 0; const sx = dx + k * (f % 2 ? 1.6 : -1.6), sy = dy + k * (f % 2 ? -1.2 : 1.2);
  return <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${s})`, transformOrigin: '540px 840px'}}>{children}</AbsoluteFill>;
};
const SceneN: React.FC<{n: number}> = ({n}) => { const f = useCurrentFrame(); const C = SC[n - 1]; const d = DUR(n); const o = f > d ? Math.max(0, 1 - (f - d) / 9) : 1; return <AbsoluteFill style={{opacity: o}}><Cam n={n}><C f={f} /></Cam></AbsoluteFill>; };
const CapN: React.FC<{n: number}> = ({n}) => { const f = useCurrentFrame(); return <Caption n={n} gf={f + S0[n - 1]} />; };

// ───────── 音效表（全局秒；soft_boom 仅 L6/L9/L12，均 ≤0.6s）─────────
const g = (n: number, phrase: string, d = 0) => W(n, phrase) + d;
const POP = (t: number): [number, string, number] => [t, 'pop_7e9Is8L', 0.28];
const WH = (t: number): [number, string, number] => [t, 'whoosh-sfx', 0.13];
export const SFX: [number, string, number][] = [
  [0.0, 'whoosh-wind', 0.2],                                   // 第 0 帧纸张摩擦（≤0.45s）
  POP(g(1, '两千')), POP(g(1, '其实不是卡')),
  POP(g(2, '收入', 0.5)), POP(g(2, '欠你的服务', 0.35)),
  WH(S0[2] / FPS), POP(g(3, '七天') - 0.05), POP(g(3, '本金')),
  POP(g(4, '借出去了', 0.05)),
  WH(S0[4] / FPS), [S0[4] / FPS + 0.5, 'punch_u4LmMsr', 0.3], [S0[4] / FPS + 0.8, 'punch_u4LmMsr', 0.3], POP(g(5, '两千')), POP(g(5, '十二次')),
  [HITS['A3 退一千六'].onset, 'soft_boom', 0.38],                // soft_boom ① L6
  WH(S0[6] / FPS), POP(HITS['A4 百分之一点三'].onset),
  WH(S0[7] / FPS), POP(g(8, '超过') + 0.0), POP(g(8, '五年') - 0.1),
  [HITS['B4 十六亿'].onset, 'soft_boom', 0.38],                  // soft_boom ② L9
  WH(S0[9] / FPS), POP(g(10, '管零售') - 0.15), POP(g(10, '不在里面') - 0.3), POP(g(10, '不在里面')),
  POP(g(11, '雇个人')), WH(g(11, '上海一起') - 0.2), POP(g(11, '七十五')), [HITS['B7 判了五年'].onset, 'punch_u4LmMsr', 0.3],
  POP(g(12, '消费者') + 0.05),
  [HITS['A5 债主'].onset, 'soft_boom', 0.38],                   // soft_boom ③ L12
];

export const T05Full: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill>
    <PaperBG f={f} />
    <Audio src={staticFile('T05/vo_final.wav')} />
    {SFX.map(([t, n, v], i) => <Sequence key={i} from={Math.max(0, Math.round(t * FPS))} durationInFrames={20}><Audio src={SF(n)} volume={v} /></Sequence>)}
    {SC.map((_, i) => <Sequence key={i} from={S0[i]} durationInFrames={DUR(i + 1) + (i < 11 ? 9 : 0)}><SceneN n={i + 1} /></Sequence>)}
    {SC.map((_, i) => <Sequence key={'c' + i} from={S0[i]} durationInFrames={DUR(i + 1)}><CapN n={i + 1} /></Sequence>)}
    <Seal />
  </AbsoluteFill>;
};
