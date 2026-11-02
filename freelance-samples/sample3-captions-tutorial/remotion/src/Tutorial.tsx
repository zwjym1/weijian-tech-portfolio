import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, Easing, interpolate, spring} from 'remotion';
import tl from './timeline.json';
import {DarkBg, LightLeak, Burst, DrawCheck, lemo} from './fx';
/* Sample 3 — screen tutorial. Real Shotcut 26.9.27 recording (x11grab), camera = auto-zoom to logged clicks. */
const FPS = 30; const CUES = tl.cues as any[]; const SEGS = tl.segs as any[]; const SC = tl.scenes as any[];
const END = Math.round(tl.duration * FPS);
const K = {bg:'#0E1220', ink:'#F5F7FB', sub:'#9AA3B8', smash:'#FF5D5D', slot:'#FFC93C', check:'#2BD99F', blue:'#5B8CFF', dim:'#2A3350'};
const FONT = 'Inter, Lato, sans-serif';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const io = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing:ease});
const sp = (fr: number, at: number, d = 14, st = 170) => spring({frame: fr - at, fps: FPS, config:{damping:d, stiffness:st, mass:0.7}});
const CHAPS = ['Import', 'Add captions', 'Check timing', 'Reposition', 'Export'];
const CHAP_COL = [K.blue, K.smash, K.slot, K.check, '#B98CFF'];
const INTRO_END = Math.round(SC[0].end * FPS); const OUTRO_START = Math.round(SC[1].start * FPS);
const cueStart = (n: number) => Math.round(CUES[n].start * FPS);

/* ---------- camera: precomputed, smoothed per frame ---------- */
const HOLD: Record<string, [number, number, number]> = {s01:[1030, 420, 1.25], s09:[1030, 420, 1.55], s15:[1030, 420, 1.55]};
const CAM: {x: number; y: number; z: number}[] = (() => {
  const clicks = SEGS.flatMap(s => s.clicks.map((c: any) => ({...c, seg:s.id})));
  const out: any[] = []; let cx = 960, cy = 540, cz = 1;
  for (let f = 0; f < END; f++) {
    const t = f / FPS; let tx = 960, ty = 540, tz = 1;
    const seg = SEGS.find(s => t >= s.start && t < s.start + s.dur);
    if (seg && HOLD[seg.id] && t > seg.start + 1.6) { [tx, ty, tz] = HOLD[seg.id]; }
    const up = clicks.find(c => c.t >= t && c.t - t < 0.5), past = [...clicks].reverse().find(c => c.t <= t && t - c.t < 2.0);
    const c = up || past; if (c && !(seg && HOLD[seg.id] && t > seg.start + 1.6 && seg.id !== 's15')) { tx = c.x; ty = c.y; tz = 1.6; }
    const a = 0.09; cx += (tx - cx) * a; cy += (ty - cy) * a; cz += (tz - cz) * a;
    const hw = 960 / cz, hh = 540 / cz;
    out.push({x: Math.min(1920 - hw, Math.max(hw, cx)), y: Math.min(1080 - hh, Math.max(hh, cy)), z: cz});
  }
  return out; })();

const FX = 160, FY = 86, FW = 1600, FH = 900; const S0 = FW / 1920;
const Screen = () => { const fr = useCurrentFrame(); const t = fr / FPS; const c = CAM[Math.min(fr, END - 1)];
  const enter = io(fr, INTRO_END - 6, INTRO_END + 14), leave = 1 - io(fr, OUTRO_START - 4, OUTRO_START + 12);
  const k = Math.min(enter, leave); if (k <= 0) return null;
  return <div style={{position:'absolute', left:FX, top:FY, width:FW, height:FH, borderRadius:20, overflow:'hidden', opacity:k,
      transform:`scale(${0.92 + 0.08 * k}) translateY(${(1 - k) * 40}px)`, boxShadow:'0 30px 90px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.08)'}}>
    <div style={{position:'absolute', left:0, top:0, width:1920, height:1080, transformOrigin:'0 0',
        transform:`scale(${S0 * c.z}) translate(${-(c.x - 960 / c.z)}px, ${-(c.y - 540 / c.z)}px)`}}>
      {SEGS.map(s => <Sequence key={s.id} from={Math.round(s.start * FPS)} durationInFrames={Math.round(s.dur * FPS)}>
        <OffthreadVideo src={staticFile('rec.mp4')} startFrom={Math.round(s.recStart * FPS)} playbackRate={s.rate} muted
          style={{width:1920, height:1080}}/></Sequence>)}
      {SEGS.flatMap(s => s.clicks).map((cl: any, i: number) => { const d = t - cl.t; if (d < -0.05 || d > 0.7) return null; const p = Math.max(0, d) / 0.7;
        return <div key={i} style={{position:'absolute', left:cl.x - 60, top:cl.y - 60, width:120, height:120, borderRadius:60,
          border:`${6 / c.z}px solid ${K.slot}`, opacity:1 - p, transform:`scale(${0.2 + p * 0.9})`, boxShadow:`0 0 24px ${K.slot}`}}/>; })}
    </div>
    {SEGS.filter(s => s.rate !== 1).map(s => { const a = io(fr, s.start * FPS, s.start * FPS + 8) * (1 - io(fr, (s.start + s.dur) * FPS - 8, (s.start + s.dur) * FPS));
      return a > 0 ? <div key={s.id} style={{position:'absolute', right:24, bottom:24, padding:'8px 16px', borderRadius:12, background:'rgba(5,7,13,0.85)', color:K.slot, fontSize:26, fontWeight:900, opacity:a}}>2× SPEED</div> : null; })}
  </div>; };

