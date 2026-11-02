import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, spring} from 'remotion';
import {PAL, SERIF, SANS, iv, PaperFrame, ObsSeal, CornerMarks} from '../g2/ObservationStage';
import {G4Clip, K, V} from '../g4/G4Clip';
import {GRID, KaraokeCaption, LedgerRows, BarChart, HBars, ArchiveClip, T3Flip} from '../g6/Kit';
import {LINES, KEYWORDS, TL} from '../g6/data';
import {BrandMark} from '../g6/BrandMark';
import {Big, S02} from '../g6/G6Sample';
import {PoseCharacter, PoseSet} from '../g6/PoseCharacter';
import xlP from '../g6/poses/xl.json';
import mmP from '../g6/poses/mm.json';
const XL = xlP as unknown as PoseSet, MM = mmP as unknown as PoseSet;
const XH = 880, MH = 860; // G3 lineup 相对身高锁定（林妈妈≈小林 0.98）

// E001 全片：时间全部来自 timeline.json / vo_full.json（字级）
export const FPS = 30;
export const G7_FRAMES = Math.ceil(((TL as any).totalSec ?? 69.74) * FPS) + 18;
const line = (shot: string, n = 0) => LINES.filter((l) => l.shot === shot)[n];
const T0 = (shot: string) => line(shot).start; // 本镜起点（秒）
const kw = (shot: string, w: string, n = 0) => { const l = line(shot, n); const tx = l.segs.map((s) => s.text).join(''); const i = tx.indexOf(w); if (i < 0) throw new Error('kw ' + w);
  let c = 0; for (const sg of l.segs) { if (c + sg.text.length > i) return l.start + sg.start; c += sg.text.length; } return l.start; };
const F = (sec: number) => Math.round(sec * FPS);
const SH = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08'];
const START: Record<string, number> = {S01: 0, S02: F(T0('S02')), S03: F(T0('S03') - 0.15), S04: F(T0('S04') - 0.15), S05: F(T0('S05') - 0.15), S06: F(T0('S06') - 0.15), S07: F(T0('S07') - 0.15), S08: F(T0('S08') - 0.15)};

const PaperBg: React.FC<{dark?: boolean}> = ({dark}) => <AbsoluteFill style={{background: dark ? PAL.ink : 'radial-gradient(ellipse at 50% 25%, #F6ECD9 0%, #EAD9BA 100%)'}} />;
const Ground: React.FC = () => <svg width={1080} height={420} viewBox="0 0 1080 420" style={{position: 'absolute', left: 0, top: 1560}}>
  <path d="M0,90 C180,40 330,120 540,70 C760,20 900,100 1080,60 L1080,420 L0,420Z" fill={PAL.teal} opacity=".35" />
  <path d="M0,150 C200,110 380,180 560,140 C760,100 920,170 1080,130 L1080,420 L0,420Z" fill="#C9D5C4" />
  <path d="M0,250 C220,215 420,275 600,240 C800,205 940,262 1080,230 L1080,420 L0,420Z" fill={PAL.ink} opacity=".85" /></svg>;
const Store: React.FC<{f: number}> = ({f}) => <>
  <Img src={staticFile('g2/bg.jpg')} style={{position: 'absolute', left: -100, top: 0, width: 1280, height: 1920, filter: 'blur(3px) saturate(.9)', transform: `scale(${1.04 + f * 0.0002})`}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(241,228,204,.15), rgba(32,60,58,.28))'}} />
  <div style={{position: 'absolute', left: 90, top: 1490, width: 900, height: 60, borderRadius: '50%', background: 'rgba(40,25,10,.18)', filter: 'blur(10px)'}} /></>;
const sticker = 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 12px 10px rgba(40,25,10,.32))';
const Win: React.FC<{children: React.ReactNode; title?: React.ReactNode; sub?: string}> = ({children, title, sub}) => <>
  <div style={{position: 'absolute', left: GRID.win.x, top: GRID.win.y, width: GRID.win.w, height: GRID.win.h, background: '#FBF4E4', overflow: 'hidden'}}>
    {title && <div style={{position: 'absolute', left: 60, top: 64, fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: PAL.ink}}>{title}</div>}
    {sub && <div style={{position: 'absolute', left: 64, top: 150, fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .6}}>{sub}</div>}
    {children}</div>
  <PaperFrame r={GRID.win} /></>;
