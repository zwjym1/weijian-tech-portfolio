// 时间线：镜头顺序/内容来自 episodes/<ep>/shotlist.json；时长来自配音实测 src/data/timings.json
// （tools/tts.py 生成）。没有 timings 的镜头回退到 estDurationSec。
import shotlist from '../../../episodes/E001-membership/shotlist.json';
import timings from '../data/timings.json';
import {FPS} from './tokens';
export type Shot = {id: string; narration: string; estDurationSec: number; camera: string; captions: string[]; mg: string[]; label: string};
export type TimedShot = Shot & {from: number; frames: number; audio?: string};
const T: Record<string, {frames: number; audio: string}> = Object.fromEntries((timings as any).shots.map((s: any) => [s.id, s]));
export const buildTimeline = (shots: Shot[] = (shotlist as any).shots): TimedShot[] => {
  let t = 0;
  return shots.map(s => {
    const frames = T[s.id]?.frames ?? Math.round(s.estDurationSec * FPS);
    const r = {...s, from: t, frames, audio: T[s.id]?.audio}; t += frames; return r;
  });
};
export const TIMELINE = buildTimeline();
export const TOTAL_FRAMES = TIMELINE.reduce((a, s) => a + s.frames, 0);
