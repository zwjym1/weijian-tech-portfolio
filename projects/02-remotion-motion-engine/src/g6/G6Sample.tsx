import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {PAL, SERIF, SANS, iv, PaperFrame, ObsSeal} from '../g2/ObservationStage';
import {G4Clip, K, V} from '../g4/G4Clip';
import {GRID, KaraokeCaption, LedgerRows} from './Kit';
import {LINES, KEYWORDS} from './data';
import {BrandMark} from './BrandMark';

// S01–S02 样片：G4 片头（去掉通政使入画）+ S02 账本；按黑洞片规律卡点（见 docs/BLACKHOLE_LEARNINGS.md）
export const S2_AT = 312; // S02 起点 = timeline 10.4s
const L3 = LINES[3]; // S02 台词
const kw = (w: string) => { const txt = L3.segs.map((s) => s.text).join(''); return L3.segs[txt.indexOf(w)].start; };
const ROWS = [{k: '原本每月买', v: '¥800', at: kw('八百')}, {k: '年费', v: '¥260', at: kw('两百六')}, {k: '会员价便宜', v: '≈8%', at: kw('百分之八')}, {k: '一年省', v: '¥768', at: kw('七百')}, {k: '扣掉年费，净省', v: '¥508', at: kw('五百'), hl: true}];
export const G6_SAMPLE_FRAMES = Math.min(598, S2_AT + Math.ceil(L3.sec * 30) + 4); // ≤20s
const fr = (sec: number) => S2_AT + Math.round(sec * 30);

// 音效表：[帧, 文件, 音量]——规则：大字/关键词落点 Δ=0；镜头运动前置 1–2 帧嗖声；计数用 tick 连打
const SFX: [number, string, number][] = [
  [0, 'sub_hit.wav', 0.9], [0, 'whoosh.wav', 0.45],
  [K.card, 'click_002.ogg', 0.7], [K.save, 'confirmation_002.ogg', 0.6],
  [V[1].from - 2, 'scroll_002.ogg', 0.5], [V[1].from, 'sub_hit.wav', 0.5], [K.point, 'pluck_001.ogg', 0.6],
  ...[0, 1, 2, 3, 4].map((i) => [K.stack + i * 8, 'pluck_001.ogg', 0.42] as [number, string, number]),
  [K.s2 - 14, 'maximize_003.ogg', 0.45], [K.s2 - 1, 'whoosh.wav', 0.4],
  ...[0, 1, 2, 3, 4].map((i) => [K.morph + i * 4, 'select_001.ogg', 0.32] as [number, string, number]),
  [V[2].from, 'sub_hit.wav', 0.45],
  [K.seal, 'bong_001.ogg', 0.55], [K.collapse - 1, 'minimize_003.ogg', 0.45],
  [S2_AT - 2, 'whoosh.wav', 0.5], [S2_AT + 3, 'tick_001.ogg', 0.4],
  ...ROWS.map((r) => [fr(r.at), 'pluck_001.ogg', 0.6] as [number, string, number]),
  [fr(kw('五百') + 0.4), 'confirmation_002.ogg', 0.6], [fr(kw('五百') + 0.5), 'whoosh.wav', 0.3], [fr(kw('没错')), 'thock.wav', 0.8], [fr(kw('没错')), 'bong_001.ogg', 0.5],
];

// 大字（黑洞片 Big：1.3→1 / 0.14s，-3°→0，粗描边），放在 S0 上半部空白处
export const Big: React.FC<{f: number; a: number; b: number; children: React.ReactNode; y?: number}> = ({f, a, b, children, y = 250}) => {
  if (f < a || f > b) return null;
  const k = iv(f, a, a + 4);
  return <div style={{position: 'absolute', left: 0, width: 1080, top: y, textAlign: 'center', opacity: Math.min(1, 0.55 + k) * (1 - iv(f, b - 4, b)), transform: `scale(${1.3 - 0.3 * k}) rotate(${-3 + 3 * k}deg)`, transformOrigin: '540px 60px',
    fontFamily: SERIF, fontWeight: 900, fontSize: 112, lineHeight: 1.1, color: PAL.ink, WebkitTextStroke: '14px #FFFDF6', paintOrder: 'stroke fill', textShadow: '0 8px 22px rgba(60,40,20,.28)'}}>{children}</div>;
};