const Card: React.FC<{f: number; at: number; label: string; children: React.ReactNode; seal?: number}> = ({f, at, label, children, seal}) => {
  if (f < at) return null; const p = iv(f, at, at + 6);
  return <div style={{position: 'absolute', left: GRID.card.x, top: GRID.card.y + (1 - p) * 30, width: GRID.card.w, height: GRID.card.h, opacity: p, background: '#FFFDF6', borderRadius: 6, boxShadow: '0 8px 0 rgba(80,52,24,.14), 0 14px 22px rgba(80,52,24,.12)'}}>
    <div style={{position: 'absolute', left: 32, top: 26, fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .7}}>{label}</div>
    <div style={{position: 'absolute', left: 32, top: 70, fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: PAL.ink, whiteSpace: 'nowrap'}}>{children}</div>
    {seal !== undefined && <ObsSeal f={f - seal} x={GRID.card.w - 90} y={88} size={130} />}
  </div>;
};
const Sticker: React.FC<{f: number; at: number; x: number; y: number; rot: number; children: React.ReactNode; color?: string}> = ({f, at, x, y, rot, children, color = PAL.vermilion}) => {
  if (f < at) return null; const s = spring({frame: f - at, fps: 30, config: {damping: 9, stiffness: 220}});
  return <div style={{position: 'absolute', left: x, top: y, padding: '10px 24px', background: '#FFFDF6', borderRadius: 10, border: '5px solid #fff', boxShadow: `0 0 0 3px ${PAL.ink}, 0 10px 14px rgba(0,0,0,.25)`, fontFamily: SERIF, fontWeight: 900, fontSize: 54, color, transform: `rotate(${rot}deg) scale(${interpolate(s, [0, 1], [1.6, 1])})`, opacity: Math.min(1, s * 2), whiteSpace: 'nowrap'}}>{children}</div>;
};
const Note: React.FC<{text: string; dark?: boolean}> = ({text, dark}) => <div style={{position: 'absolute', left: GRID.L, width: GRID.W, top: 1218, textAlign: 'right', fontFamily: SANS, fontSize: 22, color: dark ? PAL.paper : PAL.ink, opacity: .65}}>{text}</div>;

