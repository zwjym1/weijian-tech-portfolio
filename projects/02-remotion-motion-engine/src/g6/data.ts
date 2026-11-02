import timeline from './data/timeline.json';
import vo from './data/vo_full.json';
export type Seg = {text: string; start: number; end: number};
export type Line = {shot: string; text: string; file: string; sec: number; start: number; segs: Seg[]};
export const TL = timeline as {fps: number; items: {shot: string; start: number; end: number; voice: string; state: string; motion: string}[]};
export const LINES = (vo as any).lines as Line[];
export const lineOf = (shot: string, n = 0) => LINES.filter((l) => l.shot === shot)[n];
// 关键词（来自分镜：数字与结论词标朱红）
export const KEYWORDS: Record<string, string[]> = {
  S01: ['六十四', '单价', '两百多'], S02: ['八百', '两百六', '百分之八', '五百'], S03: ['拿大的', '凑一件', '再逛逛', '三百'],
  S04: ['七百六', '三千六', '三千出头'], S05: ['三分之一', '回本'], S06: ['一半'], S07: ['真省钱'], S08: ['三个月', '总支出'],
};
