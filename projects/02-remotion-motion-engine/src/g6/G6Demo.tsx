import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {PAL, SERIF, SANS, iv, PaperFrame, CornerMarks, ObsSeal} from '../g2/ObservationStage';
import {PoseCharacter, PoseSet} from './PoseCharacter';
import {GRID, KaraokeCaption, LedgerCard, LedgerRows, BarChart, HBars, ArchiveClip, T1Morph, T2Scan, T3Flip, T4Tunnel} from './Kit';
import {LINES, KEYWORDS, TL} from './data';
import tzsP from './poses/tzs.json';
import xlP from './poses/xl.json';
import mmP from './poses/mm.json';
const TZS = tzsP as unknown as PoseSet, XL = xlP as unknown as PoseSet, MM = mmP as unknown as PoseSet;
// 角色姿态轨（S08 场内帧）；整集里由 timeline.json 每个 shot 的 motion 字段生成
const TRACK = {xl: [{at: 0, pose: 'stand_neutral'}, {at: 76, pose: 'surprised'}, {at: 100, pose: 'point'}],
  mm: [{at: 0, pose: 'stand_neutral'}, {at: 40, pose: 'point'}, {at: 100, pose: 'happy'}],
  tzs: [{at: 0, pose: 'stand_neutral'}, {at: 56, pose: 'point'}, {at: 104, pose: 'unroll'}]};

// 场次全部由 storyboard/timeline.json（+ vo_full.json 字级时间戳）驱动：按 shot 取台词、关键词、音频
const lineIdx = (shot: string) => LINES.findIndex((l) => l.shot === shot);
const kwAt = (shot: string, w: string) => { const l = LINES[lineIdx(shot)]; const txt = l.segs.map((s) => s.text).join(''); const i = txt.indexOf(w); return i < 0 ? 0 : l.segs[i].start; };
const SCENES = [
  {shot: 'S08', from: 0, dur: 135}, {shot: 'S02', from: 135, dur: 135}, {shot: 'S05', from: 270, dur: 120},
  {shot: 'S04', from: 390, dur: 90}, {shot: 'S06', from: 480, dur: 90},
];
export const G6_FRAMES = 570;
const TR = 26; // 转场时长

const Bg: React.FC<{dark?: boolean}> = ({dark}) => <AbsoluteFill style={{background: dark ? PAL.ink : PAL.paper}}>
  <Img src={staticFile('g2/bg.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: dark ? 0.12 : 0.22, mixBlendMode: 'multiply'}} /></AbsoluteFill>;
const Ground: React.FC = () => <svg width={1080} height={420} viewBox="0 0 1080 420" style={{position: 'absolute', left: 0, top: 1560}}>
  <path d="M0,90 C180,40 330,120 540,70 C760,20 900,100 1080,60 L1080,420 L0,420Z" fill={PAL.teal} opacity=".35" />
  <path d="M0,150 C200,110 380,180 560,140 C760,100 920,170 1080,130 L1080,420 L0,420Z" fill="#C9D5C4" />
  <path d="M0,250 C220,215 420,275 600,240 C800,205 940,262 1080,230 L1080,420 L0,420Z" fill={PAL.ink} opacity=".85" /></svg>;
const Tag: React.FC<{t: string}> = ({t}) => <div style={{position: 'absolute', left: GRID.L, top: 150, fontFamily: 'monospace', fontSize: 24, color: PAL.ink, opacity: .55}}>{t}</div>;
const Win: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = '#FBF4E4'}) => <>
  <div style={{position: 'absolute', left: GRID.win.x, top: GRID.win.y, width: GRID.win.w, height: GRID.win.h, background: bg, overflow: 'hidden'}}>{children}</div>
  <PaperFrame r={GRID.win} /></>;

// —— 各场（f 为场内帧）——
const SceneRig: React.FC<{f: number}> = ({f}) => <AbsoluteFill><Bg /><CornerMarks o={1} /><Ground />
    <PoseCharacter set={MM} f={f} x={830} y={1400} height={700} track={TRACK.mm} walk={{fromX: 1300, start: 0, dur: 30}} flip />
    <PoseCharacter set={XL} f={f} x={250} y={1400} height={760} track={TRACK.xl} walk={{fromX: -250, start: 0, dur: 34}} talk={[[40, 74]]} />
    <PoseCharacter set={TZS} f={f} x={545} y={1410} height={560} track={TRACK.tzs} />
    <Tag t="PoseCharacter · 整图切姿态/眨眼/口型/走路/呼吸/待机晃" />
  </AbsoluteFill>;
const SceneLedger: React.FC<{f: number; t: number}> = ({f, t}) => <AbsoluteFill><Bg /><Ground />
  <Win><div style={{position: 'absolute', left: 60, top: 70, fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: PAL.ink}}>会员这笔账</div>
    <LedgerRows t={t} r={{x: 40, y: 200, w: 832, h: 600}} checkAt={kwAt('S02', '五百') + 0.4} rows={[
      {k: '原本每月买', v: '¥800', at: kwAt('S02', '八百')}, {k: '年费', v: '¥260', at: kwAt('S02', '两百六')},
      {k: '会员价便宜', v: '≈8%', at: kwAt('S02', '百分之八')}, {k: '一年省', v: '¥768', at: kwAt('S02', '七百')}, {k: '净省', v: '¥508', at: kwAt('S02', '五百'), hl: true}]} /></Win>
  <LedgerCard f={f - 20} title={<>单价便宜了，<span style={{color: PAL.vermilion}}>总账</span>呢？</>} label="小林每月支出（示意） · 上月 ¥800" from={800} to={1036} extras={[47, 47, 47, 47, 48]} countAt={40} sealAt={95} />
  <Tag t="LedgerRows + LedgerCard(C) · 字音对齐弹出" /></AbsoluteFill>;
