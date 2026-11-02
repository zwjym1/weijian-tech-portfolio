import vo from './data/vo.json';
import hitsJ from './data/hits.json';
export const FPS = 30;
type Word = {text: string; start: number; end: number};
type Ln = {n: number; text: string; speech_start: number; speech_end: number; words: Word[]};
export const L: Ln[] = (vo as any).lines;
export const TOTAL = (vo as any).total_sec as number;
export const TOTAL_FRAMES = Math.ceil(TOTAL * FPS);
export const HITS = (hitsJ as any).hits as Record<string, {onset: number; end: number}>;
const idxOf = (n: number, phrase: string, occ = 1) => {
  const s = L[n - 1].words.map(w => w.text).join(''); let i = -1;
  for (let k = 0; k < occ; k++) { i = s.indexOf(phrase, i + 1); if (i < 0) throw new Error(`phrase ${n} ${phrase}`); }
  return i;
};
// 关键词起音(秒，全片时间轴)
export const W = (n: number, phrase: string, occ = 1) => L[n - 1].words[idxOf(n, phrase, occ)].start;
export const WE = (n: number, phrase: string, occ = 1) => L[n - 1].words[idxOf(n, phrase, occ) + phrase.length - 1].end;
export const ST = (n: number) => L[n - 1].speech_start;
export const EN = (n: number) => L[n - 1].speech_end;
// 场景起点帧（比口播起音早 0.12s；第 1 句从 0 开始）
export const S0: number[] = L.map((l, i) => i === 0 ? 0 : Math.max(0, Math.round((l.speech_start - 0.12) * FPS)));
export const S0e: number[] = [...S0.slice(1), TOTAL_FRAMES];
export const DUR = (n: number) => S0e[n - 1] - S0[n - 1];
// 全局秒 → 场景局部帧
export const lf = (n: number, sec: number) => Math.round(sec * FPS) - S0[n - 1];
export const KW = (n: number, phrase: string, occ = 1) => lf(n, W(n, phrase, occ));