const TopBar = () => { const fr = useCurrentFrame(); const t = fr / FPS;
  const k = Math.min(io(fr, INTRO_END, INTRO_END + 16), 1 - io(fr, OUTRO_START - 4, OUTRO_START + 10)); if (k <= 0) return null;
  const seg = SEGS.find(s => t >= s.start && t < s.start + s.dur) || SEGS[SEGS.length - 1]; const idx = SEGS.indexOf(seg);
  const segIn = Math.round(seg.start * FPS); const pop = sp(fr, segIn);
  return <div style={{position:'absolute', left:FX, top:18, width:FW, height:52, display:'flex', alignItems:'center', gap:14, opacity:k}}>
    <div style={{padding:'8px 16px', borderRadius:12, background:CHAP_COL[seg.chap - 1], color:K.bg, fontSize:24, fontWeight:900, transform:`scale(${0.85 + 0.15 * pop})`}}>STEP {idx + 1}</div>
    <div style={{fontSize:30, fontWeight:800, color:K.ink, opacity:io(fr, segIn, segIn + 8), transform:`translateX(${(1 - io(fr, segIn, segIn + 10)) * -20}px)`}}>{seg.label}</div>
    <div style={{marginLeft:'auto', display:'flex', gap:8}}>{CHAPS.map((c, i) => { const on = i + 1 === seg.chap, done = i + 1 < seg.chap;
      return <div key={i} style={{padding:'6px 14px', borderRadius:10, fontSize:20, fontWeight:800, background: on ? CHAP_COL[i] : done ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', color: on ? K.bg : done ? K.ink : K.sub, display:'flex', alignItems:'center', gap:6}}>
        {done && <DrawCheck p={1} size={16}/>}{c}</div>; })}</div>
  </div>; };

const Intro = () => { const fr = useCurrentFrame(); if (fr > INTRO_END + 16) return null; const out = 1 - io(fr, INTRO_END - 8, INTRO_END + 8);
  const a = sp(fr, 4), b = sp(fr, cueStart(1)), steps = cueStart(2);
  const typed = 'Captions make it easy to follow.'; const n = Math.floor(Math.max(0, fr - 30) / 2.2);
  return <AbsoluteFill style={{opacity:out}}>
    <div style={{position:'absolute', left:140, top:150, width:820}}>
      <div style={{fontSize:30, fontWeight:900, letterSpacing:6, color:K.slot, opacity:a}}>SCREEN TUTORIAL · SHOTCUT</div>
      <div style={{fontSize:96, fontWeight:900, color:K.ink, lineHeight:1.0, letterSpacing:-3, marginTop:18, transform:`translateY(${(1 - a) * 60}px)`, opacity:a}}>How to add<br/><span style={{color:K.smash}}>captions</span> to a video</div>
      <div style={{fontSize:34, fontWeight:700, color:K.sub, marginTop:26, opacity:b, transform:`translateY(${(1 - b) * 20}px)`}}>Free, open-source editor · no plugins · 5 steps</div>
    </div>
    {/* visual anchor: a mini "video" whose caption types itself */}
    <div style={{position:'absolute', left:1040, top:170, width:740, height:416, borderRadius:24, background:'linear-gradient(135deg,#1C2440,#2A1F3A)', overflow:'hidden', boxShadow:'0 40px 90px rgba(0,0,0,0.55)', transform:`rotate(${-2 + a * 2}deg) scale(${0.8 + 0.2 * a})`, opacity:a}}>
      <div style={{position:'absolute', left:330, top:150, width:80, height:80, borderRadius:40, background:'rgba(255,255,255,0.15)', display:'grid', placeItems:'center'}}>
        <div style={{width:0, height:0, borderLeft:'28px solid #fff', borderTop:'17px solid transparent', borderBottom:'17px solid transparent', marginLeft:8}}/></div>
      <div style={{position:'absolute', left:0, right:0, bottom:34, display:'flex', justifyContent:'center'}}>
        <div style={{padding:'10px 22px', borderRadius:12, background:'rgba(0,0,0,0.8)', color:'#fff', fontSize:34, fontWeight:800, minHeight:42}}>{typed.slice(0, n)}<span style={{opacity:Math.floor(fr / 12) % 2}}>|</span></div></div>
      <div style={{position:'absolute', left:20, top:18, padding:'6px 12px', borderRadius:8, background:K.smash, color:'#fff', fontSize:20, fontWeight:900}}>🔇 SOUND OFF</div>
    </div>
    <div style={{position:'absolute', left:140, top:640, display:'flex', gap:18}}>{CHAPS.map((c, i) => { const k = sp(fr, steps + i * 9);
      return <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'16px 24px', borderRadius:18, background:'rgba(255,255,255,0.06)', border:`2px solid ${CHAP_COL[i]}`, transform:`translateY(${(1 - k) * 80}px) scale(${0.6 + 0.4 * k})`, opacity:Math.min(1, k * 1.5)}}>
        <div style={{width:40, height:40, borderRadius:20, background:CHAP_COL[i], color:K.bg, display:'grid', placeItems:'center', fontSize:22, fontWeight:900}}>{i + 1}</div>
        <div style={{fontSize:30, fontWeight:800, color:K.ink}}>{c}</div></div>; })}</div>
    <Burst x={1410} y={380} at={8} colors={[K.slot, K.smash, K.blue]} n={16} r={120}/>
  </AbsoluteFill>; };

