import React from 'react';
import {useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import captions from '../data/captions.json';
import {C, CAPTION, FONT_SANS, SAFE} from '../core/tokens';
type KW = {w: string; i: number; c: string; t: number; te: number};
type Line = {text: string; start: number; end: number; hold: number; keywords: KW[]};
// 一句一条字幕：只显示当前这句，和配音逐词时间戳同步；重点词 1.2 倍、加粗、琥珀橘/朱红，念到时弹入
export const SyncedCaption: React.FC<{shotId: string}> = ({shotId}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  const lines: Line[] = (captions as any).shots[shotId] ?? [];
  const li = lines.findIndex(l => t >= l.start - 0.05 && t < l.hold);
  if (li < 0) return null;
  const l = lines[li]; const lf = Math.round((l.start - 0.05) * fps);
  const segs: {s: string; kw?: KW}[] = []; let p = 0;
  [...l.keywords].sort((a, b) => a.i - b.i).forEach(k => { if (k.i > p) segs.push({s: l.text.slice(p, k.i)}); segs.push({s: k.w, kw: k}); p = k.i + k.w.length; });
  if (p < l.text.length) segs.push({s: l.text.slice(p)});
  const kwc = l.keywords.reduce((a, k) => a + k.w.length, 0);
  const fs = Math.max(CAPTION.min, Math.min(CAPTION.base, Math.floor((SAFE.x1 - SAFE.x0 - 60) / (l.text.length + 0.2 * kwc)))); const inP = interpolate(f, [lf, lf + 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, bottom: 1920 - SAFE.y1 + 10, zIndex: 85, display: 'flex', justifyContent: 'center', opacity: inP}}>
      <div style={{fontFamily: FONT_SANS, fontSize: fs, fontWeight: 700, color: C.ink, lineHeight: 1.35, padding: '6px 26px 10px', background: 'rgba(241,228,204,.92)',
        borderRadius: 12, border: `3px solid ${C.brass}`, whiteSpace: 'nowrap', boxShadow: '0 6px 0 rgba(32,60,58,.18)'}}>
        {segs.map((g, i) => {
          if (!g.kw) return <span key={i}>{g.s}</span>;
          const kt = g.kw.t; // 来自配音逐字时间戳：念到这个词的第一个字时点亮
          const sp = spring({frame: f - Math.round(kt * fps), fps, config: {damping: 9, stiffness: 220}});
          const on = f >= Math.round(kt * fps); const sc = on ? 0.833 + 0.167 * sp : 1;
          return <span key={i} style={{display: 'inline-block', color: on ? (g.kw.c === 'red' ? C.red : C.amber) : C.ink, fontWeight: on ? 900 : 700, fontSize: on ? fs * 1.2 : fs, transform: `scale(${sc})`, margin: `0 ${on ? 2 : 0}px`,
            textShadow: `0 0 0 ${C.cream}`, WebkitTextStroke: `1.5px ${C.cream}`, paintOrder: 'stroke fill', transformOrigin: '50% 70%'}}>{g.s}</span>;
        })}
      </div>
    </div>
  );
};
