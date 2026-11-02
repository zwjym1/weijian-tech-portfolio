import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import tl from './timeline.json';
import {ShaderBg, LightLeak, Burst, Pulse, DrawCheck, lemo} from './fx';
// Motion principles adapted from claude-motion-design (MIT): fast-first settles, no frozen frames, exits faster than entries.
const FPS = 30; const L = tl.lines; const f = (i: number) => Math.round(L[i].start * FPS);
const C = {bg1:'#F4F1EA', bg2:'#E8EEF7', ink:'#1E2433', sub:'#5B6477', blue:'#3B6FF5', green:'#1FA97A', amber:'#F2A93B', coral:'#EF6A5B', violet:'#7B61FF', card:'#FFFFFF'};
const FONT = 'Inter, Lato, sans-serif';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useS = (start: number, damping = 18) => { const fr = useCurrentFrame(); const {fps} = useVideoConfig(); return spring({frame: fr - start, fps, config: {damping, mass: 0.7, stiffness: 140}}); };
const io = (fr: number, a: number, b: number, from = 0, to = 1) => interpolate(fr, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
const SCENES = ['hook','intro','breakdown','calendar','review','recap'];
const sceneStart = (id: string) => { const i = L.findIndex(l => l.scene === id); return Math.round((L[i].start - 0.6) * FPS); };
const sceneEnd = (id: string) => { const k = SCENES.indexOf(id); return k === SCENES.length - 1 ? Math.round(tl.duration * FPS) : sceneStart(SCENES[k + 1]); };

// ---------- icons (self-drawn SVG) ----------
const Icon = ({name, size = 56, color = C.ink}: {name: string; size?: number; color?: string}) => {
  const p: Record<string, React.ReactNode> = {
    doc: <><rect x="12" y="6" width="40" height="52" rx="6"/><path d="M20 22h24M20 32h24M20 42h14"/></>,
    book: <><path d="M8 12h18a6 6 0 0 1 6 6v36a5 5 0 0 0-5-5H8z"/><path d="M56 12H38a6 6 0 0 0-6 6v36a5 5 0 0 1 5-5h19z"/></>,
    quiz: <><circle cx="32" cy="32" r="24"/><path d="M25 25a7 7 0 1 1 9 7c-2 1-2 2-2 5"/><circle cx="32" cy="45" r="1.5"/></>,
    cal: <><rect x="8" y="12" width="48" height="44" rx="6"/><path d="M8 24h48M20 6v12M44 6v12"/></>,
    check: <><path d="M14 33l12 12 24-26"/></>,
    split: <><path d="M32 8v16M32 24L14 44M32 24l18 20M32 24v32"/></>,
    loop: <><path d="M50 26a20 20 0 0 0-36-4M14 38a20 20 0 0 0 36 4"/><path d="M14 10v12h12M50 54V42H38"/></>,
    clock: <><circle cx="32" cy="32" r="24"/><path d="M32 18v14l10 6"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>;
};

// ---------- background: soft drifting shapes (never frozen) ----------
const TINTS: Record<string,[number,number,number]> = {hook:[.94,.42,.36], intro:[.23,.44,.96], breakdown:[.23,.44,.96], calendar:[.95,.66,.23], review:[.12,.66,.48], recap:[.48,.38,1]};
const curScene = (fr: number) => { let k = 0; SCENES.forEach((id, i) => { if (fr >= sceneStart(id)) k = i; }); return SCENES[k]; };
const Bg = () => { const fr = useCurrentFrame(); const t = fr / FPS;
  const blob = (x: number, y: number, r: number, col: string, sp: number) => <div style={{position:'absolute', left: x + Math.sin(t*sp)*40, top: y + Math.cos(t*sp*0.8)*30, width:r, height:r, borderRadius:'50%', background:col, filter:'blur(80px)', opacity:0.55}}/>;
  return <AbsoluteFill style={{background:C.bg1}}>
    <ShaderBg tint={TINTS[curScene(fr)]}/>
    <AbsoluteFill style={{backgroundImage:'radial-gradient(#1E243314 1.5px, transparent 1.5px)', backgroundSize:'36px 36px', transform:`translateY(${(t*6)%36}px)`}}/>
  </AbsoluteFill>; };

const Card: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) =>
  <div style={{background:C.card, borderRadius:24, boxShadow:'0 18px 40px rgba(30,36,51,0.12), 0 2px 6px rgba(30,36,51,0.06)', ...style}}>{children}</div>;

const StepTag = ({n, label, color, at}: {n: number; label: string; color: string; at: number}) => { const s = useS(at);
  return <div style={{position:'absolute', left:110, top:80, display:'flex', alignItems:'center', gap:18, opacity:s, transform:`translateX(${(1-s)*-60}px)`}}>
    <div style={{width:64, height:64, borderRadius:20, background:color, color:'#fff', fontSize:34, fontWeight:800, display:'grid', placeItems:'center'}}>{n}</div>
    <div style={{fontSize:40, fontWeight:800, color:C.ink, letterSpacing:-0.5}}>{label}</div></div>; };

// scene wrapper: enter moving, exit faster, micro-drift while held
const Scene: React.FC<{id: string; children: React.ReactNode}> = ({id, children}) => { const fr = useCurrentFrame(); const {fps} = useVideoConfig();
  const a = sceneStart(id), b = sceneEnd(id); if (fr < a - 2 || fr > b + 2) return null;
  const inP = spring({frame: fr - a, fps, config:{damping:20, stiffness:120, mass:0.8}}); const outP = Math.pow(io(fr, b - 10, b), 1.5);
  const t = (fr - a) / FPS; const dx = (lemo.vnoise(t*0.35) - 0.5) * 18, dy = (lemo.vnoise(t*0.3 + 9) - 0.5) * 12; // camera micro-drift (lemo vnoise)
  const push = interpolate(fr, [a, b], [1, 1.035]);
  const x = (1 - inP) * 220 - outP * 320; const blur = (1 - inP) * 10 + outP * 18;
  return <AbsoluteFill style={{opacity: Math.min(1, inP*1.4) * (1 - outP), filter: blur > 0.3 ? `blur(${blur}px)` : undefined, transform:`translate(${x + dx}px, ${dy}px) scale(${push})`}}>{children}</AbsoluteFill>; };

// ---------- Scene 1: hook ----------
const tasks = [{icon:'doc', t:'Essay', d:'Due next Monday', c:C.blue}, {icon:'book', t:'Read 2 chapters', d:'Chapters 4–5', c:C.green}, {icon:'quiz', t:'Quiz', d:'Friday', c:C.coral}];
const Hook = () => { const fr = useCurrentFrame();
  const shake = fr > f(1) && fr < f(3) ? Math.sin(fr*0.9)*3 : 0;
  return <Scene id="hook">
    <div style={{position:'absolute', top:150, width:'100%', display:'flex', justifyContent:'center', gap:50}}>
      {tasks.map((k, i) => { const s = useS(f(0) + 8 + i*10);
        const pile = io(fr, f(2), f(2)+20); // cards pile into a stack ("put it off")
        const x = pile * (i - 1) * -300 + pile*(i-1)*20, rot = pile * (i - 1) * 6 + shake;
        return <Card key={i} style={{width:380, padding:'40px 36px', opacity:s, transform:`translate(${x}px, ${(1-s)*80 + pile*i*14}px) rotate(${rot}deg) scale(${0.9+0.1*s})`, zIndex:3-i}}>
          <div style={{width:96, height:96, borderRadius:28, background:k.c+'1A', display:'grid', placeItems:'center'}}><Icon name={k.icon} size={60} color={k.c}/></div>
          <div style={{fontSize:44, fontWeight:800, marginTop:26, color:C.ink}}>{k.t}</div>
          <div style={{fontSize:30, color:C.sub, marginTop:8}}>{k.d}</div>
          <div style={{marginTop:22, display:'inline-block', padding:'6px 16px', borderRadius:99, background:C.coral+'22', color:C.coral, fontSize:24, fontWeight:700, opacity:io(fr, f(1), f(1)+10)}}>Urgent</div>
        </Card>; })}
    </div>
    <div style={{position:'absolute', top:640, width:'100%', textAlign:'center', fontSize:64, fontWeight:800, color:C.ink, opacity:io(fr, f(3), f(3)+14), transform:`translateY(${io(fr,f(3),f(3)+14,30,0)}px)`}}>
      Where do you start<span style={{color:C.blue, display:'inline-block', transform:`translateY(${-Math.abs(Math.sin((fr - f(3))/7))*14*(1-lemo.seg(fr, f(3), f(3)+70))}px) rotate(${Math.sin(fr/9)*6}deg)`}}>?</span></div>
  </Scene>; };

// ---------- Scene 2: intro ----------
const steps3 = [{n:1, t:'Break it down', icon:'split', c:C.blue}, {n:2, t:'Schedule it', icon:'cal', c:C.amber}, {n:3, t:'Review it', icon:'loop', c:C.green}];
const Intro = () => { const fr = useCurrentFrame(); const ts = useS(f(4));
  return <Scene id="intro">
    <div style={{position:'absolute', top:130, width:'100%', textAlign:'center', opacity:ts, transform:`translateY(${(1-ts)*40}px)`}}>
      <div style={{fontSize:30, letterSpacing:6, color:C.sub, fontWeight:700}}>A SIMPLE METHOD</div>
      <div style={{fontSize:86, fontWeight:900, color:C.ink, letterSpacing:-2, marginTop:10, display:'flex', justifyContent:'center', gap:22}}>{'How to Build a Simple Study Plan'.split(' ').map((w, i) => { const k = spring({frame: fr - f(4) - 4 - i*3, fps: FPS, config:{damping:14, stiffness:170, mass:0.6}});
        return <span key={i} style={{display:'inline-block', opacity:Math.min(1,k*1.5), transform:`translateY(${(1-k)*60}px) rotate(${(1-k)*8}deg)`, color: i >= 5 ? C.blue : C.ink}}>{w}</span>; })}</div>
      <div style={{margin:'18px auto 0', height:8, borderRadius:4, background:`linear-gradient(90deg, ${C.blue}, ${C.violet})`, width: 520*lemo.eo(lemo.seg(fr, f(4)+20, f(4)+45))}}/></div>
    <div style={{position:'absolute', top:420, width:'100%', display:'flex', justifyContent:'center', gap:60}}>
      {steps3.map((k, i) => { const s = useS(f(5) + 14 + i*22);
        return <Card key={i} style={{width:400, padding:'44px 30px', textAlign:'center', opacity:s, transform:`translateY(${(1-s)*90}px)`}}>
          <div style={{width:120, height:120, margin:'0 auto', borderRadius:36, background:k.c, display:'grid', placeItems:'center', transform:`rotate(${Math.sin(fr/40+i)*3}deg)`}}><Icon name={k.icon} size={70} color="#fff"/></div>
          <div style={{fontSize:28, color:C.sub, marginTop:26, fontWeight:700}}>STEP {k.n}</div>
          <div style={{fontSize:46, fontWeight:800, color:C.ink, marginTop:6}}>{k.t}</div><Pulse x={200} y={104} at={f(5)+14+i*22} color={k.c} size={220}/></Card>; })}
    </div>
    <div style={{position:'absolute', top:800, width:'100%', textAlign:'center', fontSize:32, color:C.sub, opacity:io(fr, f(7), f(7)+12)}}>
      Tools: a notebook or any calendar app</div>
  </Scene>; };

// ---------- checklist row ----------
const Row = ({text, at, time, timeAt, done, color = C.blue, w = 640}: {text: string; at: number; time?: string; timeAt?: number; done?: number; color?: string; w?: number}) => {
  const fr = useCurrentFrame(); const s = useS(at); const d = done ? io(fr, done, done + 10) : 0;
  return <div style={{display:'flex', alignItems:'center', gap:20, width:w, padding:'14px 22px', marginBottom:12, background:'#fff', borderRadius:16, boxShadow:'0 6px 16px rgba(30,36,51,0.08)', opacity:s, transform:`translateX(${(1-s)*-50}px)`, position:'relative', overflow:'hidden'}}>
    <div style={{position:'absolute', inset:0, background:`linear-gradient(100deg, transparent 30%, ${color}22 50%, transparent 70%)`, transform:`translateX(${interpolate(fr, [at, at+22], [-110, 110], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})}%)`}}/>
    <div style={{position:'relative', width:38, height:38, borderRadius:10, border:`3.5px solid ${color}`, background: d > 0 ? color : 'transparent', display:'grid', placeItems:'center', transform:`scale(${1 + Math.sin(d*Math.PI)*0.25})`}}><DrawCheck p={d*1.3} size={28}/>{done ? <Burst x={19} y={19} at={done} colors={[color, C.amber, C.violet]} n={10} r={50}/> : null}</div>
    <div style={{fontSize:32, fontWeight:600, color:C.ink, flex:1, textDecoration: d > 0.5 ? 'line-through' : 'none', opacity: 1 - d*0.35}}>{text}</div>
    {time && <div style={{fontSize:26, fontWeight:700, color:C.sub, padding:'4px 12px', borderRadius:10, background:'#EEF1F6', opacity: io(fr, timeAt!, timeAt! + 10)}}>{time}</div>}
  </div>; };

// ---------- Scene 3: break down ----------
const essay = [['Choose a topic','20 min'],['Find three sources','30 min'],['Write an outline','30 min'],['Draft the introduction','30 min'],['Draft the body','60 min'],['Edit and submit','30 min']];
const reading = [['Read chapter 4','30 min'],['Read chapter 5','30 min'],['Review your notes','20 min'],['Try one practice quiz','30 min']];
const Breakdown = () => { const fr = useCurrentFrame();
  const splitP = io(fr, f(13) + 30, f(13) + 50); const big = useS(f(12));
  const essayAt = [f(14), f(14)+38, f(14)+75, f(15), f(15)+40, f(15)+80];
  const readAt = [f(19), f(19)+30, f(19)+60, f(19)+100];
  const verbs = io(fr, f(17), f(17) + 12) * (1 - io(fr, f(18) - 10, f(18)));
  return <Scene id="breakdown">
    <StepTag n={1} label="Break it down" color={C.blue} at={f(9)}/>
    {/* definition card */}
    <Card style={{position:'absolute', left:110, top:200, width:560, padding:36, opacity: io(fr, f(10), f(10)+12) * (1 - io(fr, f(12)-6, f(12)+6))}}>
      <div style={{fontSize:28, color:C.sub, fontWeight:700}}>A SMALL STEP…</div>
      <div style={{fontSize:38, fontWeight:700, color:C.ink, marginTop:14, display:'flex', gap:14, alignItems:'center'}}><Icon name="clock" size={44} color={C.blue}/>fits in one sitting</div>
      <div style={{fontSize:38, fontWeight:700, color:C.ink, marginTop:14, opacity:io(fr, f(11), f(11)+12), display:'flex', gap:14, alignItems:'center'}}><Icon name="check" size={44} color={C.green}/>starts with a verb</div>
      <div style={{display:'flex', gap:12, marginTop:22, opacity:io(fr, f(11)+30, f(11)+45)}}>{['Read','Write','Check'].map(v => <span key={v} style={{padding:'8px 18px', borderRadius:12, background:C.blue+'18', color:C.blue, fontSize:30, fontWeight:800}}>{v}</span>)}</div>
    </Card>
    {/* big task card that splits */}
    <div style={{position:'absolute', left:110, top:210, opacity: big}}>
      <Card style={{width:640, padding:'26px 30px', display:'flex', alignItems:'center', gap:22, transform:`scale(${1 + 0.05*Math.sin(fr/8)*(1-splitP)*io(fr,f(13),f(13)+5)})`, border:`3px solid ${splitP>0 ? C.blue : 'transparent'}`}}>
        <Icon name="doc" size={54} color={C.blue}/><div style={{fontSize:42, fontWeight:800, color:C.ink}}>Write the essay</div>
        <div style={{marginLeft:'auto', fontSize:26, fontWeight:700, color: splitP>0.5 ? C.green : C.coral}}>{splitP > 0.5 ? '6 steps' : 'Too big'}</div></Card>
      <div style={{marginTop:22, marginLeft:30, position:'relative'}}>
        <div style={{position:'absolute', left:-18, top:0, width:4, height: 6*76*splitP, background:C.blue+'55', borderRadius:2}}/>
        {essay.map(([t, m], i) => <div key={i} style={{position:'relative'}}>
          <Row text={t} at={essayAt[i]} time={m} timeAt={f(20)+i*4} color={C.blue} w={610}/>
          <div style={{position:'absolute', left:52, top:14, fontSize:32, fontWeight:900, color:C.violet, opacity:verbs}}>{''}</div></div>)}
      </div>
    </div>
    {/* verb highlight overlay */}
    <div style={{position:'absolute', left:830, top:210, width:980, height:120, display:'flex', alignItems:'center', opacity:verbs}}>
      <Card style={{padding:'22px 30px', fontSize:34, fontWeight:700, color:C.ink}}>Each step: <span style={{color:C.violet}}>a verb</span> + <span style={{color:C.green}}>a clear end</span></Card></div>
    {/* reading & quiz */}
    <div style={{position:'absolute', left:1000, top:360, opacity: io(fr, f(18), f(18)+12), transform:`translateY(${io(fr,f(18),f(18)+12,40,0)}px)`}}>
      <Card style={{width:640, padding:'26px 30px', display:'flex', alignItems:'center', gap:22}}><Icon name="book" size={54} color={C.green}/><div style={{fontSize:42, fontWeight:800, color:C.ink}}>Reading + Quiz</div></Card>
      <div style={{marginTop:22, marginLeft:30}}>{reading.map(([t, m], i) => <Row key={i} text={t} at={readAt[i]} time={m} timeAt={f(20)+24+i*4} color={C.green} w={610}/>)}</div>
    </div>
    {/* counter */}
    {(() => { const s = useS(f(21)); const n = Math.round(interpolate(fr, [f(21), f(21)+30], [3, 10], {extrapolateLeft:'clamp', extrapolateRight:'clamp'}));
      return <div style={{position:'absolute', right:110, top:70, opacity:s, transform:`scale(${0.8+0.2*s})`}}><Card style={{padding:'18px 30px', fontSize:38, fontWeight:800, color:C.ink}}>
        <span style={{color:C.coral, textDecoration:'line-through'}}>3 big tasks</span> → <span style={{color:C.green, display:'inline-block', transform:`scale(${1 + 0.15*Math.sin(lemo.seg(fr, f(21), f(21)+30)*Math.PI*7)*(1-lemo.seg(fr, f(21), f(21)+30))})`}}>{n} small steps</span></Card><Burst x={380} y={40} at={f(21)+30} colors={[C.green, C.amber, C.blue, C.violet]} n={22} r={160} seed={7}/></div>; })()}
  </Scene>; };

// ---------- Calendar ----------
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
type Slot = {d: number; r: number; label: string; c: string; kind: 'read'|'essay'|'free'};
const SLOTS: Slot[] = [
  {d:0,r:0,label:'Read ch. 4',c:C.green,kind:'read'},{d:0,r:1,label:'Choose topic',c:C.blue,kind:'essay'},
  {d:1,r:0,label:'Read ch. 5',c:C.green,kind:'read'},{d:1,r:1,label:'Find sources',c:C.blue,kind:'essay'},
  {d:2,r:0,label:'Review notes',c:C.green,kind:'read'},{d:2,r:1,label:'Outline',c:C.blue,kind:'essay'},
  {d:3,r:0,label:'Practice quiz',c:C.green,kind:'read'},{d:3,r:1,label:'Draft intro',c:C.blue,kind:'essay'},
  {d:5,r:0,label:'Draft body',c:C.blue,kind:'essay'},{d:5,r:1,label:'Edit + submit',c:C.blue,kind:'essay'},{d:5,r:2,label:'Free slot',c:C.amber,kind:'free'},
];
const CX = 150, CY = 250, CW = 230, RH = 120;
const Calendar = ({mode}: {mode: 'plan'|'review'}) => { const fr = useCurrentFrame();
  const availAt = f(24); const placeRead = f(29); const placeEssay = f(30);
  const isPlan = mode === 'plan';
  const avail = (d: number) => isPlan ? io(fr, availAt + d*6, availAt + d*6 + 12) : 1;
  const slotAt = (s: Slot, i: number) => !isPlan ? -999 : s.kind === 'read' ? placeRead + s.d*8 : s.kind === 'essay' ? placeEssay + i*5 : f(31);
  const checkDay = (d: number) => mode === 'review' ? f(34) + d*10 : 99999;
  const moveP = mode === 'review' ? io(fr, f(38)+10, f(38)+40) : 0;
  const wedLate = mode === 'review' ? io(fr, f(36)+10, f(36)+20) : 0;
  const rows = (d: number) => d === 5 ? 3 : d < 4 ? 2 : 0;
  return <div style={{position:'absolute', left:0, top:0}}>
    {DAYS.map((dn, d) => <div key={d} style={{position:'absolute', left:CX + d*CW, top:CY - 70, width:CW-16, textAlign:'center', fontSize:32, fontWeight:800, color: d===4 ? C.coral : C.ink}}>{dn}</div>)}
    {DAYS.map((_, d) => <div key={'col'+d} style={{position:'absolute', left:CX + d*CW, top:CY, width:CW-16, height:RH*3 + 20, borderRadius:20, background:'#FFFFFFAA', border:'2px solid #E2E6EE'}}/>)}
    {/* available time blocks */}
    {DAYS.map((_, d) => Array.from({length: rows(d)}).map((__, r) => <div key={`a${d}${r}`} style={{position:'absolute', left:CX + d*CW + 10, top:CY + 10 + r*RH, width:CW-36, height:RH-14, borderRadius:14, border:`2.5px dashed ${C.sub}66`, opacity:avail(d), transform:`scale(${0.9 + 0.1*avail(d)})`}}/>))}
    {isPlan && <div style={{position:'absolute', left:CX, top:CY + RH*3 + 40, width:1600, fontSize:28, color:C.sub, opacity:io(fr, availAt+40, availAt+55)}}>Example only: ~1 hour on weekday evenings (two 30-min blocks), a longer block on Saturday.</div>}
    {/* quiz marker */}
    <div style={{position:'absolute', left:CX + 4*CW + 10, top:CY + 90, width:CW-36, height:140, borderRadius:18, background:C.coral, color:'#fff', display:'grid', placeItems:'center', fontSize:36, fontWeight:800, opacity: isPlan ? io(fr, f(29)-15, f(29)) : 1, transform:`scale(${isPlan ? lemo.back(lemo.seg(fr, f(29)-15, f(29))) : 1})`}}><div style={{textAlign:'center'}}><Icon name="quiz" size={52} color="#fff"/><div>Quiz</div></div></div>
    {isPlan && (() => { const mins = [50,60,50,60,0,90,0]; const show = io(fr, placeEssay + 40, placeEssay + 60);
      return <div style={{position:'absolute', left:CX, top:CY + RH*3 + 100, opacity:show}}>
        <div style={{fontSize:24, fontWeight:700, color:C.sub, marginBottom:8, width:800}}>Planned minutes per day (example)</div>
        {mins.map((m, d) => { const k = lemo.eo(lemo.seg(fr, placeEssay + 45 + d*4, placeEssay + 70 + d*4));
          return <div key={d} style={{position:'absolute', left: d*CW, top:36, width:CW-16, height:70, display:'flex', alignItems:'flex-end', gap:10}}>
            <div style={{width: (CW-90) * (m/90) * k, height:22, borderRadius:11, background: d===5 ? C.amber : m ? C.blue : '#D5DAE3'}}/>
            <div style={{fontSize:22, fontWeight:800, color:C.ink}}>{m ? Math.round(m*k) : '—'}</div></div>; })}
      </div>; })()}
    {/* rest marker */}
    <div style={{position:'absolute', left:CX + 6*CW + 10, top:CY + 140, width:CW-36, textAlign:'center', fontSize:28, color:C.sub, opacity:avail(6)}}>Rest</div>
    {SLOTS.map((s, i) => { const at = slotAt(s, i); const p = isPlan ? spring({frame: fr - at, fps: FPS, config:{damping:16, stiffness:150, mass:0.7}}) : 1;
      let left = CX + s.d*CW + 10, top = CY + 10 + s.r*RH;
      const isOutline = s.label === 'Outline' && mode === 'review';
      if (isOutline) { left = interpolate(moveP, [0,1], [left, CX + 5*CW + 10]); top = interpolate(moveP, [0,1], [top, CY + 10 + 2*RH]) - Math.sin(moveP*Math.PI)*80; }
      if (s.kind === 'free' && mode === 'review') { if (moveP > 0.9) return null; }
      const checked = io(fr, checkDay(s.d), checkDay(s.d) + 8) * (isOutline ? 0 : 1) * (s.d <= 3 ? 1 : 0);
      return <div key={i} style={{position:'absolute', left, top, width:CW-36, height:RH-14, borderRadius:14, background: s.kind==='free' ? '#FFF6E6' : s.c, border: s.kind==='free' ? `3px dashed ${C.amber}` : 'none', color: s.kind==='free' ? C.amber : '#fff', padding:'12px 14px', boxSizing:'border-box', fontSize:26, fontWeight:800, opacity:p, transform:`translateY(${(1-p)*-120}px) scale(${0.85+0.15*p})`, boxShadow: s.kind==='free' ? 'none' : '0 8px 18px rgba(30,36,51,0.18)', zIndex: isOutline ? 5 : 1, outline: isOutline && wedLate>0 && moveP<1 ? `${4*wedLate}px solid ${C.coral}` : 'none'}}>
        {s.label}
        {checked > 0 && <div style={{position:'absolute', right:10, bottom:10, width:36, height:36, borderRadius:18, background:'#fff', display:'grid', placeItems:'center', transform:`scale(${lemo.back(checked)})`}}><DrawCheck p={checked*1.4} size={26} color={s.c}/></div>}
        {isPlan && <Burst x={(CW-36)/2} y={RH-14} at={at+6} colors={[s.c, '#fff', C.amber]} n={8} r={70} seed={i+3}/>}
        {mode==='review' && s.d<=3 && !isOutline && <Burst x={CW-54} y={RH-32} at={checkDay(s.d)} colors={[s.c, C.amber]} n={8} r={50} seed={i+11}/>}
        {isOutline && wedLate > 0 && moveP < 0.05 && <div style={{position:'absolute', left:0, top:-40, fontSize:24, color:C.coral, whiteSpace:'nowrap'}}>Took longer</div>}
      </div>; })}
  </div>; };

const CalendarScene = () => { const fr = useCurrentFrame();
  return <Scene id="calendar"><StepTag n={2} label="Schedule it" color={C.amber} at={f(22)}/>
    <Calendar mode="plan"/>
    <div style={{position:'absolute', right:110, top:80, opacity:io(fr, f(25), f(25)+10) * (1 - io(fr, f(27)-8, f(27)))}}><Card style={{padding:'16px 26px', fontSize:30, fontWeight:700, color:C.ink}}>Include classes, work, meals, rest</Card></div>
    <div style={{position:'absolute', right:110, top:80, opacity:io(fr, f(27), f(27)+10) * (1 - io(fr, f(31)-8, f(31)))}}><Card style={{padding:'16px 26px', fontSize:30, fontWeight:700, color:C.ink}}>Deadlines first · one step per block</Card></div>
  </Scene>; };

const ReviewScene = () => { const fr = useCurrentFrame(); const qs = io(fr, f(40), f(40)+15);
  return <Scene id="review"><StepTag n={3} label="Review and adjust" color={C.green} at={f(33)}/>
    <div style={{opacity: 1 - qs, transform:`scale(${1 - qs*0.05})`}}><Calendar mode="review"/></div>
    <div style={{position:'absolute', right:110, top:80, opacity:io(fr, f(35), f(35)+10) * (1 - io(fr, f(36)-6, f(36)))}}><Card style={{padding:'16px 26px', fontSize:30, fontWeight:700, color:C.ink, display:'flex', gap:12, alignItems:'center'}}><Icon name="clock" size={36} color={C.green}/>About 2 minutes a day</Card></div>
    <div style={{position:'absolute', right:110, top:80, opacity:io(fr, f(37), f(37)+10) * (1 - io(fr, f(38)-6, f(38)))}}><Card style={{padding:'16px 26px', fontSize:30, fontWeight:700, color:C.ink}}>Not a failure — useful information</Card></div>
    <div style={{position:'absolute', right:110, top:80, opacity:io(fr, f(39), f(39)+10) * (1 - io(fr, f(40)-6, f(40)))}}><Card style={{padding:'16px 26px', fontSize:30, fontWeight:700, color:C.ink, display:'flex', gap:12, alignItems:'center'}}><Icon name="split" size={36} color={C.blue}/>Keeps slipping? Split it again</Card></div>
    <div style={{position:'absolute', top:280, width:'100%', display:'flex', justifyContent:'center', gap:60, opacity:qs}}>
      {[['What worked?', C.green, f(41)], ['What should I change next week?', C.violet, f(41)+40]].map(([t, c, at], i) => { const s = useS(at as number);
        return <Card key={i} style={{width:620, padding:'50px 40px', borderTop:`10px solid ${c}`, opacity:s, transform:`translateY(${(1-s)*60}px)`}}>
          <div style={{fontSize:30, color:C.sub, fontWeight:700}}>QUESTION {i+1}</div><div style={{fontSize:52, fontWeight:800, color:C.ink, marginTop:14}}>{t as string}</div></Card>; })}
    </div>
    <div style={{position:'absolute', top:700, width:'100%', textAlign:'center', fontSize:36, fontWeight:700, color:C.sub, opacity:io(fr, f(42), f(42)+12)}}>→ a slightly better plan next week</div>
  </Scene>; };

const Recap = () => { const fr = useCurrentFrame(); const endP = io(fr, f(49) - 6, f(49) + 12);
  const items = [[1,'Break big tasks into small steps', C.blue, 'split', f(44)], [2,'Schedule them in the time you really have', C.amber, 'cal', f(45)], [3,'Review each day, and adjust', C.green, 'loop', f(46)]] as const;
  return <Scene id="recap">
    <div style={{opacity: 1 - endP}}>
      <div style={{position:'absolute', left:180, top:120, fontSize:72, fontWeight:900, color:C.ink, opacity:io(fr, f(43), f(43)+10)}}>Recap</div>
      {items.map(([n, t, c, ic, at], i) => { const s = useS(at);
        return <Card key={i} style={{position:'absolute', left:180, top:260 + i*150, width:1300, padding:'26px 34px', display:'flex', alignItems:'center', gap:28, opacity:s, transform:`translateX(${(1-s)*-80}px)`}}>
          <div style={{width:80, height:80, borderRadius:24, background:c, display:'grid', placeItems:'center'}}><Icon name={ic} size={48} color="#fff"/></div>
          <div style={{fontSize:46, fontWeight:800, color:C.ink}}>{n}. {t}</div></Card>; })}
      <div style={{position:'absolute', left:180, top:740, fontSize:36, fontWeight:700, color:C.sub, opacity:io(fr, f(47), f(47)+12)}}>A simple plan you use &gt; a perfect plan you never start.</div>
      <div style={{position:'absolute', left:180, top:800, fontSize:36, fontWeight:700, color:C.blue, opacity:io(fr, f(48), f(48)+12)}}>Try it with one task this week.</div>
    </div>
    <AbsoluteFill style={{justifyContent:'center', alignItems:'center', opacity:endP, transform:`scale(${0.96 + 0.04*endP + interpolate(fr,[f(49), tl.duration*FPS],[0,0.02])})`}}>
      <div style={{display:'flex', gap:18}}>{steps3.map((k, i) => <div key={i} style={{width:90, height:90, borderRadius:28, background:k.c, display:'grid', placeItems:'center'}}><Icon name={k.icon} size={54} color="#fff"/></div>)}</div>
      <div style={{fontSize:80, fontWeight:900, color:C.ink, marginTop:40, letterSpacing:-1.5}}>Thanks for watching</div>
      <div style={{fontSize:32, color:C.sub, marginTop:16}}>How to Build a Simple Study Plan · Personal sample by Weijian Zhao</div>
    </AbsoluteFill>
  </Scene>; };

// ---------- captions ----------
const Captions = () => { const fr = useCurrentFrame(); const t = fr / FPS;
  const cur = L.find(l => t >= l.start - 0.05 && t <= l.end + 0.35); if (!cur) return null;
  const a = io(fr, cur.start*FPS - 2, cur.start*FPS + 4);
  return <div style={{position:'absolute', bottom:54, width:'100%', display:'flex', justifyContent:'center', opacity:a}}>
    <div style={{maxWidth:1500, padding:'14px 30px', borderRadius:16, background:'rgba(20,24,36,0.82)', color:'#fff', fontSize:42, fontWeight:600, lineHeight:1.3, textAlign:'center'}}>{cur.text}</div></div>; };

const Progress = () => { const fr = useCurrentFrame(); const k = SCENES.findIndex((id, i) => fr >= sceneStart(id) - 20 && (i === SCENES.length-1 || fr < sceneStart(SCENES[i+1]) - 20));
  if (k < 2 || k > 4) return null; return <div style={{position:'absolute', right:110, bottom:200, display:'flex', gap:10}}>{[2,3,4].map(i => <div key={i} style={{width: i===k ? 46 : 14, height:14, borderRadius:7, background: i===k ? [C.blue,C.amber,C.green][i-2] : '#C5CBD6'}}/>)}</div>; };

export const StudyPlan = () => <AbsoluteFill style={{fontFamily:FONT}}>
  <Bg/><Hook/><Intro/><Breakdown/><CalendarScene/><ReviewScene/><Recap/>
  {SCENES.slice(1).map(id => <LightLeak key={id} at={sceneStart(id) - 9} dur={18} tint={TINTS[id]}/>)}
  <Progress/><Captions/>
  <Audio src={staticFile('vo.wav')}/>
</AbsoluteFill>;

export const Cover = () => <AbsoluteFill style={{fontFamily:FONT}}><Bg/>
  <div style={{position:'absolute', left:130, top:250}}>
    <div style={{fontSize:34, letterSpacing:6, color:C.sub, fontWeight:700}}>3 SIMPLE STEPS</div>
    <div style={{fontSize:118, fontWeight:900, color:C.ink, lineHeight:1.02, letterSpacing:-3, marginTop:16}}>How to Build a<br/>Simple <span style={{color:C.blue}}>Study Plan</span></div>
    <div style={{display:'flex', gap:20, marginTop:50}}>{steps3.map((k, i) => <div key={i} style={{display:'flex', alignItems:'center', gap:14, padding:'14px 22px', borderRadius:18, background:'#fff', boxShadow:'0 10px 24px rgba(30,36,51,0.1)'}}><div style={{width:54, height:54, borderRadius:16, background:k.c, display:'grid', placeItems:'center'}}><Icon name={k.icon} size={34} color="#fff"/></div><span style={{fontSize:32, fontWeight:800, color:C.ink}}>{k.t}</span></div>)}</div>
  </div>
  <div style={{position:'absolute', right:150, top:230, transform:'rotate(4deg)'}}><Card style={{width:440, padding:30}}>
    {['Read ch. 4','Choose topic','Write outline','Draft intro'].map((t, i) => <div key={i} style={{display:'flex', gap:16, alignItems:'center', marginBottom:18}}><div style={{width:40, height:40, borderRadius:10, background: i<2 ? C.green : 'transparent', border:`3.5px solid ${C.green}`, display:'grid', placeItems:'center'}}>{i<2 && <Icon name="check" size={28} color="#fff"/>}</div><span style={{fontSize:34, fontWeight:700, color:C.ink, textDecoration: i<2 ? 'line-through':'none', opacity: i<2 ? 0.6 : 1}}>{t}</span></div>)}
  </Card></div>
</AbsoluteFill>;