const Outro = () => { const fr = useCurrentFrame(); if (fr < OUTRO_START - 4) return null; const f = fr - OUTRO_START; const a = sp(fr, OUTRO_START + 4);
  return <AbsoluteFill style={{opacity:io(fr, OUTRO_START - 4, OUTRO_START + 10)}}>
    <div style={{position:'absolute', left:0, right:0, top:150, textAlign:'center', fontSize:96, fontWeight:900, color:K.ink, letterSpacing:-3, transform:`scale(${0.8 + 0.2 * a})`, opacity:a}}>That's the whole <span style={{color:K.check}}>process</span>.</div>
    <div style={{position:'absolute', left:0, right:0, top:380, display:'flex', justifyContent:'center', gap:22}}>{CHAPS.map((c, i) => { const k = sp(fr, OUTRO_START + 14 + i * 8);
      return <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'18px 26px', borderRadius:18, background:CHAP_COL[i], transform:`translateY(${(1 - k) * 60}px)`, opacity:Math.min(1, k * 1.5)}}>
        <div style={{width:40, height:40, borderRadius:20, background:'rgba(0,0,0,0.25)', display:'grid', placeItems:'center'}}><DrawCheck p={io(fr, OUTRO_START + 20 + i * 8, OUTRO_START + 34 + i * 8) * 1.4} size={26}/></div>
        <div style={{fontSize:32, fontWeight:900, color:K.bg}}>{c}</div></div>; })}</div>
    <div style={{position:'absolute', left:0, right:0, top:600, textAlign:'center', fontSize:28, color:K.sub, lineHeight:1.6, opacity:io(fr, OUTRO_START + 60, OUTRO_START + 80)}}>
      Personal sample · screen recorded in Shotcut 26.9.27 (GPL, free) · voice: Kokoro-82M (Apache-2.0)<br/>
      Music: "Inspired" Kevin MacLeod (incompetech.com) · Licensed under Creative Commons: By Attribution 4.0 License<br/>http://creativecommons.org/licenses/by/4.0/</div>
    <Burst x={960} y={430} at={OUTRO_START + 50} colors={[K.check, K.slot, K.blue]} n={18} r={160}/>
  </AbsoluteFill>; };

