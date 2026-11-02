import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, spring, interpolate} from 'remotion';
import {PAL, SERIF, SANS, FULL, Rect, iv, twos, lerpR, ObservationStage, BrassRing, ObsSeal, Caption, Title, CornerMarks} from './ObservationStage';

export const G2_FRAMES = 300;
// 节拍：120BPM => 15 帧/拍；下列关键帧全部落在半拍(7.5f)整数近似上
const K = {s1: 60, flipA: 90, flipB: 100, flipC: 112, morph: 135, seal2: 172, travel: 195, s3: 232, seal3: 268};
const WIN: Rect = {x: 84, y: 410, w: 836, h: 740};

/* ------- L1 故事层（设计坐标 1080x1920） ------- */
const GOODS = [
  {src: '02_goods_rice', w: 254, x: 505, b: 1415, rot: -2, t: 4},
  {src: '05_goods_oil', w: 150, x: 792, b: 1418, rot: 3, t: 12},
  {src: '06_goods_snack', w: 235, x: 628, b: 1335, rot: 6, t: 20},
  {src: '03_goods_eggs', w: 240, x: 498, b: 1062, rot: -4, t: 28},
  {src: '04_goods_greens', w: 380, x: 560, b: 985, rot: -7, t: 36},
];
const NAT: Record<string, [number, number]> = {'02_goods_rice': [508, 784], '03_goods_eggs': [478, 469], '04_goods_greens': [869, 596], '05_goods_oil': [372, 1171], '06_goods_snack': [523, 863]};
const gH = (g: typeof GOODS[0]) => (g.w * NAT[g.src][1]) / NAT[g.src][0];
const Story: React.FC<{f: number; hideGoods?: number}> = ({f, hideGoods = 0}) => (
  <AbsoluteFill>
    <Img src={staticFile('g2/bg.jpg')} style={{position: 'absolute', left: -100, top: 0, width: 1280, height: 1920, transform: `scale(${1.02 + f * 0.0002})`}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(32,60,58,.0) 55%, rgba(32,60,58,.35) 100%)'}} />
    {GOODS.map((g, i) => {
      const lf = f - g.t;
      if (lf < 0) return null;
      const sp = spring({frame: lf, fps: 30, config: {damping: 11, stiffness: 170}});
      const y = (1 - sp) * -520;
      const squash = lf > 4 && lf < 12 ? 1 - Math.sin(((lf - 4) / 8) * Math.PI) * 0.06 : 1;
      return <Img key={i} src={staticFile(`g2/${g.src}.png`)} style={{position: 'absolute', left: g.x, top: g.b - gH(g) + y, width: g.w, transform: `rotate(${g.rot}deg) scaleY(${squash})`, transformOrigin: '50% 100%', opacity: 1 - (i < hideGoods ? 1 : 0), filter: 'drop-shadow(0 10px 8px rgba(40,25,10,.35))'}} />;
    })}
    <Img src={staticFile('g2/01_xiaolin_cart.png')} style={{position: 'absolute', left: 80, top: 610, width: 921, filter: 'drop-shadow(0 18px 14px rgba(40,25,10,.35))'}} />
  </AbsoluteFill>
);
/* 把 1080x1920 设计空间放进任意窗口 */
const fit = (r: Rect) => { const k = Math.max(r.w / 1080, r.h / 1920); return {k, ox: (r.w - 1080 * k) / 2, oy: (r.h - 1920 * k) / 2 - (r.h < 1500 ? -40 * k : 0)}; };
const InRect: React.FC<{r: Rect; children: React.ReactNode}> = ({r, children}) => { const {k, ox, oy} = fit(r); return <div style={{position: 'absolute', left: ox, top: oy, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0'}}>{children}</div>; };

/* ------- L3 像素沙盘（tileset 切片，统一 6 倍像素） ------- */
const P = 6;
const Px: React.FC<{n: string; x: number; y: number; w: number; h: number; s?: number; st?: React.CSSProperties}> = ({n, x, y, w, h, s = P, st}) => <Img src={staticFile(`g2/px/${n}.png`)} style={{position: 'absolute', left: x, top: y, width: w * s, height: h * s, imageRendering: 'pixelated', ...st}} />;
const PixelWorld: React.FC<{f: number}> = ({f}) => {
  const walk = ['walk1', 'walk2', 'walk3', 'walk4'][Math.floor(f / 4) % 4];
  const wx = interpolate(f, [0, 70], [-40, 300], {extrapolateRight: 'clamp'});
  const n = Math.min(6, Math.floor(f / 7));
  const money = 800 + Math.round((236 * n) / 6);
  return (<AbsoluteFill style={{background: '#14302D'}}>
    {/* 墙面像素点阵 */}
    <AbsoluteFill style={{backgroundImage: 'radial-gradient(#1F4440 2px, transparent 2.5px)', backgroundSize: '24px 24px', opacity: .8}} />
    <Px n="store" x={126} y={420} w={138} h={91} />
    {Array.from({length: 4}).map((_, i) => <Px key={i} n="side_a" x={i * 300 - 30} y={966} w={50} h={65} />)}
    {Array.from({length: 4}).map((_, i) => <Px key={'r' + i} n={i % 2 ? 'road_b' : 'road_a'} x={i * 312 - 20} y={1356} w={52} h={65} />)}
    <Px n={walk} x={wx} y={890} w={28} h={52} />
    <Px n="cart" x={wx + 170} y={1000} w={61} h={61} s={4} />
    {Array.from({length: n}).map((_, i) => <Px key={'p' + i} n={`p${i + 1}`} x={wx + 196 + (i % 3) * 60} y={980 - Math.floor(i / 3) * 90 - (i === n - 1 ? Math.max(0, 6 - (f % 7)) * 10 : 0)} w={24} h={38} s={2.4} />)}
    {/* HUD */}
    <Img src={staticFile('g2/px/hud.png')} style={{position: 'absolute', left: 72, top: 250, width: 846, height: 190, imageRendering: 'pixelated'}} />
    <div style={{position: 'absolute', left: 140, top: 286, fontFamily: '"Noto Sans Mono CJK SC",monospace', fontWeight: 900, fontSize: 32, color: PAL.paper, letterSpacing: 4, opacity: .85}}>本月支出</div>
    <div style={{position: 'absolute', left: 140, top: 326, fontFamily: '"Noto Sans Mono CJK SC",monospace', fontWeight: 900, fontSize: 64, color: PAL.paper}}>¥{money}</div>
    <div style={{position: 'absolute', left: 600, top: 326, fontFamily: '"Noto Sans Mono CJK SC",monospace', fontWeight: 900, fontSize: 64, color: '#E8806F'}}>+{money - 800}</div>
  </AbsoluteFill>);
};

/* ------- 穿越碎片（纸片→像素块） ------- */
const Shards: React.FC<{t: number}> = ({t}) => {
  if (t <= 0 || t >= 1) return null;
  const cols = [PAL.paper, PAL.copper, PAL.vermilion, PAL.teal, PAL.ink, PAL.brass];
  return (<AbsoluteFill style={{pointerEvents: 'none'}}>{Array.from({length: 46}).map((_, i) => {
    const a = (i * 137.5 * Math.PI) / 180, d0 = 120 + (i % 7) * 30, d = d0 + t * t * (900 + (i % 5) * 220);
    const s = (14 + (i % 4) * 10) * (0.6 + t * 2.2);
    const sq = i % 3 !== 0; // 方块=像素，其他=纸片
    return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * d - s / 2, top: 780 + Math.sin(a) * d * 1.15 - s / 2, width: s, height: sq ? s : s * 0.6, background: cols[i % 6], opacity: Math.min(1, t * 4) * (1 - t * 0.6),
      transform: `rotate(${sq ? 0 : i * 23 + t * 200}deg)`, boxShadow: sq ? undefined : '0 0 0 3px #FFFDF6', clipPath: sq ? undefined : 'polygon(0 10%,90% 0,100% 80%,8% 100%)'}} />;
  })}</AbsoluteFill>);
};

export const G2Preview: React.FC = () => {
  const raw = useCurrentFrame();
  const f = twos(raw); // 纸雕层一拍二；扫描光/像素用 raw
  const state = raw < K.s1 ? 'S0' : raw < K.flipB ? 'S1' : raw < K.s3 ? 'S2' : 'S3';
  // ring T2
  const ringIn = iv(raw, 42, 58);
  const scan = iv(raw, 52, 76);
  const ringOut = iv(raw, 80, 90);
  // T3 page flip
  const flip = raw < K.flipB ? iv(raw, K.flipA, K.flipB, -92, 0) : iv(raw, K.flipB, K.flipC, 0, 92);
  const showS2 = raw >= K.flipB && raw < K.s3;
  // T1 morph goods -> bar segments
  const mt = (i: number) => iv(raw, K.morph + i * 5, K.morph + 14 + i * 5);
  const {k, ox, oy} = fit(WIN);
  const barX = 300, barW = 500, base = (800 / 1036) * barW;
  const seg = barW * (47.2 / 1036);
  const filled = GOODS.filter((_, i) => mt(i) >= 1).length;
  const cnt = Math.round(800 + GOODS.reduce((a, _, i) => a + mt(i) * 47.2, 0));
  // T4 travel
  const tr = iv(raw, K.travel, K.s3, 0, 1, (x) => x * x * x);
  const ringTravelSize = 520 * Math.pow(14, tr);
  const S2r = WIN;
  return (
    <AbsoluteFill style={{background: PAL.paper, overflow: 'hidden'}}>
      {/* 纸面底 */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 25%, #F6ECD9 0%, #EAD9BA 100%)'}} />
      {showS2 && <AbsoluteFill>
        <Img src={staticFile('g2/tape.png')} style={{position: 'absolute', left: 640, top: 380, width: 260, transform: 'rotate(8deg)', opacity: .9}} />
        <Title o={iv(raw, K.flipB + 6, K.flipC + 6)} text={<>办卡之后，购物车<span style={{color: PAL.vermilion}}>变满</span>了</>} sub="观察台 · S2 展示" />
      </AbsoluteFill>}

      {/* 主内容层 */}
      {!showS2 && raw < K.s3 && <Story f={f} />}
      {showS2 && <ObservationStage state="S2" r={S2r} f={f} frameO={iv(raw, K.flipB, K.flipB + 8)}>
        <InRect r={S2r}><Story f={f} hideGoods={filled} /></InRect>
        {/* T4 透过镜片进入沙盘 */}
        {tr > 0 && <div style={{position: 'absolute', inset: 0, opacity: iv(raw, K.travel + 18, K.s3 - 4)}}><PixelWorld f={0} /></div>}
      </ObservationStage>}

      {/* S2 数据卡 */}
      {showS2 && <div style={{position: 'absolute', left: 84, top: 1190, width: 836, height: 170, opacity: iv(raw, K.flipC, K.flipC + 10) * (1 - tr), background: '#FFFDF6', borderRadius: 6, boxShadow: '0 10px 0 rgba(80,52,24,.18), 0 18px 24px rgba(80,52,24,.15)'}}>
        <div style={{position: 'absolute', left: 28, top: 18, fontFamily: SANS, fontSize: 26, color: PAL.ink, opacity: .75}}>每月支出</div>
        <div style={{position: 'absolute', left: 28, top: 56, fontFamily: SERIF, fontWeight: 900, fontSize: 76, color: PAL.ink, fontVariantNumeric: 'tabular-nums'}}>¥{cnt}</div>
        <div style={{position: 'absolute', left: barX, top: 100, width: barW, height: 40, background: '#EADFCB', borderRadius: 4, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, height: '100%', width: base, background: PAL.teal}} />
          {GOODS.map((_, i) => <div key={i} style={{position: 'absolute', left: base + i * seg, top: 0, height: '100%', width: seg * mt(i), background: i % 2 ? PAL.copper : PAL.vermilion, borderLeft: '2px solid #FFFDF6'}} />)}
        </div>
        <div style={{position: 'absolute', left: barX, top: 54, fontFamily: SANS, fontSize: 24, color: PAL.ink, opacity: .7}}>上月 ¥800 ｜ 本月新增</div>
        <div style={{position: 'absolute', right: 26, top: 40, fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: PAL.vermilion}}>+{cnt - 800}</div>
      </div>}
      {/* T1 物体变形：商品飞向数据条并缩成色块 */}
      {showS2 && GOODS.map((g, i) => {
        const t = mt(i); if (t <= 0 || t >= 1) return null;
        const sx = WIN.x + ox + (g.x + g.w / 2) * k, sy = WIN.y + oy + (g.b - gH(g) / 2) * k;
        const tx = 84 + barX + base + (i + 0.5) * seg, ty = 1190 + 120;
        const x = sx + (tx - sx) * t, y = sy + (ty - sy) * t - Math.sin(t * Math.PI) * 160;
        const s = (1 - t) * k + t * 0.12;
        return <Img key={i} src={staticFile(`g2/${g.src}.png`)} style={{position: 'absolute', left: x - (g.w * s) / 2, top: y - (gH(g) * s) / 2, width: g.w * s, opacity: 1 - t * 0.3, transform: `rotate(${t * 40}deg)`}} />;
      })}
      {showS2 && <ObsSeal f={raw - K.seal2} x={790} y={1452} size={170} />}

      {/* S1 角标 + 观察环扫描 (T2) */}
      {state === 'S1' && <CornerMarks o={iv(raw, K.s1, K.s1 + 8)} />}
      {raw >= 42 && raw < 92 && <BrassRing f={raw} x={interpolate(ringIn, [0, 1], [1200, 760])} y={interpolate(ringIn, [0, 1], [500, 900])} size={460} o={1 - ringOut} scan={scan} />}

      {/* T3 纸页翻转 */}
      {raw >= K.flipA && raw < K.flipC && <div style={{position: 'absolute', inset: 0, perspective: 2200}}>
        <div style={{position: 'absolute', inset: 0, transformOrigin: '0% 50%', transform: `rotateY(${flip}deg)`, background: 'linear-gradient(90deg, #EBDDC2, #F6EEDD 60%, #E2D0AE)', boxShadow: '0 0 60px rgba(60,40,20,.4)'}}>
          <Img src={staticFile('g2/edge_right.png')} style={{position: 'absolute', right: -20, top: 0, height: '100%', width: 60}} />
        </div></div>}

      {/* T4 穿越：观察环推近 + 纸片碎成像素 */}
      {raw >= K.travel && raw < K.s3 + 6 && <>
        <BrassRing f={raw * 3} x={WIN.x + WIN.w / 2} y={780} size={ringTravelSize} lens={false} scan={tr} o={1 - iv(raw, K.s3 - 2, K.s3 + 6)} />
        <Shards t={tr} />
      </>}

      {/* S3 像素沙盘全屏 */}
      {raw >= K.s3 && <AbsoluteFill style={{opacity: iv(raw, K.s3 - 6, K.s3 + 2)}}><PixelWorld f={raw - K.s3} />
        <ObsSeal f={raw - K.seal3} x={800} y={600} size={230} blend="normal" />
        <Caption o={iv(raw, K.s3 + 8, K.s3 + 14)} y={1420} parts={['进入沙盘：一个月', ['多花¥236']]} />
      </AbsoluteFill>}

      {/* 字幕 S0/S1 */}
      {raw < K.flipA && <Caption o={iv(raw, 2, 8)} parts={raw < K.s1 ? ['办卡以后，', ['购物车'], '一件件变满'] : ['先别看价格，', ['观察'], '这辆车']} />}

      {/* 状态标签（审片用） */}
      <div style={{position: 'absolute', left: 84, top: 1560, fontFamily: 'monospace', fontSize: 22, color: 'rgba(32,60,58,.0)'}}>{state}</div>
    </AbsoluteFill>
  );
};

/* 字体/字幕样张 */
export const TypeSheet: React.FC = () => (
  <AbsoluteFill style={{background: PAL.paper, padding: 84, fontFamily: SANS, color: PAL.ink}}>
    <div style={{position: 'absolute', left: 84, top: 262}}>
      <div style={{fontSize: 24, letterSpacing: 8, opacity: .6}}>H1 标题 · 思源宋体 Heavy 64–72 · 墨绿</div>
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 70}}>办卡之后，购物车<span style={{color: PAL.vermilion}}>变满</span>了</div>
      <div style={{fontSize: 24, letterSpacing: 8, opacity: .6, marginTop: 40}}>H2 副标 · 思源黑体 Regular 26 · 字距 8</div>
      <div style={{fontSize: 26, letterSpacing: 8, opacity: .75}}>观察台 · 第一期 · 会员卡</div>
      <div style={{fontSize: 24, letterSpacing: 8, opacity: .6, marginTop: 40}}>数字 · 思源宋体 Heavy 等宽数字</div>
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 120, fontVariantNumeric: 'tabular-nums'}}>¥1036 <span style={{color: PAL.vermilion, fontSize: 80}}>+236</span></div>
      <div style={{fontSize: 24, letterSpacing: 8, opacity: .6, marginTop: 30}}>标签 · 黑体 Bold 28 · 色块底</div>
      <div style={{display: 'flex', gap: 16, marginTop: 8}}>{[['事实', PAL.ink], ['推断', PAL.teal], ['模拟', PAL.copper], ['结论', PAL.vermilion]].map(([t, c]) => <span key={t} style={{background: c, color: '#FFFDF6', fontWeight: 700, fontSize: 30, padding: '6px 20px', borderRadius: 6}}>{t}</span>)}</div>
    </div>
    <div style={{position: 'absolute', left: 84, top: 1010, right: 84, height: 520, borderRadius: 8, overflow: 'hidden'}}>
      <Img src={staticFile('g2/bg.jpg')} style={{width: '100%', marginTop: -300}} />
    </div>
    <div style={{position: 'absolute', left: 100, top: 1030, fontSize: 24, letterSpacing: 6, color: '#FFFDF6', textShadow: '0 2px 4px #000'}}>字幕 · 思源黑体 Heavy 62 · 关键词 72 铜橙 · 墨绿描边</div>
    <Caption o={1} y={1200} parts={['省的是', ['单价'], '，多的是', ['总支出']]} />
    <Caption o={1} y={1380} dark parts={['浅底版：关键词用', ['朱红']]} />
  </AbsoluteFill>
);
