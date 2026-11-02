import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, Easing} from 'remotion';
import tl from './timeline.json';
import {DarkBg, LightLeak, Burst, Pulse, DrawCheck, lemo} from './fx';

/* Attention-engine cut (v3). Motion rules from claude-motion-design (MIT); utils lemo-opuscar (MIT); shader noise + light-leak hyperframes (Apache-2.0). */
const FPS = 30; const CUES = tl.cues as any[]; const LS = tl.lineStart as number[];
const L = (i: number) => Math.round(LS[i] * FPS);
const S = (line: number, sent = 0) => { const c = CUES.find(c => c.line === line && c.sent === sent); return Math.round(c.start * FPS); };
const E = (line: number) => { const cs = CUES.filter(c => c.line === line); return Math.round(cs[cs.length - 1].end * FPS); };
const END = Math.round(tl.duration * FPS);
const K = {bg:'#0E1220', ink:'#F5F7FB', sub:'#9AA3B8', card:'#FFFFFF', cardInk:'#121626', smash:'#FF5D5D', slot:'#FFC93C', check:'#2BD99F', blue:'#5B8CFF', dim:'#2A3350'};
const FONT = 'Inter, Lato, sans-serif';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const io = (fr: number, a: number, b: number, from = 0, to = 1) => interpolate(fr, [a, b], [from, to], {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: ease});
const sp = (fr: number, at: number, d = 14, st = 170) => spring({frame: fr - at, fps: FPS, config: {damping: d, stiffness: st, mass: 0.7}});
const win = (fr: number, a: number, b: number, fi = 8, fo = 7) => Math.min(io(fr, a, a + fi), 1 - io(fr, b - fo, b));
const SC = ['hook','promise','smash','slot','check','recap'];
const scStart = (id: string) => Math.round((CUES.find(c => c.scene === id).start - 0.5) * FPS);
const scEnd = (id: string) => { const k = SC.indexOf(id); return k === SC.length - 1 ? END : scStart(SC[k + 1]); };
const TINT: Record<string, [number, number, number]> = {hook:[1,.36,.36], promise:[.36,.55,1], smash:[1,.36,.36], slot:[1,.79,.24], check:[.17,.85,.62], recap:[.36,.55,1]};

// impact frames -> camera shake (anchors the eye with physical "hits")
const IMPACTS: number[] = [];
const shakeAt = (fr: number) => { let x = 0, y = 0; for (const a of IMPACTS) { const t = fr - a; if (t >= 0 && t < 12) { const k = (1 - t / 12) * 10; x += Math.sin(t * 2.7) * k; y += Math.cos(t * 3.1) * k * 0.6; } } return {x, y}; };

