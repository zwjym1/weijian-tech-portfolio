// S1 分件动作测试小样：挥笔 → 换表情 → 抽档案（960×540，约 4.5 秒）
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {HostS1, HostExpr} from './HostS1';
import {win, ease, easeOut, lerp, backOut} from '../common/theme';

export const HostS1Test: React.FC = () => {
  const f = useCurrentFrame();
  // 0–40 平静 + 挥笔；40–80 挑眉调侃；80–135 瞪眼揭穿 + 抽出档案夹
  const wave = Math.sin(f / 4) * win(f, 4, 12) * (1 - win(f, 34, 42));
  const expr: HostExpr = f < 42 ? 'calm' : f < 82 ? 'smirk' : 'expose';
  const pop = (k: number) => { const t = win(f, k, k + 6); return t > 0 && t < 1 ? 1 + 0.06 * Math.sin(t * Math.PI) : 1; };
  const out = easeOut(win(f, 86, 104));
  const armR: [number, number] = [lerp(0, -95, ease(win(f, 2, 12))) * (1 - ease(win(f, 36, 46))) + wave * 12, -40 * ease(win(f, 2, 12)) * (1 - ease(win(f, 36, 46))) + wave * 20];
  const armL: [number, number] = [95 * out, 60 * out];
  const tilt = f >= 42 && f < 82 ? 6 * ease(win(f, 42, 50)) : 0;
  const wing = (f >= 82 ? 8 * Math.sin((f - 82) / 2) * Math.exp(-(f - 82) / 10) : 0) + 1.5 * Math.sin(f / 9);
  const breathe = Math.sin(f / 14) * 3;
  const label = expr === 'calm' ? '平静讲述 · 挥笔' : expr === 'smirk' ? '挑眉调侃' : '瞪眼揭穿 · 抽档案';
  return (
    <AbsoluteFill style={{background: '#111214'}}>
      <Img src={staticFile('textures/desk_warmblack_1920x1080.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85}} />
      <Img src={staticFile('textures/lamp_mask_warm_1920x1080.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'screen', opacity: 0.7}} />
      <div style={{position: 'absolute', left: 480 - 500 * 0.36, top: 528 - 1340 * 0.36, transform: `scale(${0.36 * pop(42) * pop(82)})`, transformOrigin: '0 0'}}>
        <div style={{transform: 'scale(1)'}}>
          <HostS1 expr={expr} armR={armR} armL={armL} headTilt={tilt} headDY={breathe} wingFlap={wing} folderOut={out} />
        </div>
      </div>
      <Img src={staticFile('textures/vignette_1920x1080.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply'}} />
      <div style={{position: 'absolute', left: 24, top: 18, color: '#EFE8DA', font: "700 22px 'Noto Serif CJK SC',serif"}}>S1 分件动作测试 · {label}</div>
      <div style={{position: 'absolute', right: 20, top: 18, color: '#D93A26', border: '1.5px solid #D93A26', padding: '2px 8px', font: "400 15px 'Noto Sans CJK SC',sans-serif"}}>AI 生成</div>
    </AbsoluteFill>
  );
};
