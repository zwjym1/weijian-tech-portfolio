import React from 'react';
import {Img, staticFile} from 'remotion';
import {twos} from '../g2/ObservationStage';

// 通用角色骨骼：读 pivots.json（画布像素坐标，原点左上），每个部件整画布叠放，绕自身 pivot 旋转。
export type RigJson = {
  id: string; dir: string; canvas: [number, number]; draw_order: string[]; placeholder?: boolean; note?: string;
  parts: Record<string, {file: string; pivot: string; pivot_xy: [number, number]; parent?: string; face?: string; optional?: boolean}>;
  face?: {skin: string; eyes: [number, number, number, number][]; mouth: [number, number, number, number]};
};
export type Expr = 'happy' | 'neutral' | 'surprised' | 'confused' | 'sad';
export type Pose = Record<string, number>; // 部件名 → 角度（度）
export const POSES: Record<string, Pose> = {
  stand: {}, wave: {arm_R: -38, arm_R_upper: -150, arm_R_lower: -20}, point: {arm_R: -70, arm_R_upper: -95, arm_R_lower: -10, head: 4}, shrug: {arm_L: 22, arm_R: -22, head: -5}, think: {arm_R: -105, head: 8},
};

const Face: React.FC<{face: NonNullable<RigJson['face']>; expr: Expr; blink: number; talk: boolean}> = ({face, expr, blink, talk}) => {
  const [mx, my, mw, mh] = face.mouth; const ink = '#3A1E14';
  const mouthOpen = talk ? true : expr === 'happy';
  return <>
    {blink > 0 && face.eyes.map(([x, y, rx, ry], i) => <g key={i}>
      <ellipse cx={x} cy={y} rx={rx + 6} ry={(ry + 6) * blink} fill={face.skin} />
      <path d={`M${x - rx} ${y + ry * 0.1} Q${x} ${y + ry * (0.1 + 0.5 * blink)} ${x + rx} ${y + ry * 0.1}`} stroke={ink} strokeWidth={9} fill="none" strokeLinecap="round" opacity={blink > 0.6 ? 1 : 0} />
    </g>)}
    {!mouthOpen && <>
      <ellipse cx={mx} cy={my} rx={mw + 6} ry={mh + 6} fill={face.skin} />
      {expr === 'neutral' && <path d={`M${mx - 26} ${my - 4} Q${mx} ${my + 14} ${mx + 26} ${my - 4}`} stroke={ink} strokeWidth={8} fill="none" strokeLinecap="round" />}
      {expr === 'sad' && <path d={`M${mx - 24} ${my + 10} Q${mx} ${my - 10} ${mx + 24} ${my + 10}`} stroke={ink} strokeWidth={8} fill="none" strokeLinecap="round" />}
      {expr === 'surprised' && <ellipse cx={mx} cy={my + 2} rx={15} ry={20} fill="#C2453D" stroke={ink} strokeWidth={6} />}
      {expr === 'confused' && <path d={`M${mx - 26} ${my + 2} q13 -12 26 0 t26 0`} stroke={ink} strokeWidth={8} fill="none" strokeLinecap="round" />}
    </>}
  </>;
};

export type RigProps = {
  rig: RigJson; f: number; x: number; y: number; scale: number; // (x,y)=画布底边中点落在设计坐标的位置
  pose?: Pose; poseFrom?: Pose; poseT?: number; expr?: Expr; talk?: boolean; flip?: boolean;
  breathe?: boolean; blinkEvery?: number; show?: string[]; walk?: {fromX: number; start: number; dur: number}; o?: number;
};
export const CharacterRig: React.FC<RigProps> = ({rig, f, x, y, scale, pose = {}, poseFrom, poseT = 1, expr = 'happy', talk = false, flip, breathe = true, blinkEvery = 84, walk, o = 1, show = []}) => {
  const [W, H] = rig.canvas;
  const g = twos(f); // 贴纸动画“一拍二”
  // 走入
  let wx = x, bob = 0, sway = 0;
  if (walk) {
    const t = Math.min(1, Math.max(0, (g - walk.start) / walk.dur));
    const e = 1 - Math.pow(1 - t, 2.2);
    wx = walk.fromX + (x - walk.fromX) * e;
    const ph = (g - walk.start) / 7;
    if (t < 1) { bob = -Math.abs(Math.sin(ph * Math.PI)) * 22; sway = Math.sin(ph * Math.PI) * 4; }
  }
  const br = breathe ? Math.sin((f / 30) * Math.PI * 0.9) : 0;
  const blinkPh = (f + rig.id.length * 17) % blinkEvery;
  const blink = blinkPh < 2 ? 1 : blinkPh < 4 ? 0.5 : 0;
  const talkOpen = talk && Math.floor(f / 4) % 2 === 0;
  const ang = (p: string) => {
    const a1 = pose[p] ?? 0, a0 = (poseFrom ?? pose)[p] ?? 0;
    let a = a0 + (a1 - a0) * poseT;
    if (walk && sway) { if (p === 'arm_L') a += sway * 3; if (p === 'arm_R') a -= sway * 3; }
    return a;
  };
  return <div style={{position: 'absolute', left: wx - (W * scale) / 2, top: y - H * scale + bob, width: W * scale, height: H * scale, opacity: o,
    transform: `${flip ? 'scaleX(-1) ' : ''}rotate(${sway * 0.5}deg)`, transformOrigin: '50% 100%'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      {(() => {
        // 层级：有 parent 的部件嵌在父部件的变换容器里（下臂随上臂、脸随头）
        const visible = (p: string) => { const pt = rig.parts[p]; if (pt.optional && !show.includes(p)) return false;
          if (pt.face) return pt.face === (talk ? (talkOpen ? 'happy' : 'neutral') : expr); return true; };
        const kids = (par?: string) => rig.draw_order.filter((p) => rig.parts[p].parent === par && visible(p));
        const node = (p: string): React.ReactNode => {
          const part = rig.parts[p]; const [px, py] = part.pivot_xy;
          const dy = part.parent ? 0 : p === 'head' ? -br * 4 : p.startsWith('arm') ? -br * 2.5 : 0;
          const sy = p === 'torso' ? 1 + br * 0.008 : 1;
          const isHead = p === ((rig as any).head_part ?? 'head');
          // 互斥：显示替换手时，把原部件里的手裁掉
          const ex = Object.entries(((rig as any).exclusive ?? {}) as Record<string, {hides: string; clipBelowY: number}>).find(([k, v]) => v.hides === p && show.includes(k));
          const clip = ex ? `inset(0 0 ${H - ex[1].clipBelowY}px 0)` : undefined;
          return <div key={p} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${px}px ${py}px`,
            transform: `translateY(${dy}px) rotate(${part.face ? 0 : ang(p)}deg) scaleY(${sy})`}}>
            <Img src={staticFile(`${rig.dir}/${part.file}`)} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: clip}} />
            {isHead && rig.face && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}><Face face={rig.face} expr={talk ? (talkOpen ? 'happy' : 'neutral') : expr} blink={blink} talk={talk && talkOpen} /></svg>}
            {kids(p).map(node)}
          </div>;
        };
        return kids(undefined).map(node);
      })()}
      {rig.placeholder && <div style={{position: 'absolute', left: 0, top: H - 60, width: W, textAlign: 'center', font: '700 30px sans-serif', color: '#B8483A', background: 'rgba(255,253,246,.85)'}}>占位·待散件</div>}
    </div>
  </div>;
};
