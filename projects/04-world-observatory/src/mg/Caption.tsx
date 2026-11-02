import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {C, CAPTION, FONT_SANS, SAFE} from '../core/tokens';
import {clamp} from './anim';
// 口播字幕：按标点切句，按字数分配时长；每行 ≤14 字、最多 2 行，底边贴安全区下沿
export const splitNarration = (text: string, max = CAPTION.maxCharsPerLine * CAPTION.maxLines) => {
  const parts = text.split(/(?<=[，。？！；：、])/).map(s => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last && (last + p).replace(/[，。？！；：、]/g, '').length <= 14) out[out.length - 1] = last + p; else out.push(p);
  }
  return out.flatMap(s => { const r: string[] = []; for (let i = 0; i < s.length; i += max) r.push(s.slice(i, i + max)); return r; });
};
const wrap = (s: string) => { const t = s.replace(/[，。；：、]$/, ''); const n = CAPTION.maxCharsPerLine; return t.length <= n ? [t] : [t.slice(0, Math.ceil(t.length / 2)), t.slice(Math.ceil(t.length / 2))]; };
export const NarrationCaption: React.FC<{text: string; frames: number; size?: number}> = ({text, frames, size = CAPTION.base}) => {
  const f = useCurrentFrame(); const chunks = splitNarration(text);
  const total = chunks.reduce((a, c) => a + c.length, 0); let acc = 0;
  const idx = chunks.findIndex(c => { acc += c.length; return f < (acc / total) * frames; });
  const cur = chunks[idx < 0 ? chunks.length - 1 : idx]; const fs = Math.max(CAPTION.min, Math.min(CAPTION.max, size));
  const o = interpolate(f, [0, 4], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, bottom: 1920 - SAFE.y1, zIndex: 85, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o}}>
      {wrap(cur).map((l, i) => (
        <div key={i} style={{fontFamily: FONT_SANS, fontSize: fs, fontWeight: 800, color: C.ink, lineHeight: 1.3, padding: '2px 18px',
          background: 'rgba(241,228,204,.88)', borderRadius: 8, marginTop: 6, WebkitTextStroke: `0px`, whiteSpace: 'nowrap'}}>{l}</div>
      ))}
    </div>
  );
};