const SceneArchive: React.FC<{f: number}> = ({f}) => <AbsoluteFill><Bg dark /><Ground />
  <ArchiveClip f={f} r={{x: 104, y: 330, w: 872, h: 980}} head="付费会员开通后，购买明显增加" frac={1 / 3} fracLabel="≈1/3"
    note="增量里只有约三分之一能用折扣解释；其余可能与“交了钱想回本”的心理有关。" src="来源：网上零售商付费会员研究（详见 factcheck.md）" />
  <Tag t="ArchiveClip · T3 纸页翻转进入" /></AbsoluteFill>;
const SceneBars: React.FC<{f: number}> = ({f}) => <AbsoluteFill><Bg /><Ground />
  <Win><div style={{position: 'absolute', left: 60, top: 60, fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: PAL.ink}}>一年下来（示意）</div></Win>
  <BarChart f={f} r={{x: 120, y: 360, w: 840, h: 800}} max={3600} bars={[{label: '省下', value: 760, color: PAL.teal}, {label: '年费', value: 260, color: PAL.brass}, {label: '多买', value: 3600, color: PAL.vermilion}]} diff={{text: '多花 ¥3100+', at: 62}} />
  <Tag t="BarChart · 计数长高 + 差值飞出" /></AbsoluteFill>;
const SceneHBars: React.FC<{f: number}> = ({f}) => <AbsoluteFill><Bg /><Ground />
  <Win><div style={{position: 'absolute', left: 60, top: 60, fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: PAL.ink}}>Costco 最新财年（约）</div>
    <HBars f={f} r={{x: 0, y: 260, w: 912, h: 500}} rows={[{label: '营业利润', frac: 1, color: PAL.teal}, {label: '会员费收入', frac: 0.5, color: PAL.vermilion, mark: '≈ 一半'}]} /></Win>
  <Tag t="HBars · 第二条停在一半处" /></AbsoluteFill>;
const EndCard: React.FC<{f: number}> = ({f}) => <AbsoluteFill><Bg /><Ground />
  <div style={{position: 'absolute', left: GRID.L, width: GRID.W, top: 760, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 84, color: PAL.ink}}>G6 组件库</div>
  <div style={{position: 'absolute', left: GRID.L, width: GRID.W, top: 880, textAlign: 'center', fontFamily: SANS, fontSize: 36, color: PAL.ink, opacity: .7}}>T4 空间穿越 · 片尾彩蛋</div>
  <ObsSeal f={f - 8} x={540} y={1120} size={200} /></AbsoluteFill>;

export const G6Demo: React.FC = () => {
  const F = useCurrentFrame();
  const sc = SCENES.map((s) => ({...s, f: F - s.from, li: lineIdx(s.shot)}));
  const render = (i: number, f: number) => { const s = SCENES[i]; const t = f / 30;
    switch (s.shot) { case 'S08': return <SceneRig f={f} />; case 'S02': return <SceneLedger f={f} t={t} />; case 'S05': return <SceneArchive f={f} />; case 'S04': return <SceneBars f={f} />; default: return <SceneHBars f={f} />; } };
  const cur = sc.findIndex((s) => s.f >= 0 && s.f < s.dur); const s = sc[cur];
  let body: React.ReactNode = render(cur, s.f);
  // 转场：每场开头 TR 帧与上一场叠化
  if (cur > 0 && s.f < TR) { const p = iv(s.f, 0, TR); const a = render(cur - 1, sc[cur - 1].f); const b = body;
    body = s.shot === 'S02' ? <T2Scan p={p} a={a} b={b} f={F} cy={720} /> : s.shot === 'S05' ? <T3Flip p={p} a={a} b={b} /> : s.shot === 'S04' ? <T1Morph p={p} a={a} b={b} from={{x: 384, y: 1250, w: 600, h: 176}} to={{x: 176, y: 1000, w: 220, h: 90}} /> : <T4Tunnel p={p} a={a} b={b} />; }
  if (s.shot === 'S06' && s.f > 62) body = <T4Tunnel p={iv(s.f, 62, 90)} a={render(cur, s.f)} b={<EndCard f={s.f - 76} />} />;
  const line = LINES[s.li];
  return <AbsoluteFill>
    {body}
    {!(s.shot === 'S06' && s.f > 70) && <KaraokeCaption line={line} t={s.f / 30} keywords={KEYWORDS[s.shot]} o={s.f < TR && cur > 0 ? iv(s.f, TR * .6, TR) : 1} y={s.shot === 'S02' || s.shot === 'S08' ? GRID.capY : 1290} />}
    {SCENES.map((x, i) => <Sequence key={i} from={x.from} durationInFrames={x.dur}><Audio src={staticFile(`g6/vo/L0${lineIdx(x.shot)}.mp3`)} /></Sequence>)}
  </AbsoluteFill>;
};
export const timelineShots = TL.items.map((i) => i.shot);
