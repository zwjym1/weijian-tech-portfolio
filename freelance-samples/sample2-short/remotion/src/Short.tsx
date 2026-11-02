import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, Easing} from 'remotion';
import tl from './timeline.json';
import {DarkBg, LightLeak, Burst, Pulse, DrawCheck, lemo} from './fx';
/* Vertical adaptation of Sample 1 v3. Safe area: x 90–930 (right 150 px kept free for social UI), y 250–1670. */
const FPS = 30; const CUES = tl.cues as any[]; const LS = tl.lineStart as number[];
const L = (i: number) => Math.round(LS[i] * FPS);
const S = (line: number, sent = 0) => Math.round(CUES.find(c => c.line === line && c.sent === sent).start * FPS);
const END = Math.round(tl.duration * FPS);
const K = {bg:'#0E1220', ink:'#F5F7FB', sub:'#9AA3B8', card:'#FFFFFF', cardInk:'#121626', smash:'#FF5D5D', slot:'#FFC93C', check:'#2BD99F', blue:'#5B8CFF', dim:'#2A3350'};
const FONT = 'Inter, Lato, sans-serif'; const CX = 510; // centre of safe area (90..930)
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const io = (fr: number, a: number, b: number, f0 = 0, t0 = 1) => interpolate(fr, [a, b], [f0, t0], {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: ease});
const sp = (fr: number, at: number, d = 13, st = 190) => spring({frame: fr - at, fps: FPS, config:{damping:d, stiffness:st, mass:0.7}});
const win = (fr: number, a: number, b: number, fi = 8, fo = 7) => Math.min(io(fr, a, a + fi), 1 - io(fr, b - fo, b));
const IMP: number[] = []; const shake = (fr: number) => { let x = 0, y = 0; for (const a of IMP) { const t = fr - a; if (t >= 0 && t < 12) { const k = (1 - t / 12) * 12; x += Math.sin(t * 2.7) * k; y += Math.cos(t * 3.1) * k * 0.6; } } return {x, y}; };