const KEY = /^(Open|File|Subtitles|OK|Current|Set|End|Start|Burn|Filters|Export|Default|Enter|Jobs)\b/;
const Captions = () => { const fr = useCurrentFrame(); const t = fr / FPS;
  const cur = CUES.find((c, i) => t >= c.start - 0.03 && t < (i + 1 < CUES.length ? Math.min(c.end + 0.35, CUES[i + 1].start - 0.03) : c.end + 0.5)); if (!cur) return null;
  const a = io(fr, cur.start * FPS - 2, cur.start * FPS + 3); const inScreen = t > SC[0].end && t < SC[1].start;
  return <div style={{position:'absolute', left:40, right:40, bottom: inScreen ? 16 : 90, display:'flex', justifyContent:'center', opacity:a, transform:`translateY(${(1 - a) * 8}px)`}}>
    <div style={{padding:'10px 24px', borderRadius:14, background:'rgba(5,7,13,0.9)', color:'#fff', fontSize:inScreen ? 32 : 38, fontWeight:700, lineHeight:1.25, textAlign:'center', maxWidth:1820, whiteSpace:'nowrap'}}>
      {cur.text.split(' ').map((w: string, i: number) => <span key={i} style={{color: inScreen && KEY.test(w) ? K.slot : '#fff'}}>{w}{' '}</span>)}</div></div>; };

export const Tutorial = () => { const fr = useCurrentFrame();
  return <AbsoluteFill style={{fontFamily:FONT, background:K.bg}}>
    <DarkBg tint={fr < INTRO_END ? [1, .36, .36] : fr < OUTRO_START ? [.36, .55, 1] : [.17, .85, .62]}/>
    <Intro/><Screen/><TopBar/><Outro/>
    <LightLeak at={INTRO_END - 10} dur={20} tint={[.36, .55, 1]}/><LightLeak at={OUTRO_START - 10} dur={20} tint={[.17, .85, .62]}/>
    <div style={{position:'absolute', right:30, top: fr < INTRO_END || fr >= OUTRO_START ? 26 : 1, fontSize: fr < INTRO_END || fr >= OUTRO_START ? 18 : 14, fontWeight:800, color:'rgba(255,255,255,0.45)', letterSpacing:2}}>PERSONAL SAMPLE</div>
    <Captions/>
    <Audio src={staticFile('mix.wav')}/>
  </AbsoluteFill>; };

export const Cover = () => <AbsoluteFill style={{fontFamily:FONT, background:K.bg}}><DarkBg tint={[.36, .55, 1]}/>
  <div style={{position:'absolute', left:110, top:140, width:860}}>
    <div style={{fontSize:32, fontWeight:900, letterSpacing:6, color:K.slot}}>SHOTCUT TUTORIAL</div>
    <div style={{fontSize:120, fontWeight:900, color:K.ink, lineHeight:0.98, letterSpacing:-4, marginTop:20}}>Add <span style={{color:K.smash}}>captions</span><br/>to any video</div>
    <div style={{fontSize:40, fontWeight:800, color:K.sub, marginTop:30}}>5 steps · free & open-source</div></div>
  <div style={{position:'absolute', left:1000, top:250, width:820, height:461, borderRadius:24, overflow:'hidden', transform:'rotate(3deg)', boxShadow:'0 40px 90px rgba(0,0,0,0.6)'}}>
    <img src={staticFile('cover_shot.png')} style={{width:820, height:461}}/></div>
  <div style={{position:'absolute', left:1090, top:640, padding:'12px 26px', borderRadius:14, background:'rgba(0,0,0,0.85)', color:'#fff', fontSize:38, fontWeight:800, transform:'rotate(3deg)', border:`3px solid ${K.slot}`}}>Write the essay.</div>
  <div style={{position:'absolute', left:110, bottom:80, display:'flex', gap:12}}>{CHAPS.map((c, i) => <div key={i} style={{padding:'10px 18px', borderRadius:12, background:CHAP_COL[i], color:K.bg, fontSize:26, fontWeight:900}}>{i + 1} {c}</div>)}</div>
  <div style={{position:'absolute', right:30, top:26, fontSize:18, fontWeight:800, color:'rgba(255,255,255,0.45)', letterSpacing:2}}>PERSONAL SAMPLE</div>
</AbsoluteFill>;
