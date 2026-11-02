// archive-studio 通用常量与缓动（时长由各卷 props 决定，不写死）
import {staticFile} from 'remotion';
export const FPS = 30;
export const fontCss = `
@font-face{font-family:'Smiley';src:url(${staticFile('fonts/SmileySans-Oblique.ttf')}) format('truetype');}
@font-face{font-family:'FusionPixel';src:url(${staticFile('fonts/FusionPixel12.ttf')}) format('truetype');}
*{font-synthesis:none;}`;
export const PIXEL = "'FusionPixel','Noto Sans CJK SC',monospace";
export const SERIF = "'Noto Serif CJK SC','Source Han Serif SC','Noto Serif',serif";
export const SMILEY = "'Smiley','Noto Sans CJK SC',sans-serif";
export const c01 = (x: number) => Math.max(0, Math.min(1, x));
export const win = (t: number, a: number, b: number) => c01((t - a) / Math.max(1e-6, b - a));
export const easeOut = (x: number) => 1 - Math.pow(1 - c01(x), 3);
export const easeIn = (x: number) => Math.pow(c01(x), 3);
export const ease = (x: number) => { const t = c01(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const backOut = (x: number) => { const t = c01(x), s = 1.70158; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
// 确定性伪随机
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