const Icon = ({name, size = 56, color = K.cardInk, sw = 5}: {name: string; size?: number; color?: string; sw?: number}) => {
  const p: Record<string, React.ReactNode> = {
    hammer: <><path d="M30 26L10 46l8 8 20-20"/><path d="M26 16l14-6 14 14-6 14-8-8-6 2-6-6 2-6z"/></>,
    clock: <><circle cx="32" cy="32" r="24"/><path d="M32 18v14l10 6"/></>,
    check: <><path d="M14 33l12 12 24-26"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>; };
const Slam = ({fr, at, text, size, color = K.ink, y, out = 99999, weight = 900}: any) => { const k = sp(fr, at, 12, 220); const o = Math.min(1, k * 2) * (1 - io(fr, out, out + 6)); if (fr < at - 1 || o <= 0) return null;
  return <div style={{position:'absolute', left:90, width:840, top:y, textAlign:'center', fontSize:size, fontWeight:weight, color, lineHeight:1.02, letterSpacing:-size * 0.03, opacity:o, transform:`scale(${1 + (1 - k) * 0.8})`, textShadow:`0 0 ${40 * (1 - k) + 16}px ${color}55`}}>{text}</div>; };
const STEPS = [['Choose a topic', '~20 min'], ['Write an outline', '~30 min'], ['Draft one section', 'one sitting']];

const Main = () => { const fr = useCurrentFrame();
  const blockIn = sp(fr, 0, 12, 200); const boom = S(2, 0) + 26; const broke = fr >= boom; const crack = io(fr, L(2), boom);
  const days = Math.min(7, Math.floor(io(fr, 4, 60) * 7) + 1);
  const curStep = [3, 4, 5].findIndex((ln, i, a) => fr >= L(ln) && fr < (i < 2 ? L(a[i + 1]) : L(6)));
  const payoff = fr >= L(7); const recap = fr >= L(9) - 4; const recapP = io(fr, L(9) - 4, L(9) + 10);
  const tile = (i: number) => { const k = sp(fr, boom + i * 3, 13, 160); const focus = curStep === i; const allOn = fr >= L(6);
    const dimP = payoff ? (i === 0 ? 1 : 0.3) : (curStep >= 0 ? (focus ? 1 : 0.4) : 1);
    const y = interpolate(k, [0, 1], [760, 470 + i * 250]);
    const done = payoff && i === 0 ? io(fr, S(8, 0) + 20, S(8, 0) + 30) : 0;
    return <div key={i} style={{position:'absolute', left:90, top:y, width:840, height:210, borderRadius:30, background:K.card, boxShadow:`0 20px 40px rgba(0,0,0,0.45), inset 12px 0 0 ${K.smash}`, opacity:Math.min(1, k * 2) * dimP, transform:`scale(${focus || (payoff && i === 0) ? 1.04 : 1}) rotate(${(1 - k) * (i - 1) * 18}deg)`, padding:'26px 36px', boxSizing:'border-box'}}>
      <div style={{fontSize:30, fontWeight:900, color:K.smash, letterSpacing:4}}>STEP {i + 1}</div>
      <div style={{fontSize:66, fontWeight:900, color:K.cardInk, marginTop:6, letterSpacing:-1}}><span style={{borderBottom: allOn ? `8px solid ${K.smash}` : 'none'}}>{STEPS[i][0].split(' ')[0]}</span> {STEPS[i][0].split(' ').slice(1).join(' ')}</div>
      <div style={{position:'absolute', right:30, top:30, display:'flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:14, background:'#EEF1F6', fontSize:30, fontWeight:800, color:'#4A5368', opacity:io(fr, S(3 + i, 2), S(3 + i, 2) + 8), transform:`scale(${lemo.back(lemo.seg(fr, S(3 + i, 2), S(3 + i, 2) + 10))})`}}><Icon name="clock" size={32} color="#4A5368"/>{STEPS[i][1]}</div>
      {done > 0 && <div style={{position:'absolute', right:36, bottom:30, width:70, height:70, borderRadius:35, background:K.check, display:'grid', placeItems:'center', transform:`scale(${lemo.back(done)})`}}><DrawCheck p={done * 1.4} size={46}/></div>}
      <Burst x={420} y={105} at={boom + i * 3 + 8} colors={[K.smash, '#fff']} n={8} r={120} seed={i + 1}/>
      {done > 0 && <Burst x={770} y={145} at={S(8, 0) + 20} colors={[K.check, K.slot, '#fff']} n={16} r={150} seed={11}/>}
    </div>; };
  return <AbsoluteFill style={{opacity:1 - recapP}}>
    {/* HOOK: the big block + 7-day counter (eye: block) */}
    {!broke && <div style={{position:'absolute', left:90 + Math.sin(fr * 1.4) * 5 * crack, top:620 + (1 - blockIn) * -700, width:840, height:520, borderRadius:36, background:K.smash, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', boxShadow:'0 40px 90px rgba(0,0,0,0.55)'}}>
      <div style={{fontSize:34, fontWeight:900, color:K.bg, letterSpacing:6, opacity:0.75}}>ON YOUR LIST</div>
      <div style={{fontSize:104, fontWeight:900, color:'#fff', textAlign:'center', lineHeight:1, letterSpacing:-3, marginTop:12}}>WRITE THE<br/>ESSAY</div>
      <div style={{marginTop:24, padding:'10px 22px', borderRadius:14, background:K.bg, color:K.slot, fontSize:40, fontWeight:900, transform:`rotate(-3deg)`}}>DAY {days} · NOT STARTED</div>
      {crack > 0 && <svg style={{position:'absolute', inset:0}} width="840" height="520"><path d="M420 0 L390 160 L470 250 L400 380 L440 520 M390 160 L260 200 M470 250 L620 220" stroke={K.bg} strokeWidth="10" fill="none" strokeDasharray="1100" strokeDashoffset={1100 * (1 - crack)}/></svg>}
    </div>}
    <Slam fr={fr} at={S(1, 0)} text="It's not you." size={70} color={K.sub} y={330} out={L(2) - 4} weight={800}/>
    <Slam fr={fr} at={S(1, 1)} text="TOO BIG." size={120} color={K.slot} y={1190} out={L(2) - 4}/>
    {/* SMASH */}
    {fr >= L(2) && !broke && <div style={{position:'absolute', left:90, top:330, width:840, display:'flex', justifyContent:'center', alignItems:'center', gap:18, opacity:io(fr, L(2), L(2) + 8)}}>
      <Icon name="hammer" size={90} color={K.smash} sw={6}/><div style={{fontSize:76, fontWeight:900, color:K.ink}}>SMASH IT</div></div>}
    <Burst x={CX} y={880} at={boom} colors={[K.smash, '#fff', K.slot]} n={44} r={560} seed={5}/>
    <Pulse x={CX} y={880} at={boom} color={K.smash} size={1100}/>
    {broke && <div style={{position:'absolute', left:90, top:300, width:840, textAlign:'center', fontSize:58, fontWeight:900, color:K.ink, opacity: payoff ? 0 : io(fr, boom, boom + 10)}}>1 task → <span style={{color:K.smash}}>3 steps</span></div>}
    {broke && [0, 1, 2].map(tile)}
    <div style={{position:'absolute', left:90, top:1250, width:840, textAlign:'center', fontSize:46, fontWeight:900, color:K.ink, opacity:win(fr, L(6), L(7), 8, 6)}}><span style={{color:K.smash}}>VERB</span> + <span style={{color:K.check}}>ONE SITTING</span></div>
    {/* PAYOFF: tonight = only step 1 (eye: spotlit tile) */}
    {payoff && <div style={{position:'absolute', left:90, top:300, width:840, textAlign:'center', opacity:io(fr, L(7), L(7) + 10)}}>
      <div style={{fontSize:44, fontWeight:800, color:K.sub, textDecoration:'line-through', textDecorationColor:K.smash}}>Write an essay tonight</div>
      <div style={{fontSize:68, fontWeight:900, color:K.slot, marginTop:8, opacity:io(fr, S(8,0), S(8,0) + 8), transform:`scale(${lemo.back(lemo.seg(fr, S(8,0), S(8,0) + 12))})`}}>TONIGHT: JUST THIS</div></div>}
  </AbsoluteFill>; };

const Recap = () => { const fr = useCurrentFrame(); const a = L(9) - 4; if (fr < a) return null;
  const endP = io(fr, L(10) + 30, L(10) + 44);
  return <AbsoluteFill>
    <div style={{opacity:1 - endP}}>
      <Slam fr={fr} at={S(9, 0)} text="ONE TASK." size={130} y={520}/>
      <Slam fr={fr} at={S(9, 1)} text="THREE SMALLER STEPS." size={96} color={K.smash} y={700}/>
      <div style={{position:'absolute', left:90, top:900, width:840, display:'flex', justifyContent:'center', gap:24}}>{[0, 1, 2].map(i => { const k = sp(fr, S(9, 1) + 6 + i * 4); return <div key={i} style={{width:220, height:120, borderRadius:22, background:K.card, boxShadow:`inset 8px 0 0 ${K.smash}`, opacity:Math.min(1, k * 2), transform:`translateY(${(1 - k) * 80}px)`, display:'grid', placeItems:'center', fontSize:44, fontWeight:900, color:K.cardInk}}>{i + 1}</div>; })}</div>
      <div style={{position:'absolute', left:90, top:1120, width:840, textAlign:'center', fontSize:52, fontWeight:800, color:K.ink, opacity:io(fr, L(10), L(10) + 10)}}>Try it on your next big task.</div>
    </div>
    <AbsoluteFill style={{opacity:endP, transform:`scale(${0.96 + 0.04 * endP})`}}>
      <div style={{position:'absolute', left:90, top:640, width:840, textAlign:'center'}}>
        <div style={{display:'inline-flex', width:150, height:150, borderRadius:40, background:K.smash, alignItems:'center', justifyContent:'center', transform:`rotate(${Math.sin(fr / 6) * 6}deg)`}}><Icon name="hammer" size={96} color={K.bg} sw={6}/></div>
        <div style={{fontSize:76, fontWeight:900, color:K.ink, marginTop:40, lineHeight:1.05}}>One task.<br/><span style={{color:K.smash}}>Three smaller steps.</span></div>
        <div style={{fontSize:32, fontWeight:700, color:K.slot, marginTop:30}}>Personal sample by Weijian Zhao</div>
        <div style={{fontSize:22, color:'#6B7488', marginTop:30, lineHeight:1.5}}>Music: "Inspired" by Kevin MacLeod (incompetech.com)<br/>Licensed under CC BY 4.0 · Voice: Kokoro TTS (Apache-2.0)</div></div>
    </AbsoluteFill></AbsoluteFill>; };

const KEY = /\b(three|one|two|twenty|thirty|smash|week|verb|topic)\b/i;
const Captions = () => { const fr = useCurrentFrame(); const t = fr / FPS;
  const cur = CUES.find((c, i) => t >= c.start - 0.03 && t < (i + 1 < CUES.length ? Math.min(c.end + 0.3, CUES[i + 1].start - 0.03) : c.end + 0.4)); if (!cur) return null;
  const a = io(fr, cur.start * FPS - 2, cur.start * FPS + 3);
  return <div style={{position:'absolute', left:90, width:840, top:1480, display:'flex', justifyContent:'center', opacity:a, transform:`translateY(${(1 - a) * 10}px)`}}>
    <div style={{padding:'14px 26px', borderRadius:18, background:'rgba(5,7,13,0.88)', color:'#fff', fontSize:50, fontWeight:800, lineHeight:1.2, textAlign:'center'}}>
      {cur.text.split(' ').map((w: string, i: number) => <span key={i} style={{color: KEY.test(w) ? K.slot : '#fff'}}>{w}{' '}</span>)}</div></div>; };

[0 + 2, S(1, 1), S(2, 0) + 26, S(9, 0), S(9, 1)].forEach(f => IMP.push(f));
export const Short = () => { const fr = useCurrentFrame(); const {x, y} = shake(fr); const t = fr / FPS;
  const dx = (lemo.vnoise(t * 0.35) - 0.5) * 10, dy = (lemo.vnoise(t * 0.3 + 9) - 0.5) * 8;
  return <AbsoluteFill style={{fontFamily:FONT, background:K.bg}}>
    <DarkBg tint={fr < L(2) ? [1, .36, .36] : fr < L(7) ? [1, .36, .36] : fr < L(9) ? [1, .79, .24] : [.36, .55, 1]}/>
    <AbsoluteFill style={{transform:`translate(${x + dx}px, ${y + dy}px)`}}><Main/><Recap/></AbsoluteFill>
    <LightLeak at={L(7) - 9} dur={18} tint={[1, .79, .24]}/><LightLeak at={L(9) - 12} dur={18} tint={[.36, .55, 1]}/>
    <Captions/>
    <Audio src={staticFile('mix.wav')}/>
  </AbsoluteFill>; };

export const Cover = () => <AbsoluteFill style={{fontFamily:FONT, background:K.bg}}><DarkBg tint={[1, .36, .36]}/>
  <div style={{position:'absolute', left:90, top:300, width:840, textAlign:'center'}}>
    <div style={{fontSize:40, fontWeight:900, color:K.slot, letterSpacing:6}}>STUDY TIP</div>
    <div style={{fontSize:120, fontWeight:900, color:K.ink, lineHeight:1, letterSpacing:-4, marginTop:20}}>One task.<br/><span style={{color:K.smash}}>Three smaller steps.</span></div></div>
  <div style={{position:'absolute', left:140, top:870, width:740, height:300, borderRadius:34, background:K.smash, display:'grid', placeItems:'center', transform:'rotate(-4deg)', boxShadow:'0 40px 80px rgba(0,0,0,0.5)'}}><div style={{fontSize:84, fontWeight:900, color:'#fff', textAlign:'center', lineHeight:1}}>WRITE THE<br/>ESSAY</div></div>
  {STEPS.map(([t], i) => <div key={i} style={{position:'absolute', left:150 + i * 30, top:1230 + i * 120, width:640, height:100, borderRadius:22, background:K.card, boxShadow:`inset 10px 0 0 ${K.smash}`, display:'flex', alignItems:'center', padding:'0 30px', fontSize:44, fontWeight:900, color:K.cardInk, transform:`rotate(${-3 + i * 3}deg)`}}>{i + 1}. {t}</div>)}
</AbsoluteFill>;