// —— S03：办卡以后（S0，小林推车，三拍贴纸） ——
const S03: React.FC<{f: number}> = ({f}) => {
  const a = START.S03; const b1 = F(kw('S03', '拿大的')) - a, b2 = F(kw('S03', '凑一件')) - a, b3 = F(kw('S03', '再逛逛')) - a, b4 = F(kw('S03', '三百')) - a;
  const beat = [b1, b2, b3].reduce((m, b) => m + (f >= b ? Math.exp(-(f - b) / 5) : 0), 0);
  return <AbsoluteFill><Store f={f} />
    <div style={{position: 'absolute', inset: 0, filter: sticker, transform: `scale(${1 + 0.025 * beat})`, transformOrigin: '540px 1410px'}}>
      <PoseCharacter set={XL} f={f} x={300} y={1410} height={XH - 40} track={[{at: 0, pose: 'push_cart'}, {at: b4 - 4, pose: 'surprised'}]} walk={{fromX: -80, start: 0, dur: 26}} />
    </div>
    <Big f={f} a={0} b={b1 - 6}>办卡<span style={{color: PAL.vermilion}}>以后</span></Big>
    <Sticker f={f} at={b1} x={560} y={560} rot={-6}>拿大的</Sticker>
    <Sticker f={f} at={b2} x={640} y={720} rot={5}>凑一件</Sticker>
    <Sticker f={f} at={b3} x={560} y={880} rot={-3}>再逛逛</Sticker>
    {f >= b4 && <Big f={f} a={b4} b={9999}>每月 <span style={{color: PAL.vermilion}}>+¥300</span></Big>}
    {f >= b4 && <div style={{position: 'absolute', left: 0, width: 1080, top: 390, textAlign: 'center', fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .65 * iv(f, b4, b4 + 6)}}>原本没打算买（示意）</div>}
  </AbsoluteFill>;
};
// —— S04：一年总账柱图（S2） ——
const S04: React.FC<{f: number}> = ({f}) => {
  const a = START.S04; const at = (w: string) => F(kw('S04', w)) - a;
  return <AbsoluteFill><PaperBg /><Ground />
    <Win title={<>一年下来，<span style={{color: PAL.vermilion}}>总账</span></>} sub="小林 · 一年（示意）">{null}</Win>
    <BarChart f={f} r={{x: 120, y: 420, w: 840, h: 760}} max={3600} bars={[{label: '省下', value: 768, color: PAL.teal, at: at('七百六') - 4}, {label: '多买', value: 3600, color: PAL.vermilion, at: at('三千六') - 4}, {label: '年费', value: 260, color: PAL.brass, at: at('年费') - 4}]} />
    <Card f={f} at={at('三千出头') - 2} label="总支出 9600 → 12692（示意）">反而多花 <span style={{color: PAL.vermilion}}>¥3092</span></Card>
  </AbsoluteFill>;
};
// —— S05：研究档案（T3 翻页进入） ——
const S05: React.FC<{f: number}> = ({f}) => {
  const a = START.S05;
  return <AbsoluteFill><PaperBg dark /><Ground />
    <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + f * 0.00018}) rotate(${Math.sin(f / 50) * 0.4}deg)`, transformOrigin: '540px 760px'}}><ArchiveClip f={f} r={{x: 104, y: 300, w: 872, h: 920}} head="开通付费会员后，用户买得明显更多" frac={1 / 3} fracLabel="≈1/3" sweepAt={F(kw('S05', '三分之一')) - a - 4}
      note="多买的部分，只有约三分之一能用优惠解释；其余可能与“交了钱想回本”的心理有关。" src="Iyengar, Park & Yu (2022), J. Marketing Research · 单一零售商研究，结论不一定普适" /></div>
  </AbsoluteFill>;
};
// —— S06：Costco 会员费 vs 营业利润 ——
const S06: React.FC<{f: number}> = ({f}) => {
  const a = START.S06;
  return <AbsoluteFill><PaperBg /><Ground />
    <Win title={<>会员费 ≈ 营业利润的<span style={{color: PAL.vermilion}}>一半</span></>} sub="Costco FY2025（截至 2025-08-31）">
      <div style={{position: 'absolute', left: 0, top: 260, width: 912}}>
        {f >= F(kw('S06', '会员费')) - a - 24 && <HBars f={f - (F(kw('S06', '会员费')) - a - 24)} r={{x: 0, y: 0, w: 912, h: 500}} rows={[{label: '营业利润  $103.8 亿', frac: 1, color: PAL.teal}, {label: '会员费收入  $53.2 亿', frac: 0.513, color: PAL.vermilion, mark: '≈51%'}]} />}
      </div>
      <div style={{position: 'absolute', left: 64, bottom: 40, fontFamily: SANS, fontSize: 22, color: PAL.ink, opacity: .6}}>来源：Costco FY2025 财报新闻稿（2025-09-25）</div>
    </Win>
  </AbsoluteFill>;
};
// —— S07：真省钱的条件（S0，两人开心 + 三个勾） ——
const S07: React.FC<{f: number}> = ({f}) => {
  const a = START.S07; const at = (w: string) => F(kw('S07', w)) - a;
  const rows = [{t: '本来就常买', at: at('常买')}, {t: '东西用得完', at: at('用得完')}, {t: '也不凑单', at: at('不凑单')}];
  return <AbsoluteFill><Store f={f} />
    <div style={{position: 'absolute', inset: 0, filter: sticker}}>
      <PoseCharacter set={XL} f={f} x={250} y={1410} height={XH - 110} track={[{at: 0, pose: 'stand_neutral'}, {at: at('真省钱'), pose: 'happy'}]} />
      <PoseCharacter set={MM} f={f} x={830} y={1415} height={MH - 110} flip track={[{at: 0, pose: 'stand_neutral'}, {at: at('常买'), pose: 'point'}, {at: at('真省钱'), pose: 'happy'}]} />
    </div>
    <div style={{position: 'absolute', left: 230, top: 250, width: 620, padding: '18px 40px', background: '#FFFDF6', borderRadius: 12, boxShadow: `0 0 0 3px ${PAL.ink}, 0 12px 18px rgba(0,0,0,.25)`, opacity: iv(f, 2, 10)}}>
      <div style={{fontFamily: SANS, fontSize: 28, color: PAL.ink, opacity: .65, marginBottom: 8}}>如果你……</div>
      {rows.map((r, i) => <div key={i} style={{display: 'flex', alignItems: 'center', height: 66, opacity: f >= r.at ? 1 : 0.25, fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: PAL.ink}}>
        <svg width={70} height={60}><path d="M8 32 L28 52 L62 8" stroke={PAL.vermilion} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={100} strokeDashoffset={100 * (1 - iv(f, r.at, r.at + 6))} /></svg>{r.t}</div>)}
      <div style={{marginTop: 6, fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: PAL.vermilion, opacity: iv(f, at('真省钱'), at('真省钱') + 5), transform: `scale(${1.3 - 0.3 * iv(f, at('真省钱'), at('真省钱') + 4)})`, transformOrigin: 'left center'}}>→ 会员价就是真省钱</div>
    </div>
  </AbsoluteFill>;
};
// —— S08：办卡前算一笔（S2 公式 + 收尾盖印） ——
const S08: React.FC<{f: number}> = ({f}) => {
  const a = START.S08; const at = (w: string) => (F(kw('S08', w)) - a) / 30;
  const t = f / 30;
  return <AbsoluteFill><PaperBg /><Ground />
    <Win title={<>办卡前，<span style={{color: PAL.vermilion}}>算一笔</span></>} sub="翻翻过去三个月的账单">
      <LedgerRows t={t} r={{x: 40, y: 230, w: 730, h: 600}} checkAt={at('正数') + 0.3} rows={[
        {k: '只算原本就会买的', v: '¥A', at: at('只算')}, {k: '乘上折扣', v: '× 折扣', at: at('乘上')}, {k: '再减年费', v: '− 年费', at: at('再减')}, {k: '是正数再办', v: '> 0', at: at('正数'), hl: true}]} />
    </Win>
    <Card f={f} at={F(at('以后') * 1) - 2} label="办了以后" seal={F(at('多少')) + 8}>每月看<span style={{color: PAL.vermilion}}>总支出</span></Card>
  </AbsoluteFill>;
};

// 音效：[秒, 文件, 音量]（规律见 docs/BLACKHOLE_LEARNINGS.md）
const fs = (sec: number) => sec;
const SFX: [number, string, number][] = [
  // S01（同 rev2 样片）
  [0, 'sub_hit.wav', 0.9], [0, 'whoosh.wav', 0.45], [K.card / 30, 'click_002.ogg', 0.7], [K.save / 30, 'confirmation_002.ogg', 0.6],
  [(V[1].from - 2) / 30, 'scroll_002.ogg', 0.5], [V[1].from / 30, 'sub_hit.wav', 0.5], [K.point / 30, 'pluck_001.ogg', 0.6],
  ...[0, 1, 2, 3, 4].map((i) => [(K.stack + i * 8) / 30, 'pluck_001.ogg', 0.42] as [number, string, number]),
  [(K.s2 - 14) / 30, 'maximize_003.ogg', 0.45], [(K.s2 - 1) / 30, 'whoosh.wav', 0.4],
  ...[0, 1, 2, 3, 4].map((i) => [(K.morph + i * 4) / 30, 'select_001.ogg', 0.32] as [number, string, number]),
  [V[2].from / 30, 'sub_hit.wav', 0.45], [K.seal / 30, 'bong_001.ogg', 0.55],
  // S02
  [T0('S02') - 0.07, 'whoosh.wav', 0.5], ...['八百', '两百六', '百分之八', '七百', '五百'].map((w) => [kw('S02', w), 'pluck_001.ogg', 0.6] as [number, string, number]),
  [kw('S02', '五百') + 0.4, 'confirmation_002.ogg', 0.6], [kw('S02', '五百') + 0.5, 'whoosh.wav', 0.3], [kw('S02', '没错'), 'thock.wav', 0.8], [kw('S02', '没错'), 'bong_001.ogg', 0.5],
  // S03
  [START.S03 / 30 - 0.05, 'whoosh.wav', 0.5], [kw('S03', '问题'), 'sub_hit.wav', 0.5], ...['拿大的', '凑一件', '再逛逛'].map((w) => [kw('S03', w), 'pluck_001.ogg', 0.7] as [number, string, number]),
  ...['拿大的', '凑一件', '再逛逛'].map((w) => [kw('S03', w) + 0.05, 'drop_002.ogg', 0.4] as [number, string, number]), [kw('S03', '三百'), 'sub_hit.wav', 0.55], [kw('S03', '三百'), 'glass_002.ogg', 0.4],
  // S04
  [START.S04 / 30 - 0.05, 'whoosh.wav', 0.5], ...['七百六', '三千六', '年费'].map((w) => [kw('S04', w) - 0.1, 'pluck_001.ogg', 0.55] as [number, string, number]),
  ...[0, 1, 2, 3].map((i) => [kw('S04', '三千六') - 0.1 + i * 0.13, 'tick_001.ogg', 0.35] as [number, string, number]), [kw('S04', '三千出头') - 0.07, 'thock.wav', 0.8], [kw('S04', '三千出头'), 'sub_hit.wav', 0.5],
  // S05
  [START.S05 / 30 - 0.05, 'scroll_002.ogg', 0.6], [kw('S05', '明显'), 'pluck_001.ogg', 0.5], [kw('S05', '三分之一') - 0.13, 'switch_002.ogg', 0.5], [kw('S05', '三分之一') + 0.9, 'glass_002.ogg', 0.4], [kw('S05', '回本'), 'confirmation_002.ogg', 0.45],
  // S06
  [START.S06 / 30 - 0.05, 'whoosh.wav', 0.5], [kw('S06', '不怕'), 'sub_hit.wav', 0.45], [kw('S06', '会员费') - 0.8, 'pluck_001.ogg', 0.5], [kw('S06', '会员费') - 0.27, 'pluck_001.ogg', 0.5], [kw('S06', '一半'), 'thock.wav', 0.8], [kw('S06', '一半'), 'glass_002.ogg', 0.45],
  // S07
  [START.S07 / 30 - 0.05, 'whoosh.wav', 0.5], ...['常买', '用得完', '不凑单'].map((w) => [kw('S07', w), 'tick_001.ogg', 0.6] as [number, string, number]), [kw('S07', '真省钱'), 'confirmation_002.ogg', 0.6],
  // S08
  [START.S08 / 30 - 0.05, 'whoosh.wav', 0.5], [kw('S08', '办卡前'), 'sub_hit.wav', 0.5], ...['只算', '乘上', '再减', '正数'].map((w) => [kw('S08', w), 'pluck_001.ogg', 0.55] as [number, string, number]),
  [kw('S08', '正数') + 0.3, 'confirmation_002.ogg', 0.55], [kw('S08', '以后') - 0.07, 'whoosh.wav', 0.3], [kw('S08', '多少') + 8 / 30, 'thock.wav', 0.8], [kw('S08', '多少') + 8 / 30, 'bong_001.ogg', 0.6],
].map(([t, n, v]) => [fs(t as number), n as string, v as number]);

// v2：换成黑洞片同款网感音效库（assets/sfx/SOURCES.md）；旧名 → 新文件、音量系数
const NEWSFX: Record<string, [string, number]> = {
  'sub_hit.wav': ['vine-boom', 0.55], 'whoosh.wav': ['166', 0.7], 'thock.wav': ['punch_u4LmMsr', 0.6], 'click_002.ogg': ['camera_zLdd1zp', 0.6],
  'confirmation_002.ogg': ['ding-sound-effect_2', 0.45], 'glass_002.ogg': ['sparkle-sound-effect', 0.4], 'bong_001.ogg': ['taco-bell-bong-sfx', 0.35],
  'pluck_001.ogg': ['pop_7e9Is8L', 0.6], 'drop_002.ogg': ['cartoon-boing_7vRWDlc', 0.35], 'scroll_002.ogg': ['whoosh-wind', 0.6], 'maximize_003.ogg': ['transition-whoosh', 0.45],
  'select_001.ogg': ['pop_7e9Is8L', 0.35], 'switch_002.ogg': ['shocking_0NL2w3I', 0.4], 'tick_001.ogg': ['tick_001.ogg', 1], 'minimize_003.ogg': ['whoosh-sfx', 0.5],
};
const sfxSrc = (file: string, vol: number): [string, number] => { const m = NEWSFX[file]; if (!m || m[0].includes('.')) return [`g6/audio/${file}`, vol]; return [`g6/sfx/${m[0]}.wav`, vol * m[1] * 1.6]; };
export const G7Full: React.FC = () => {
  const f = useCurrentFrame();
  const idx = SH.reduce((m, s, i) => (f >= START[s] ? i : m), 0); const shot = SH[idx]; const lf = f - START[shot];
  const render = (s: string, g: number) => s === 'S03' ? <S03 f={g} /> : s === 'S04' ? <S04 f={g} /> : s === 'S05' ? <S05 f={g} /> : s === 'S06' ? <S06 f={g} /> : s === 'S07' ? <S07 f={g} /> : <S08 f={g} />;
  let body: React.ReactNode;
  if (shot === 'S01') {
    const push = interpolate(f, [0, 14], [1.18, 1], {extrapolateRight: 'clamp', easing: (x) => 1 - Math.pow(1 - x, 3)});
    const blur = interpolate(f, [0, 8], [5, 0], {extrapolateRight: 'clamp'});
    body = <AbsoluteFill style={{transform: `scale(${push})`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined}}>
      <G4Clip layout="C" noTzs noVo newChars />
      <Big f={f} a={0} b={100}>办卡<span style={{color: PAL.vermilion}}>=</span>省钱？</Big>
      <Big f={f} a={V[1].from} b={K.s2 - 10}>会员价 <span style={{color: PAL.vermilion}}>更便宜</span></Big>
    </AbsoluteFill>;
  } else if (shot === 'S02') body = <S02 f={lf} />;
  else if (shot === 'S05' && lf < 16) body = <T3Flip p={iv(lf, 0, 16)} a={render('S04', f - START.S04)} b={render('S05', lf)} />;
  else { const p = iv(lf, 0, 8); body = <div style={{position: 'absolute', inset: 0, transform: `scale(${0.94 + 0.06 * p})`, opacity: Math.min(1, 0.3 + p)}}>{render(shot, lf)}</div>; }
  // 字幕：S01 用 G4 内置；其余逐字高亮
  const cl = shot === 'S01' ? null : line(shot);
  const dark = shot === 'S05';
  return <AbsoluteFill style={{background: '#EAD9BA'}}>
    {body}
    {cl && <div style={{position: 'absolute', inset: 0, filter: dark ? 'invert(0)' : undefined}}>
      {dark && <div style={{position: 'absolute', left: 60, width: 960, top: GRID.capY - 14, height: 96, background: 'rgba(241,228,204,.92)', borderRadius: 12}} />}
      <KaraokeCaption line={cl} t={f / 30 - cl.start} keywords={KEYWORDS[shot]} /></div>}
    <BrandMark f={f} v="A" />
    <Audio src={staticFile('g6/audio/E001_vo_full.wav')} />
    {SFX.map(([t, file, vol], i) => { const [src, v] = sfxSrc(file, vol); return <Sequence key={i} from={Math.max(0, Math.round(t * 30))} durationInFrames={75}><Audio src={staticFile(src)} volume={Math.min(1, v)} /></Sequence>; })}
    <Audio src={staticFile('g6/audio/bgm_investigations.mp3')} loop volume={(g) => 0.085 * interpolate(g, [0, 10, G7_FRAMES - 30, G7_FRAMES], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
  </AbsoluteFill>;
};