export const S02: React.FC<{f: number}> = ({f}) => {
  const t = f / 30; const inn = iv(f, 0, 8);
  const sum = kw('没错'); const cIn = kw('五百') + 0.5;
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 25%, #F6ECD9 0%, #EAD9BA 100%)'}}>
    <svg width={1080} height={420} viewBox="0 0 1080 420" style={{position: 'absolute', left: 0, top: 1560}}>
      <path d="M0,90 C180,40 330,120 540,70 C760,20 900,100 1080,60 L1080,420 L0,420Z" fill={PAL.teal} opacity=".35" />
      <path d="M0,150 C200,110 380,180 560,140 C760,100 920,170 1080,130 L1080,420 L0,420Z" fill="#C9D5C4" />
      <path d="M0,250 C220,215 420,275 600,240 C800,205 940,262 1080,230 L1080,420 L0,420Z" fill={PAL.ink} opacity=".85" /></svg>
    <div style={{position: 'absolute', inset: 0, transform: `scale(${0.94 + 0.06 * inn})`, opacity: inn}}>
      <div style={{position: 'absolute', left: GRID.win.x, top: GRID.win.y, width: GRID.win.w, height: GRID.win.h, background: '#FBF4E4'}}>
        <div style={{position: 'absolute', left: 60, top: 64, fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: PAL.ink}}>先算<span style={{color: PAL.vermilion}}>会员</span>这笔账</div>
        <div style={{position: 'absolute', left: 64, top: 150, fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .6}}>小林 · 每月账本（示意）</div>
        <LedgerRows t={t} r={{x: 40, y: 230, w: 730, h: 600}} checkAt={kw('五百') + 0.4} rows={ROWS} />
      </div>
      <PaperFrame r={GRID.win} />
    </div>
    {/* 结论卡：落在“没错”上，盖观察印 */}
    {t >= cIn && <div style={{position: 'absolute', left: GRID.card.x, top: GRID.card.y + (1 - iv(f, cIn * 30, cIn * 30 + 6)) * 30, width: GRID.card.w, height: GRID.card.h, background: '#FFFDF6', borderRadius: 6, boxShadow: '0 8px 0 rgba(80,52,24,.14), 0 14px 22px rgba(80,52,24,.12)', opacity: iv(f, cIn * 30, cIn * 30 + 6)}}>
      <div style={{position: 'absolute', left: 32, top: 26, fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .7}}>这笔账没错</div>
      <div style={{position: 'absolute', left: 32, top: 70, fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: PAL.ink}}>一年净省 <span style={{color: PAL.vermilion}}>¥508</span></div>
      <ObsSeal f={f - sum * 30} x={GRID.card.w - 90} y={88} size={130} />
    </div>}
  </AbsoluteFill>;
};

export const G6Sample: React.FC<{brand?: 'A' | 'B' | 'C'}> = ({brand = 'A'}) => {
  const F = useCurrentFrame();
  const push = interpolate(F, [0, 14], [1.18, 1], {extrapolateRight: 'clamp', easing: (x) => 1 - Math.pow(1 - x, 3)});
  const blur = interpolate(F, [0, 8], [5, 0], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#EAD9BA'}}>
    {F < S2_AT ? <AbsoluteFill style={{transform: `scale(${push})`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined}}>
      <G4Clip layout="C" noTzs noVo />
      <Big f={F} a={0} b={100}>办卡<span style={{color: PAL.vermilion}}>=</span>省钱？</Big>
      <Big f={F} a={V[1].from} b={K.s2 - 10}>会员价 <span style={{color: PAL.vermilion}}>更便宜</span></Big>
    </AbsoluteFill> : <><S02 f={F - S2_AT} /><KaraokeCaption line={L3} t={(F - S2_AT) / 30} keywords={KEYWORDS.S02} /></>}
    <BrandMark f={F} v={brand} />
    {V.map((v, i) => <Sequence key={i} from={v.from}><Audio src={staticFile(`g4/vo${i}.mp3`)} /></Sequence>)}
    <Sequence from={S2_AT}><Audio src={staticFile('g6/vo/L03.mp3')} /></Sequence>
    {SFX.map(([at, file, vol], i) => <Sequence key={'s' + i} from={at} durationInFrames={60}><Audio src={staticFile(`g6/audio/${file}`)} volume={vol} /></Sequence>)}
    <Audio src={staticFile('g6/audio/bgm_investigations.mp3')} volume={(f) => 0.09 * interpolate(f, [0, 10, G6_SAMPLE_FRAMES - 20, G6_SAMPLE_FRAMES], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
  </AbsoluteFill>;
};
