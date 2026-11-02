// 主理人「秘书丞」S1 纸偶剪纸版 —— 分件骨骼（2026-10-23）
// 分件来源：assets/cast/host_mishucheng/S1_paper_puppet/parts/（public/cast/host_s1/）
// 所有坐标为角色本地坐标（画布 1000×1400，原点左上，脚底约 y=1340）。外部用 scale 缩放。
import React from 'react';
import {Img, staticFile} from 'remotion';

export type HostExpr = 'calm' | 'smirk' | 'expose';
export type HostPose = {
  expr?: HostExpr;
  headTilt?: number;      // 度
  headDY?: number;        // 点头/起伏 px
  wingFlap?: number;      // 帽翅上下抖（度，左右对称反向）
  bodyRot?: number;       // 整体轻摆
  armL?: [number, number]; // 观众左侧手臂 [上臂, 前臂] 角度（度，0=自然下垂）
  armR?: [number, number]; // 观众右侧手臂
  propL?: 'folder' | 'none';
  propR?: 'brush' | 'none';
  folderOut?: number;     // 0..1 档案夹从腋下抽出（向外上方移出）
};

const P = (f: string) => staticFile(`cast/host_s1/${f}.png`);

// 一个分件：图片 + 枢轴（piece 像素）放到父坐标 (x,y)，绕枢轴旋转，children 放在本件坐标系
const Part: React.FC<{src: string; w: number; h: number; pivot: [number, number]; at: [number, number]; rot?: number; s?: number; z?: number; children?: React.ReactNode; front?: React.ReactNode}> =
  ({src, w, h, pivot, at, rot = 0, s = 1, z, children, front}) => (
  <div style={{position: 'absolute', left: at[0] - pivot[0], top: at[1] - pivot[1], width: w, height: h, transformOrigin: `${pivot[0]}px ${pivot[1]}px`, transform: `rotate(${rot}deg) scale(${s})`, zIndex: z}}>
    {children}
    <Img src={P(src)} style={{position: 'absolute', left: 0, top: 0, width: w, height: h}} />
    {front}
  </div>
);

const FACE: Record<HostExpr, [string, number, number]> = {
  calm: ['face_calm', 730, 772], smirk: ['face_smirk', 716, 772], expose: ['face_expose', 720, 774],
};

export const HostS1: React.FC<HostPose & {style?: React.CSSProperties; rim?: boolean}> = (p) => {
  const {expr = 'calm', headTilt = 0, headDY = 0, wingFlap = 0, bodyRot = 0,
    armL = [0, 0], armR = [0, 0], propL = 'folder', propR = 'brush', folderOut = 0, rim = true} = p;
  const [fs, fw, fh] = FACE[expr];
  const FS = 0.62; // 脸缩放
  const TX = 268, TY = 640; // 躯干左上角
  const sh = (x: number, y: number): [number, number] => [TX + x, TY + y];
  const AS = 0.82; // 手臂缩放
  // 上臂：枢轴=肩铆钉；肘点=袖口中心（piece 像素）
  const upL = {src: 'upperarm_L', w: 322 * AS, h: 320 * AS, pivot: [265 * AS, 55 * AS] as [number, number], elbow: [95 * AS, 235 * AS] as [number, number], rest: -30};
  const upR = {src: 'upperarm_R', w: 318 * AS, h: 322 * AS, pivot: [55 * AS, 55 * AS] as [number, number], elbow: [225 * AS, 235 * AS] as [number, number], rest: 30};
  const foL = {src: 'forearm_L', w: 276 * AS, h: 270 * AS, pivot: [205 * AS, 55 * AS] as [number, number], wrist: [85 * AS, 200 * AS] as [number, number], rest: 10};
  const foR = {src: 'forearm_R', w: 276 * AS, h: 272 * AS, pivot: [70 * AS, 55 * AS] as [number, number], wrist: [192 * AS, 200 * AS] as [number, number], rest: -10};
  const HS = 0.8;
  const filter = rim ? 'drop-shadow(0 0 3px rgba(255,200,120,0.55)) drop-shadow(0 10px 14px rgba(0,0,0,0.6))' : undefined;
  return (
    <div style={{position: 'relative', width: 1000, height: 1400, filter, transformOrigin: '500px 1340px', transform: `rotate(${bodyRot}deg)`, ...p.style}}>
      {/* 后层：档案夹（夹在观众左臂下，可抽出） */}
      {/* 观众左臂 */}
      <Part {...upL} at={sh(108, 97)} rot={upL.rest + armL[0]} z={3}>
        <Part {...foL} at={upL.elbow} rot={foL.rest + armL[1]}>
          <Part src="hand_L_open" w={196 * HS} h={202 * HS} pivot={[150 * HS, 175 * HS]} at={foL.wrist} rot={-20} z={-1} />
          {propL === 'folder' && (
            <Part src="prop_folder" w={274 * 0.85} h={298 * 0.85} pivot={[137 * 0.85, 149 * 0.85]} at={[foL.wrist[0] + 30 - folderOut * 40, foL.wrist[1] - 70 + folderOut * 110]} rot={-12 - folderOut * 60} z={folderOut > 0.5 ? 2 : -2} />
          )}
        </Part>
      </Part>
      {/* 躯干 */}
      <Img src={P('torso')} style={{position: 'absolute', left: TX, top: TY, width: 464, height: 700, zIndex: 2}} />
      {/* 头 + 帽 */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1000, height: 1400, zIndex: 1, transformOrigin: '500px 650px', transform: `translateY(${headDY}px) rotate(${headTilt}deg)`}}>
        <Img src={P(fs)} style={{position: 'absolute', left: 500 - (fw * FS) / 2, top: 700 - fh * FS, width: fw * FS, height: fh * FS}} />
        {/* 帽翅（在帽冠后） */}
        <Part src="hat_wing_L" w={692 * 0.5} h={154 * 0.5} pivot={[692 * 0.5 - 20, 77 * 0.5]} at={[400, 262]} rot={-wingFlap} />
        <Part src="hat_wing_R" w={608 * 0.57} h={146 * 0.57} pivot={[20, 73 * 0.57]} at={[600, 262]} rot={wingFlap} />
        <Img src={P('hat_crown')} style={{position: 'absolute', left: 500 - 418 * 0.57, top: 98, width: 418 * 1.14, height: 322 * 1.14}} />
      </div>
      {/* 观众右臂（在身前，持朱笔） */}
      <Part {...upR} at={sh(355, 97)} rot={upR.rest + armR[0]} z={5}>
        <Part {...foR} at={upR.elbow} rot={foR.rest + armR[1]}>
          {propR === 'brush' && (
            <Part src="prop_brush" w={170 * 0.8} h={292 * 0.8} pivot={[85 * 0.8, 170 * 0.8]} at={[foR.wrist[0] + 18, foR.wrist[1] + 22]} rot={-35} z={2} />
          )}
          <Part src="hand_R_grip" w={172 * HS} h={184 * HS} pivot={[35 * HS, 30 * HS]} at={foR.wrist} rot={-30} z={1} />
        </Part>
      </Part>
    </div>
  );
};