const Icon = ({name, size = 56, color = K.cardInk, sw = 5}: {name: string; size?: number; color?: string; sw?: number}) => {
  const p: Record<string, React.ReactNode> = {
    hammer: <><path d="M30 26L10 46l8 8 20-20"/><path d="M26 16l14-6 14 14-6 14-8-8-6 2-6-6 2-6z"/></>,
    grid: <><rect x="8" y="10" width="48" height="44" rx="6"/><path d="M8 24h48M24 24v30M40 24v30M8 39h48"/></>,
    check: <><path d="M14 33l12 12 24-26"/></>,
    clock: <><circle cx="32" cy="32" r="24"/><path d="M32 18v14l10 6"/></>,
    doc: <><rect x="12" y="6" width="40" height="52" rx="6"/><path d="M20 22h24M20 32h24M20 42h14"/></>,
    book: <><path d="M8 12h18a6 6 0 0 1 6 6v36a5 5 0 0 0-5-5H8z"/><path d="M56 12H38a6 6 0 0 0-6 6v36a5 5 0 0 1 5-5h19z"/></>,
    quiz: <><circle cx="32" cy="32" r="24"/><path d="M25 25a7 7 0 1 1 9 7c-2 1-2 2-2 5"/><circle cx="32" cy="45" r="1.5"/></>,
    alert: <><path d="M32 8L4 56h56z"/><path d="M32 26v14"/><circle cx="32" cy="48" r="1.5"/></>,
    flag: <><path d="M14 58V8M14 10h32l-6 10 6 10H14"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>; };

const Abs: React.FC<{x: number; y: number; w?: number; center?: boolean; style?: React.CSSProperties; children?: React.ReactNode}> = ({x, y, w, center, style, children}) =>
  <div style={{position:'absolute', left: center ? x - (w ?? 0) / 2 : x, top: y, width: w, textAlign: center ? 'center' : undefined, ...style}}>{children}</div>;

// kinetic slam text (scale-down spring + glow)
const Slam = ({fr, at, text, size, color = K.ink, y, out = 99999, weight = 900}: {fr: number; at: number; text: string; size: number; color?: string; y: number; out?: number; weight?: number}) => {
  const k = sp(fr, at, 12, 220); const o = Math.min(1, k * 2) * (1 - io(fr, out, out + 6)); if (fr < at - 1 || o <= 0) return null;
  return <Abs x={960} w={1800} y={y} center style={{fontSize:size, fontWeight:weight, color, letterSpacing: -size * 0.03, lineHeight:1, opacity:o, transform:`scale(${1 + (1 - k) * 0.9})`, textShadow:`0 0 ${40 * (1 - k) + 18}px ${color}55`}}>{text}</Abs>; };

const Tile = ({text, color, w = 420, h = 92, size = 36, icon, style}: {text: string; color: string; w?: number; h?: number; size?: number; icon?: string; style?: React.CSSProperties}) =>
  <div style={{width:w, height:h, borderRadius:18, background:K.card, color:K.cardInk, display:'flex', alignItems:'center', gap:16, padding:'0 22px', boxSizing:'border-box', fontSize:size, fontWeight:800, boxShadow:`0 14px 30px rgba(0,0,0,0.35), inset 6px 0 0 ${color}`, ...style}}>
    {icon && <Icon name={icon} size={size * 1.2} color={color}/>}<span style={{whiteSpace:'nowrap'}}>{text}</span></div>;

const Chip = ({fr, at, n, label, color}: {fr: number; at: number; n: number; label: string; color: string}) => { const k = sp(fr, at);
  return <div style={{position:'absolute', left:90, top:60, display:'flex', alignItems:'center', gap:16, opacity:k, transform:`translateX(${(1 - k) * -80}px)`}}>
    <div style={{padding:'8px 16px', borderRadius:12, background:color, color:K.bg, fontSize:26, fontWeight:900, letterSpacing:2}}>MOVE {n}</div>
    <div style={{fontSize:34, fontWeight:900, color:K.ink, letterSpacing:1}}>{label}</div></div>; };

// full-screen section wipe = pattern interrupt
const Wipe = ({fr, at, n, title, color, icon}: {fr: number; at: number; n: number; title: string; color: string; icon: string}) => {
  const a = io(fr, at - 4, at + 8), b = io(fr, at + 52, at + 62); if (fr < at - 5 || fr > at + 63) return null;
  const k = sp(fr, at + 4, 11, 200);
  return <AbsoluteFill style={{clipPath:`inset(0 ${(1 - a) * 100}% 0 ${b * 100}%)`, background:color}}>
    <AbsoluteFill style={{justifyContent:'center', alignItems:'center', transform:`translateX(${(1 - k) * 200 - b * 300}px)`}}>
      <div style={{fontSize:40, fontWeight:900, color:K.bg, letterSpacing:10, opacity:0.8}}>MOVE {n}</div>
      <div style={{display:'flex', alignItems:'center', gap:30, marginTop:10}}><Icon name={icon} size={150} color={K.bg} sw={6}/>
        <div style={{fontSize:190, fontWeight:900, color:K.bg, letterSpacing:-6}}>{title}</div></div>
    </AbsoluteFill></AbsoluteFill>; };

const Spot = ({fr, a, b, x, y, r}: {fr: number; a: number; b: number; x: number; y: number; r: number}) => { const o = win(fr, a, b, 10, 10); if (o <= 0) return null;
  return <AbsoluteFill style={{background:`radial-gradient(circle ${r}px at ${x}px ${y}px, transparent 0, transparent ${r * 0.85}px, rgba(8,10,18,${0.72 * o}) ${r}px)`}}/>; };

const Scene: React.FC<{id: string; children: (fr: number) => React.ReactNode}> = ({id, children}) => { const fr = useCurrentFrame();
  const a = scStart(id), b = scEnd(id); if (fr < a - 2 || fr > b + 2) return null;
  const inP = sp(fr, a, 20, 120), outP = Math.pow(io(fr, b - 10, b), 1.5);
  const t = (fr - a) / FPS; const dx = (lemo.vnoise(t * 0.35) - 0.5) * 14, dy = (lemo.vnoise(t * 0.3 + 9) - 0.5) * 10;
  const x = (1 - inP) * 240 - outP * 340, blur = (1 - inP) * 10 + outP * 18;
  return <AbsoluteFill style={{opacity: Math.min(1, inP * 1.4) * (1 - outP), filter: blur > 0.3 ? `blur(${blur}px)` : undefined, transform:`translate(${x + dx}px, ${dy}px)`}}>{children(fr)}</AbsoluteFill>; };

/* ================= HOOK ================= */
const Hook = () => <Scene id="hook">{fr => { const l2 = L(2), l3 = L(3);
  const tilesOut = io(fr, l2, l2 + 14); const phone = win(fr, l2 + 4, S(3, 0) + 6, 12, 8);
  const hourP = io(fr, l2 + 10, E(2) - 6); const hrs = Math.floor(hourP * 60);
  const block = sp(fr, S(3, 1), 10, 160);
  return <>
    {/* cold open: three slams */}
    <Slam fr={fr} at={S(0,0)} text="SUNDAY NIGHT." size={110} y={230} out={L(1) - 4}/>
    <Slam fr={fr} at={S(0,1)} text="3 DEADLINES." size={150} color={K.smash} y={380} out={L(1) - 4}/>
    <Slam fr={fr} at={S(0,2)} text="0 PLAN." size={230} color={K.slot} y={560} out={L(1) - 4}/>
    {[S(0,0), S(0,1), S(0,2)].map((a, i) => <Pulse key={i} x={960} y={[285, 455, 675][i]} at={a} color={[K.ink, K.smash, K.slot][i]} size={700}/>)}
    {/* the three tasks */}
    {[['Essay','doc',K.smash], ['Read 2 chapters','book',K.blue], ['Quiz · Friday','quiz',K.slot]].map(([t, ic, c], i) => { const k = sp(fr, S(1, i), 11, 200);
      if (fr < S(1, i) - 1) return null; const x = 960 + (i - 1) * 540 - tilesOut * 300, o = Math.min(1, k * 2) * (1 - tilesOut * 0.75) * (1 - io(fr, S(3,0), S(3,0) + 10));
      return <div key={i} style={{position:'absolute', left: x - 240, top: 380 + (1 - k) * -300, opacity:o, transform:`rotate(${(i - 1) * 4 * (1 - tilesOut) + (1 - k) * 15}deg) scale(${1 - tilesOut * 0.35})`}}>
        <Tile text={t as string} color={c as string} icon={ic as string} w={480} h={150} size={46}/></div>; })}
    {/* pattern interrupt: endless scroll */}
    {phone > 0 && <div style={{position:'absolute', left:1040, top:120, width:380, height:720, borderRadius:48, background:'#05070D', border:'10px solid #2A3350', overflow:'hidden', opacity:phone, transform:`translateY(${(1 - phone) * 120}px) rotate(${(1 - phone) * 6}deg)`}}>
      {Array.from({length: 14}).map((_, i) => { const yy = ((i * 170 - (fr - l2) * 22) % (14 * 170) + 14 * 170) % (14 * 170) - 170;
        return <div key={i} style={{position:'absolute', left:20, top:yy, width:320, height:150, borderRadius:20, background:['#FF5D5D','#5B8CFF','#FFC93C','#2BD99F','#B07BFF'][i % 5], opacity:0.85}}/>; })}
    </div>}
    {phone > 0 && <Abs x={560} y={360} w={420} style={{opacity:phone, textAlign:'right'}}>
      <div style={{fontSize:40, fontWeight:800, color:K.sub}}>scrolling…</div>
      <div style={{fontSize:150, fontWeight:900, color:K.ink, fontVariantNumeric:'tabular-nums', letterSpacing:-4}}>{hrs === 60 ? '1:00' : `0:${String(hrs).padStart(2, '0')}`}</div>
      <div style={{fontSize:34, fontWeight:700, color:K.smash}}>{hourP > 0.98 ? 'nothing started' : ''}</div></Abs>}
    {/* reframe + the BIG block */}
    <Slam fr={fr} at={S(3,0)} text="It's not you." size={90} color={K.sub} y={150} weight={800}/>
    {fr >= S(3, 1) - 1 && <div style={{position:'absolute', left:960 - 380, top: 330 + (1 - block) * -700, width:760, height:380, borderRadius:28, background:K.smash, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', boxShadow:'0 40px 80px rgba(0,0,0,0.5)', transform:`scale(${1 + Math.sin(fr / 4) * 0.004})`}}>
      <div style={{fontSize:30, fontWeight:900, letterSpacing:6, color:K.bg, opacity:0.75}}>THE BIG TASK</div>
      <div style={{fontSize:96, fontWeight:900, color:'#fff', letterSpacing:-3}}>WRITE THE ESSAY</div>
      <div style={{marginTop:14, padding:'8px 20px', borderRadius:12, background:K.bg, color:K.slot, fontSize:32, fontWeight:900, opacity:io(fr, S(3,1) + 18, S(3,1) + 26), transform:`rotate(-3deg) scale(${lemo.back(lemo.seg(fr, S(3,1) + 18, S(3,1) + 28))})`}}>TOO BIG TO START</div></div>}
  </>; }}</Scene>;

/* ================= PROMISE ================= */
const MOVES = [['SMASH IT','hammer',K.smash], ['SLOT IT','grid',K.slot], ['CHECK IT','check',K.check]] as const;
const Promise_ = () => <Scene id="promise">{fr => { const l4 = L(4), l5 = L(5), l6 = L(6);
  const p4 = win(fr, l4, l5, 10, 8); const shrink = io(fr, l6, l6 + 14);
  return <>
    {p4 > 0 && <div style={{opacity:p4}}>
      <div style={{position:'absolute', left:180, top:330, width:520, height:260, borderRadius:24, background:K.smash, display:'grid', placeItems:'center', transform:`rotate(${Math.sin(fr / 6) * 1.2}deg)`}}><div style={{fontSize:56, fontWeight:900, color:'#fff'}}>THE MESS</div></div>
      <svg style={{position:'absolute', left:740, top:420}} width="440" height="80"><path d="M10 40 H400 M370 12 L410 40 L370 68" stroke={K.ink} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="520" strokeDashoffset={520 * (1 - io(fr, l4 + 10, l4 + 30))}/></svg>
      <div style={{position:'absolute', left:1220, top:300, opacity:io(fr, l4 + 24, l4 + 34)}}>{Array.from({length: 7}).map((_, d) => <div key={d} style={{position:'absolute', left:d * 74, top:0, width:64, height:320, borderRadius:12, background:'#1C2338', border:`2px solid ${K.dim}`}}>
        {[0, 1].map(r => <div key={r} style={{position:'absolute', left:8, top:20 + r * 90, width:48, height:70, borderRadius:8, background:[K.smash, K.slot, K.check][(d + r) % 3], opacity: io(fr, l4 + 34 + d * 3, l4 + 44 + d * 3)}}/>)}</div>)}</div>
      <div style={{position:'absolute', left:1500, top:180, padding:'10px 22px', borderRadius:16, background:K.ink, color:K.bg, fontSize:44, fontWeight:900, transform:`scale(${lemo.back(lemo.seg(fr, l4 + 4, l4 + 16))})`}}>3:00</div>
    </div>}
    <Slam fr={fr} at={S(5,0)} text="3 MOVES" size={110} y={170 - shrink * 60} color={K.sub}/>
    <div style={{position:'absolute', top: 380 - shrink * 220, width:'100%', display:'flex', justifyContent:'center', gap:46, transform:`scale(${1 - shrink * 0.35})`}}>
      {MOVES.map(([t, ic, c], i) => { const at = S(5, i + 1); const k = sp(fr, at, 11, 220); if (fr < at - 1) return <div key={i} style={{width:440}}/>;
        return <div key={i} style={{width:440, height:300, borderRadius:30, background:c, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', opacity:Math.min(1, k * 2), transform:`translateY(${(1 - k) * 160}px) scale(${1 + (1 - k) * 0.4})`, boxShadow:`0 0 ${60 * (1 - k) + 30}px ${c}55`}}>
          <Icon name={ic} size={120} color={K.bg} sw={6}/><div style={{fontSize:64, fontWeight:900, color:K.bg, marginTop:10}}>{t}</div></div>; })}
    </div>
    {/* open loop: the mystery slot */}
    {fr > l6 && <div style={{position:'absolute', left:960 - 200, top:560, width:400, height:220, borderRadius:24, border:`5px dashed ${K.slot}`, display:'grid', placeItems:'center', opacity:io(fr, l6 + 8, l6 + 20), boxShadow:`0 0 ${40 + Math.sin(fr / 5) * 20}px ${K.slot}66`, transform:`scale(${0.9 + 0.1 * sp(fr, l6 + 8)})`}}>
      <div style={{fontSize:140, fontWeight:900, color:K.slot, transform:`rotate(${Math.sin(fr / 8) * 8}deg)`}}>?</div></div>}
    {fr > l6 && <div style={{position:'absolute', left:1190, top:600, padding:'8px 18px', borderRadius:12, background:K.ink, color:K.bg, fontSize:28, fontWeight:900, letterSpacing:3, opacity:io(fr, l6 + 30, l6 + 40)}}>COMING UP</div>}
  </>; }}</Scene>;

/* ================= SMASH ================= */
const ESSAY = ['Choose a topic', 'Find three sources', 'Write an outline', 'Draft the intro', 'Draft the body', 'Edit and submit'];
const READ = ['Read chapter 4', 'Read chapter 5', 'Review your notes', 'Practice quiz'];
const Smash = () => <Scene id="smash">{fr => { const l8 = L(8), boom = S(9, 1) + 12;
  const blockK = sp(fr, l8, 11, 170); const broke = fr >= boom; const wob = fr > S(9,0) && !broke ? Math.sin(fr * 1.4) * 4 * io(fr, S(9,0), boom) : 0;
  const cur = [10, 11, 12, 13, 14, 15].findIndex((ln, i, arr) => fr >= L(ln) && (i === arr.length - 1 ? fr < L(16) : fr < L(arr[i + 1])));
  const allOn = fr >= L(16); const right = (txt: string, at: number, out: number, col = K.ink, size = 120) => <Slam fr={fr} at={at} text={txt} size={size} color={col} y={430} out={out}/>;
  const p17 = win(fr, L(17), L(18), 10, 8); const p18 = fr >= L(18); const p19 = win(fr, L(19), scEnd('smash'), 10, 8);
  return <>
    <Chip fr={fr} at={L(7) + 50} n={1} label="SMASH IT" color={K.smash}/>
    {/* big block, then explode */}
    {!broke && fr >= l8 - 1 && <div style={{position:'absolute', left:960 - 380 + wob, top:330 + (1 - blockK) * -600, width:760, height:380, borderRadius:28, background:K.smash, display:'grid', placeItems:'center', boxShadow:'0 40px 80px rgba(0,0,0,0.5)'}}>
      <div style={{fontSize:96, fontWeight:900, color:'#fff', letterSpacing:-3}}>WRITE THE ESSAY</div>
      {fr > S(9,0) && <svg style={{position:'absolute', inset:0}} width="760" height="380"><path d="M380 0 L350 120 L420 190 L360 280 L400 380 M350 120 L250 150 M420 190 L540 170" stroke={K.bg} strokeWidth="8" fill="none" strokeDasharray="900" strokeDashoffset={900 * (1 - io(fr, S(9,0) + 10, boom))}/></svg>}
    </div>}
    <Burst x={960} y={520} at={boom} colors={[K.smash, '#fff', K.slot]} n={40} r={520} seed={5}/>
    <Pulse x={960} y={520} at={boom} color={K.smash} size={1200}/>
    {/* six tiles: fly from center to list; focus tile big */}
    {broke && ESSAY.map((t, i) => { const k = sp(fr, boom + i * 2, 13, 160); const focus = cur === i, past = cur > i || allOn;
      const tx = interpolate(k, [0, 1], [960 - 230, 120]), ty = interpolate(k, [0, 1], [480, 180 + i * 108]);
      const o = fr >= L(10) ? (focus || allOn ? 1 : past ? 0.75 : 0.35) : 1;
      return <div key={i} style={{position:'absolute', left:tx, top:ty, opacity:o, transform:`scale(${focus ? 1.08 : 1}) rotate(${(1 - k) * (i - 2.5) * 20}deg)`, transformOrigin:'left center'}}>
        <Tile text={t} color={K.smash} w={520} h={88} size={36}/>
        {allOn && <div style={{position:'absolute', left:22, top:68, height:6, borderRadius:3, background:K.smash, width: [118, 70, 85, 90, 90, 70][i] * io(fr, L(16) + 20 + i * 3, L(16) + 30 + i * 3)}}/>}
        {allOn && <div style={{position:'absolute', left:532, top:16, transform:`scale(${lemo.back(lemo.seg(fr, S(16,1) + 10 + i * 3, S(16,1) + 20 + i * 3))})`}}><Icon name="flag" size={52} color={K.check}/></div>}
      </div>; })}
    {/* right-side anchor: echo of the current piece */}
    {[10, 11, 12, 13, 14, 15].map((ln, i) => <React.Fragment key={ln}>{right(ESSAY[i].toUpperCase(), L(ln), (i < 5 ? L(ln + 1) : L(16)) - 4, K.ink, 96)}
      <div style={{position:'absolute', left:1290, top:330, fontSize:34, fontWeight:900, color:K.smash, letterSpacing:4, opacity: win(fr, L(ln), (i < 5 ? L(ln + 1) : L(16)), 6, 4)}}>PIECE {i + 1} / 6</div></React.Fragment>)}
    {fr >= L(16) && fr < L(17) && <><Slam fr={fr} at={S(16,0)} text="6 PIECES" size={150} y={300} color={K.smash} out={L(17) - 5}/>
      <Abs x={1290} y={520} w={640} center style={{fontSize:56, fontWeight:900, color:K.ink, opacity:io(fr, S(16,1), S(16,1) + 10)}}><span style={{color:K.smash}}>VERB</span> + <span style={{color:K.check}}>FINISH LINE</span></Abs></>}
    {/* 5-minute test */}
    {p17 > 0 && <div style={{position:'absolute', left:1000, top:180, width:800, opacity:p17}}>
      <div style={{display:'inline-block', padding:'10px 24px', borderRadius:14, border:`5px solid ${K.slot}`, color:K.slot, fontSize:44, fontWeight:900, letterSpacing:4, transform:`rotate(-4deg) scale(${lemo.back(lemo.seg(fr, L(17), L(17) + 12))})`}}>5-MINUTE TEST</div>
      <svg width="300" height="300" style={{display:'block', margin:'40px 0 0 230px'}}><circle cx="150" cy="150" r="120" stroke={K.dim} strokeWidth="22" fill="none"/>
        <circle cx="150" cy="150" r="120" stroke={K.slot} strokeWidth="22" fill="none" strokeLinecap="round" strokeDasharray={754} strokeDashoffset={754 * io(fr, S(17,1), S(17,2) + 20)} transform="rotate(-90 150 150)"/>
        <text x="150" y="172" textAnchor="middle" fontSize="70" fontWeight="900" fill={K.ink} fontFamily={FONT}>5:00</text></svg>
      <div style={{fontSize:44, fontWeight:900, color:K.smash, marginTop:20, textAlign:'center', opacity:io(fr, S(17,2), S(17,2) + 8)}}>No? Smash it again.</div></div>}
    {/* second block: reading + quiz */}
    {p18 && fr < L(19) + 4 && (() => { const k = sp(fr, S(18,0), 11, 170); const b2 = S(18,1) + 4; const brk = fr >= b2;
      return <>{!brk && <div style={{position:'absolute', left:1080, top:330 + (1 - k) * -500, width:620, height:260, borderRadius:26, background:K.blue, display:'grid', placeItems:'center'}}><div style={{fontSize:70, fontWeight:900, color:'#fff'}}>READING + QUIZ</div></div>}
        <Burst x={1390} y={460} at={b2} colors={[K.blue, '#fff', K.slot]} n={30} r={400} seed={9}/>
        {brk && READ.map((t, i) => { const kk = sp(fr, b2 + i * 2, 13, 160); return <div key={i} style={{position:'absolute', left: interpolate(kk, [0, 1], [1160, 1120]), top: interpolate(kk, [0, 1], [430, 240 + i * 108]), opacity:Math.min(1, kk * 2)}}><Tile text={t} color={K.blue} w={520} h={88} size={36}/></div>; })}</>; })()}
    {/* 3 -> 10 */}
    {p19 > 0 && <AbsoluteFill style={{background:`rgba(8,10,18,${0.82 * p19})`, justifyContent:'center', alignItems:'center'}}>
      <div style={{display:'flex', alignItems:'center', gap:60, opacity:p19}}>
        <div style={{fontSize:300, fontWeight:900, color:K.sub, textDecoration:'line-through', textDecorationColor:K.smash}}>3</div>
        <svg width="200" height="80"><path d="M10 40 H170 M140 12 L180 40 L140 68" stroke={K.ink} strokeWidth="10" fill="none" strokeLinecap="round"/></svg>
        <div style={{fontSize:300, fontWeight:900, color:K.check, transform:`scale(${1 + 0.2 * Math.sin(lemo.seg(fr, S(19,0) + 16, S(19,0) + 40) * Math.PI)})`}}>{Math.round(interpolate(fr, [L(19) + 6, L(19) + 26], [3, 10], {extrapolateLeft:'clamp', extrapolateRight:'clamp'}))}</div></div>
      <div style={{fontSize:48, fontWeight:800, color:K.ink, opacity:p19}}>scary tasks → small pieces</div>
      <Burst x={1250} y={500} at={L(19) + 26} colors={[K.check, K.slot, K.smash, K.blue]} n={36} r={380} seed={4}/></AbsoluteFill>}
    <Wipe fr={fr} at={L(7)} n={1} title="SMASH IT" color={K.smash} icon="hammer"/>
  </>; }}</Scene>;

/* ================= CALENDAR (SLOT + CHECK) ================= */
const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const GX = 130, GY = 250, CW = 238, RH = 150; // 3 rows: AM / PM / EVE  (bottom = 250+450 = 700)
const ROWS = ['AM', 'PM', 'EVE'];
type Taken = {d: number; r: number; label: string; cue: number};
const TAKEN: Taken[] = [
  ...[0,1,2,3].map(d => ({d, r:0, label:'Class', cue:1})), {d:4, r:0, label:'Class', cue:1},
  {d:0, r:1, label:'Work', cue:2}, {d:2, r:1, label:'Work', cue:2}, {d:4, r:1, label:'Work', cue:2}, {d:1, r:1, label:'Class', cue:1}, {d:3, r:1, label:'Class', cue:1},
  {d:4, r:2, label:'Rest', cue:4}, {d:5, r:2, label:'Rest', cue:4}, ...[0,1,2].map(r => ({d:6, r, label:'Rest', cue:4})),
];
type Piece = {id: string; label: string; d: number; r: number; half: 0 | 1; color: string; group: 'read' | 'essay' | 'buffer'};
const PIECES: Piece[] = [
  {id:'r1', label:'Read ch. 4', d:0, r:2, half:0, color:K.blue, group:'read'}, {id:'e1', label:'Choose topic', d:0, r:2, half:1, color:K.smash, group:'essay'},
  {id:'r2', label:'Read ch. 5', d:1, r:2, half:0, color:K.blue, group:'read'}, {id:'e2', label:'Find sources', d:1, r:2, half:1, color:K.smash, group:'essay'},
  {id:'r3', label:'Review notes', d:2, r:2, half:0, color:K.blue, group:'read'}, {id:'e3', label:'Outline', d:2, r:2, half:1, color:K.smash, group:'essay'},
  {id:'r4', label:'Practice quiz', d:3, r:2, half:0, color:K.blue, group:'read'}, {id:'e4', label:'Draft intro', d:3, r:2, half:1, color:K.smash, group:'essay'},
  {id:'e5', label:'Draft body', d:5, r:0, half:0, color:K.smash, group:'essay'}, {id:'e6', label:'Edit + submit', d:5, r:0, half:1, color:K.smash, group:'essay'},
  {id:'buf', label:'BUFFER', d:5, r:1, half:0, color:K.slot, group:'buffer'},
];
const cell = (d: number, r: number, half?: 0 | 1) => ({x: GX + d * CW + 8, y: GY + r * RH + 8 + (half === undefined ? 0 : half * (RH / 2 - 4)), w: CW - 16, h: half === undefined ? RH - 16 : RH / 2 - 12});

const Calendar = ({fr, mode}: {fr: number; mode: 'slot' | 'check'}) => {
  const slot = mode === 'slot';
  const gridK = slot ? sp(fr, L(21), 16, 140) : 1;
  const takenAt = (t: Taken) => slot ? S(22, t.cue) + (t.d % 3) * 2 : -999;
  const openGlow = slot ? io(fr, L(23), L(23) + 12) : 0.4;
  const pieceAt = (p: Piece, i: number) => !slot ? -999 : p.group === 'read' ? S(25, 1) + p.d * 6 : p.group === 'essay' ? L(26) + i * 3 : S(28, 0) + 6;
  const quizAt = slot ? S(25, 1) - 4 : -999;
  // check-mode beats
  const monDone = S(32, 1), tueDone = S(32, 3), late = S(33, 1), move = L(35) + 8;
  const moveP = mode === 'check' ? io(fr, move, move + 34) : 0;
  const crack = mode === 'check' ? L(36) + 14 : 99999;
  return <div style={{position:'absolute', inset:0, opacity:Math.min(1, gridK * 1.5), transform:`translateY(${(1 - gridK) * 120}px)`}}>
    {DAYS.map((dn, d) => <div key={d} style={{position:'absolute', left:GX + d * CW, top:GY - 52, width:CW, textAlign:'center', fontSize:30, fontWeight:900, letterSpacing:3, color: d === 4 ? K.slot : K.sub}}>{dn}</div>)}
    {ROWS.map((r, i) => <div key={r} style={{position:'absolute', left:GX - 74, top:GY + i * RH + RH / 2 - 14, fontSize:22, fontWeight:800, color:K.sub}}>{r}</div>)}
    {DAYS.map((_, d) => ROWS.map((__, r) => { const c = cell(d, r); return <div key={`${d}${r}`} style={{position:'absolute', left:c.x, top:c.y, width:c.w, height:c.h, borderRadius:16, background:'#161C2E', border:`2px solid ${K.dim}`}}/>; }))}
    {/* open (study) slots glow */}
    {PIECES.filter(p => p.half === 0).map(p => { const c = cell(p.d, p.r); return <div key={'g' + p.id} style={{position:'absolute', left:c.x, top:c.y, width:c.w, height:c.h, borderRadius:16, border:`3px dashed ${K.slot}`, opacity:openGlow * (0.6 + 0.4 * Math.sin(fr / 6)), boxShadow:`0 0 24px ${K.slot}44`}}/>; })}
    {TAKEN.map((t, i) => { const at = takenAt(t); const k = slot ? sp(fr, at, 12, 220) : 1; if (slot && fr < at - 1) return null; const c = cell(t.d, t.r);
      return <div key={'t' + i} style={{position:'absolute', left:c.x, top:c.y, width:c.w, height:c.h, borderRadius:16, background:'repeating-linear-gradient(45deg,#2A3350 0 12px,#232B44 12px 24px)', display:'grid', placeItems:'center', fontSize:28, fontWeight:800, color:K.sub, opacity:Math.min(1, k * 2), transform:`scale(${1 + (1 - k) * 0.5})`}}>{t.label}</div>; })}
    {/* quiz flag */}
    {(() => { const k = slot ? sp(fr, quizAt, 10, 200) : 1; if (slot && fr < quizAt - 1) return null; const c = cell(4, 0);
      return <div style={{position:'absolute', left:c.x - 6, top:c.y - 6, width:c.w + 12, height:c.h + 12, borderRadius:18, background:K.slot, color:K.bg, display:'grid', placeItems:'center', fontSize:40, fontWeight:900, transform:`scale(${lemo.back(Math.min(1, k))})`, boxShadow:`0 0 40px ${K.slot}77`}}><div style={{display:'flex', alignItems:'center', gap:10}}><Icon name="quiz" size={46} color={K.bg}/>QUIZ</div></div>; })()}
    {PIECES.map((p, i) => { const at = pieceAt(p, i); const k = slot ? sp(fr, at, 13, 170) : 1; if (slot && fr < at - 1) return null;
      let c = cell(p.d, p.r, p.group === 'buffer' ? undefined : p.half);
      const isOut = p.id === 'e3' && mode === 'check'; const isBuf = p.group === 'buffer';
      let left = c.x, top = c.y + (1 - k) * -260;
      if (isOut) { const t = cell(5, 1); left = interpolate(moveP, [0, 1], [c.x, t.x]); top = interpolate(moveP, [0, 1], [c.y, t.y + 30]) - Math.sin(moveP * Math.PI) * 140; }
      if (isBuf && mode === 'check' && moveP > 0.85) return null;
      const lateOn = isOut && fr > late && moveP < 0.02; const flash = lateOn ? 0.5 + 0.5 * Math.sin((fr - late) / 2.2) : 0;
      const doneAt = p.d === 0 ? monDone : p.d === 1 ? tueDone : 99999; const done = mode === 'check' ? io(fr, doneAt, doneAt + 8) : 0;
      const cracked = mode === 'check' && p.id === 'e5' && fr > crack;
      if (isBuf) return <div key={p.id} style={{position:'absolute', left:c.x, top:c.y, width:c.w, height:c.h, borderRadius:16, border:`4px dashed ${K.slot}`, background:'#2A2410', display:'grid', placeItems:'center', color:K.slot, fontSize:32, fontWeight:900, letterSpacing:3, opacity:Math.min(1, k * 2), boxShadow:`0 0 ${30 + 20 * Math.sin(fr / 5)}px ${K.slot}66`}}>
        <div style={{transform:`scale(${slot ? 1 + 0.25 * (1 - lemo.seg(fr, S(28,0), S(28,0) + 14)) * (fr > S(28,0) ? 1 : 0) : 1})`}}>{fr > S(28, 0) || !slot ? 'BUFFER' : ''}</div></div>;
      const pieceEl = (w: number, xoff: number, lab: string) => <div style={{position:'absolute', left:left + xoff, top, width:w, height:c.h, borderRadius:12, background:K.card, boxShadow:`0 8px 18px rgba(0,0,0,0.35), inset 6px 0 0 ${lateOn ? K.smash : p.color}`, outline: lateOn ? `${3 + flash * 3}px solid ${K.smash}` : 'none', display:'flex', alignItems:'center', padding:'0 14px', boxSizing:'border-box', fontSize:24, fontWeight:800, color:K.cardInk, opacity:Math.min(1, k * 2) * (1 - done * 0.25), zIndex: isOut ? 5 : 1}}>
        <span style={{textDecoration: done > 0.5 ? 'line-through' : 'none', whiteSpace:'nowrap', overflow:'hidden'}}>{lab}</span>
        {done > 0 && <div style={{marginLeft:'auto', width:34, height:34, borderRadius:17, background:K.check, display:'grid', placeItems:'center', transform:`scale(${lemo.back(done)})`}}><DrawCheck p={done * 1.4} size={24}/></div>}
        {lateOn && <div style={{marginLeft:'auto'}}><Icon name="alert" size={30} color={K.smash}/></div>}</div>;
      return <React.Fragment key={p.id}>{cracked ? <>{pieceEl(c.w / 2 - 4, -6 * io(fr, crack, crack + 8), 'Body 1')}{pieceEl(c.w / 2 - 4, c.w / 2 + 4 + 6 * io(fr, crack, crack + 8), 'Body 2')}</> : pieceEl(c.w, 0, p.label)}
        {slot && <Burst x={left + c.w / 2} y={c.y + c.h} at={at + 7} colors={[p.color, '#fff']} n={8} r={60} seed={i + 2}/>}
        {mode === 'check' && done > 0 && <Burst x={left + c.w - 30} y={c.y + c.h / 2} at={doneAt} colors={[K.check, K.slot]} n={10} r={70} seed={i + 20}/>}
        {cracked && <Burst x={left + c.w / 2} y={c.y + c.h / 2} at={crack} colors={[K.smash, '#fff']} n={14} r={90} seed={33}/>}</React.Fragment>; })}
    {/* legend band fills lower space */}
    <div style={{position:'absolute', left:GX, top:GY + 3 * RH + 26, display:'flex', gap:34, alignItems:'center', fontSize:26, fontWeight:700, color:K.sub, opacity: slot ? io(fr, L(23) + 10, L(23) + 22) : 1}}>
      <span style={{padding:'6px 14px', borderRadius:10, background:K.ink, color:K.bg, fontWeight:900, letterSpacing:2}}>EXAMPLE WEEK</span>
      <span><b style={{color:K.slot}}>▢</b> open study time</span><span><b style={{color:K.sub}}>▨</b> already taken</span><span><b style={{color:K.blue}}>■</b> reading</span><span><b style={{color:K.smash}}>■</b> essay</span><span>~1 h on weeknights · more on Saturday</span></div>
  </div>; };

const Slot = () => <Scene id="slot">{fr => { const pay = L(27);
  const bufC = cell(5, 1);
  return <>
    <Chip fr={fr} at={L(20) + 50} n={2} label="SLOT IT" color={K.slot}/>
    {fr >= L(21) - 2 && <Calendar fr={fr} mode="slot"/>}
    <div style={{position:'absolute', right:90, top:60, padding:'10px 22px', borderRadius:14, background:K.ink, color:K.bg, fontSize:30, fontWeight:900, opacity:win(fr, S(21,1), L(22), 8, 6), transform:`rotate(2deg)`}}>DON'T FILL IT YET</div>
    <div style={{position:'absolute', right:90, top:60, padding:'10px 22px', borderRadius:14, background:K.ink, color:K.bg, fontSize:30, fontWeight:900, opacity:win(fr, L(24), L(25), 8, 6)}}>Your week will look different</div>
    <div style={{position:'absolute', right:90, top:60, padding:'10px 22px', borderRadius:14, background:K.slot, color:K.bg, fontSize:30, fontWeight:900, opacity:win(fr, L(25), L(27), 8, 6)}}>DEADLINES FIRST</div>
    <Spot fr={fr} a={pay} b={scEnd('slot') - 4} x={bufC.x + bufC.w / 2} y={bufC.y + bufC.h / 2} r={190}/>
    {fr > S(28, 0) && <div style={{position:'absolute', left:60, top:GY + 3 * RH + 80, width:1800, textAlign:'center', opacity:win(fr, S(28, 0) + 4, scEnd('slot') - 4, 8, 6)}}>
      <div style={{fontSize:64, fontWeight:900, color:K.slot}}>Leave one slot empty.</div>
      <div style={{fontSize:40, fontWeight:800, color:K.ink, opacity:io(fr, S(28,1), S(28,1) + 8)}}>On purpose.</div></div>}
    <Pulse x={bufC.x + bufC.w / 2} y={bufC.y + bufC.h / 2} at={S(28, 0)} color={K.slot} size={600}/>
    <Wipe fr={fr} at={L(20)} n={2} title="SLOT IT" color={K.slot} icon="grid"/>
  </>; }}</Scene>;

const Check = () => <Scene id="check">{fr => { const bufC = cell(5, 1); const q = io(fr, L(37) - 4, L(37) + 10);
  const colSpot = (d: number, a: number, b: number) => { const c = cell(d, 0); return <Spot fr={fr} a={a} b={b} x={c.x + c.w / 2} y={GY + 220} r={260}/>; };
  return <>
    <Chip fr={fr} at={L(30) + 50} n={3} label="CHECK IT" color={K.check}/>
    <div style={{opacity:1 - q * 0.85, transform:`scale(${1 - q * 0.04})`}}>{fr >= L(31) - 4 && <Calendar fr={fr} mode="check"/>}</div>
    <div style={{position:'absolute', right:90, top:60, padding:'10px 22px', borderRadius:14, background:K.check, color:K.bg, fontSize:30, fontWeight:900, display:'flex', gap:10, alignItems:'center', opacity:win(fr, L(31), L(32), 8, 6)}}><Icon name="clock" size={34} color={K.bg}/>2 MIN · EVERY NIGHT</div>
    {colSpot(0, S(32, 0), S(32, 2))}{colSpot(1, S(32, 2), L(33))}{colSpot(2, S(33, 0), L(34))}
    <div style={{position:'absolute', right:90, top:60, padding:'10px 22px', borderRadius:14, background:K.smash, color:'#fff', fontSize:30, fontWeight:900, opacity:win(fr, S(33,1), L(34), 6, 6), transform:`translateX(${Math.sin(fr * 1.3) * 4 * (1 - lemo.seg(fr, S(33,1), S(33,1) + 20))}px)`}}>OUTLINE RAN LONG</div>
    <Spot fr={fr} a={S(34, 1)} b={L(35) + 44} x={bufC.x + bufC.w / 2} y={bufC.y + bufC.h / 2} r={200}/>
    <Slam fr={fr} at={S(35, 1)} text="BENDS, NOT BREAKS" size={84} y={790} color={K.check} out={L(36) - 4}/>
    <Slam fr={fr} at={S(36, 1)} text="SMASH IT AGAIN" size={84} y={790} color={K.smash} out={L(37) - 4}/>
    {q > 0 && <div style={{position:'absolute', top:250, width:'100%', display:'flex', justifyContent:'center', gap:60}}>
      {[['What worked?', K.check, S(38, 0)], ['What will I change?', K.slot, S(38, 1)]].map(([t, c, at], i) => { const k = sp(fr, at as number, 12, 190); if (fr < (at as number) - 1) return <div key={i} style={{width:680}}/>;
        return <div key={i} style={{width:680, padding:'56px 44px', borderRadius:30, background:K.card, borderTop:`14px solid ${c}`, opacity:Math.min(1, k * 2), transform:`translateY(${(1 - k) * 120}px) rotate(${(i ? 1 : -1) * 2 * k}deg)`}}>
          <div style={{fontSize:30, fontWeight:900, color:'#6B7488', letterSpacing:3}}>QUESTION {i + 1}</div><div style={{fontSize:64, fontWeight:900, color:K.cardInk, marginTop:12}}>{t as string}</div></div>; })}</div>}
    <Wipe fr={fr} at={L(30)} n={3} title="CHECK IT" color={K.check} icon="check"/>
  </>; }}</Scene>;

/* ================= RECAP / END ================= */
const Recap = () => <Scene id="recap">{fr => { const endAt = L(42) - 4; const endP = io(fr, endAt, endAt + 14);
  return <>
    <div style={{opacity:1 - endP}}>
      <Slam fr={fr} at={S(39, 0)} text="THE WHOLE METHOD" size={70} y={120} color={K.sub} out={L(40) - 4}/>
      <div style={{position:'absolute', top:300, width:'100%', display:'flex', justifyContent:'center', gap:46, opacity:1 - io(fr, L(40) - 6, L(40) + 4)}}>
        {MOVES.map(([t, ic, c], i) => { const at = S(39, i + 1); const k = sp(fr, at, 11, 220); if (fr < at - 1) return <div key={i} style={{width:440}}/>;
          return <div key={i} style={{width:440, height:300, borderRadius:30, background:c, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', opacity:Math.min(1, k * 2), transform:`translateY(${(1 - k) * 160}px) scale(${1 + (1 - k) * 0.4})`}}>
            <Icon name={ic} size={120} color={K.bg} sw={6}/><div style={{fontSize:64, fontWeight:900, color:K.bg, marginTop:10}}>{t}</div></div>; })}</div>
      <Slam fr={fr} at={S(40, 0)} text="Not a perfect plan." size={96} y={300} color={K.sub} out={L(41) - 4} weight={800}/>
      <Slam fr={fr} at={S(40, 1)} text="One you'll actually start." size={120} y={450} color={K.ink} out={L(41) - 4}/>
      {fr >= L(41) - 1 && (() => { const k = sp(fr, L(41), 11, 180); return <div style={{position:'absolute', left:960 - 420, top:320, width:840, height:300, borderRadius:30, background:K.smash, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', opacity:Math.min(1, k * 2), transform:`scale(${0.7 + 0.3 * k}) rotate(${Math.sin(fr / 3) * (fr > S(41,0) + 40 ? 1.5 : 0)}deg)`}}>
        <div style={{fontSize:34, fontWeight:900, color:K.bg, letterSpacing:6}}>TONIGHT</div><div style={{fontSize:84, fontWeight:900, color:'#fff'}}>PICK ONE TASK</div>
        <div style={{position:'absolute', right:-40, top:-60, transform:`rotate(${-30 + 30 * Math.abs(Math.sin(fr / 5))}deg)`, transformOrigin:'bottom left'}}><Icon name="hammer" size={130} color={K.ink} sw={6}/></div></div>; })()}
    </div>
    <AbsoluteFill style={{justifyContent:'center', alignItems:'center', opacity:endP, transform:`scale(${0.96 + 0.04 * endP + interpolate(fr, [endAt, END], [0, 0.025])})`}}>
      <div style={{display:'flex', gap:20}}>{MOVES.map(([t, ic, c], i) => <div key={i} style={{width:96, height:96, borderRadius:28, background:c, display:'grid', placeItems:'center', transform:`translateY(${Math.sin(fr / 10 + i) * 5}px)`}}><Icon name={ic} size={58} color={K.bg} sw={6}/></div>)}</div>
      <div style={{fontSize:84, fontWeight:900, color:K.ink, marginTop:36, letterSpacing:-2}}>Thanks for watching</div>
      <div style={{fontSize:34, color:K.sub, marginTop:14, fontWeight:700}}>How to Build a Simple Study Plan · <span style={{color:K.slot}}>Personal sample</span> by Weijian Zhao</div>
      <div style={{fontSize:22, color:'#6B7488', marginTop:40}}>Music: "Inspired" by Kevin MacLeod (incompetech.com) · Licensed under CC BY 4.0 · Voice: Kokoro TTS (Apache-2.0)</div>
    </AbsoluteFill>
  </>; }}</Scene>;

/* ================= captions: ONE cue per sentence ================= */
const KEY = /\b(smash|slot|check|three|six|ten|zero|four|five|empty|buffer|friday|saturday|done)\b/i;
const Captions = () => { const fr = useCurrentFrame(); const t = fr / FPS;
  const cur = CUES.find((c, i) => t >= c.start - 0.03 && t < (i + 1 < CUES.length ? Math.min(c.end + 0.3, CUES[i + 1].start - 0.03) : c.end + 0.4)); if (!cur) return null;
  const a = io(fr, cur.start * FPS - 2, cur.start * FPS + 3);
  return <div style={{position:'absolute', bottom:52, width:'100%', display:'flex', justifyContent:'center', opacity:a, transform:`translateY(${(1 - a) * 10}px)`}}>
    <div style={{maxWidth:1500, padding:'12px 28px', borderRadius:14, background:'rgba(5,7,13,0.86)', color:'#fff', fontSize:44, fontWeight:700, lineHeight:1.25, textAlign:'center'}}>
      {cur.text.split(' ').map((w: string, i: number) => <span key={i} style={{color: KEY.test(w) ? K.slot : '#fff'}}>{w}{' '}</span>)}</div></div>; };

const Progress = () => { const fr = useCurrentFrame(); const segs = ['smash', 'slot', 'check']; const k = segs.findIndex(id => fr >= scStart(id) && fr < scEnd(id)); if (k < 0) return null;
  return <div style={{position:'absolute', right:90, bottom:150, display:'flex', gap:10}}>{segs.map((id, i) => <div key={id} style={{width: i === k ? 56 : 16, height:16, borderRadius:8, background: i <= k ? [K.smash, K.slot, K.check][i] : K.dim}}/>)}</div>; };

// register impacts (big hits) for camera shake
[S(0,0), S(0,1), S(0,2), S(1,0), S(1,1), S(1,2), S(3,1) + 10, S(9,1) + 12, S(18,1) + 4, S(33,1), S(36,1) + 14].forEach(f => IMPACTS.push(f));

const Shaker: React.FC<{children: React.ReactNode}> = ({children}) => { const fr = useCurrentFrame(); const {x, y} = shakeAt(fr);
  return <AbsoluteFill style={{transform:`translate(${x}px, ${y}px)`}}>{children}</AbsoluteFill>; };
const curScene = (fr: number) => { let k = 0; SC.forEach((id, i) => { if (fr >= scStart(id)) k = i; }); return SC[k]; };
const Bg = () => { const fr = useCurrentFrame(); return <AbsoluteFill style={{background:K.bg}}><DarkBg tint={TINT[curScene(fr)]}/></AbsoluteFill>; };

export const StudyPlanV3 = () => <AbsoluteFill style={{fontFamily:FONT, background:K.bg}}>
  <Bg/>
  <Shaker><Hook/><Promise_/><Smash/><Slot/><Check/><Recap/></Shaker>
  {SC.slice(1).map(id => <LightLeak key={id} at={scStart(id) - 9} dur={18} tint={TINT[id]}/>)}
  <Progress/><Captions/>
  <Audio src={staticFile('mix.wav')}/>
</AbsoluteFill>;

export const CoverV3 = () => <AbsoluteFill style={{fontFamily:FONT, background:K.bg}}><DarkBg tint={[1, .36, .36]}/>
  <div style={{position:'absolute', left:110, top:200}}>
    <div style={{fontSize:36, fontWeight:900, color:K.slot, letterSpacing:6}}>3 MOVES · 1 WEEK</div>
    <div style={{fontSize:132, fontWeight:900, color:K.ink, lineHeight:1, letterSpacing:-4, marginTop:18}}>How to Build a<br/>Simple <span style={{color:K.slot}}>Study Plan</span></div>
    <div style={{display:'flex', gap:18, marginTop:50}}>{MOVES.map(([t, ic, c], i) => <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'14px 22px', borderRadius:18, background:c}}><Icon name={ic} size={44} color={K.bg} sw={6}/><span style={{fontSize:36, fontWeight:900, color:K.bg}}>{t}</span></div>)}</div></div>
  <div style={{position:'absolute', right:120, top:180, width:520, height:300, borderRadius:28, background:K.smash, display:'grid', placeItems:'center', transform:'rotate(6deg)', boxShadow:'0 40px 80px rgba(0,0,0,0.5)'}}><div style={{fontSize:64, fontWeight:900, color:'#fff', textAlign:'center'}}>WRITE THE<br/>ESSAY</div></div>
  {['Choose a topic', 'Find sources', 'Outline'].map((t, i) => <div key={i} style={{position:'absolute', right: 160 + i * 40, top: 540 + i * 110, transform:`rotate(${-4 + i * 4}deg)`}}><Tile text={t} color={K.smash} w={420} h={90} size={36}/></div>)}
</AbsoluteFill>;
