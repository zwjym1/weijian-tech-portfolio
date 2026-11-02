import React from 'react';
import {C} from '../core/tokens';
import {Bars, DashedArrow, Donut, Ledger, LineChart, PriceTag, SourceNote, StampCheck, PaperCard, CountUp} from '../mg';
// 每个镜头的 MG 编排（数值来自 script.md / sources.json；镜头 id 对应 shotlist.json）
// 坐标为 1080×1920 画布像素，全部在安全区 X90–990 / Y230–1540 内
// 与 MG 卡内容重复的关键词条不显示（只保留一处）
export const CHIP_SKIP = new Set(['已省 ¥64', '本月多花 ¥236', '年省 ¥768', '净省 ¥508', '每月多花 ¥300', '省 ¥768', '多买 ¥3600',
  'Costco 2025 财年', '买得多 + 用得完 = 真省钱', '省的是单价？', '还是总支出？']);
export const SHOT_MG: Record<string, (frames: number) => React.ReactNode> = {
  SH01: () => (<PaperCard x={580} y={1020} w={380} rot={3} style={{textAlign: 'center'}}>
      <div style={{fontSize: 36}}>小票 · 已省</div><div style={{fontSize: 92, fontWeight: 800, color: C.ink}}><CountUp to={64} start={60} dur={45} prefix="¥" /></div></PaperCard>),
  SH02: () => <Ledger x={430} y={960} w={560} title="账本" start={40} rows={[{label: '上月', value: 800}, {label: '本月', value: 1036}, {label: '差额', value: 236, prefix: '+¥', color: C.red, total: true}]} />,
  SH03: (n) => (<>
      <Ledger x={160} y={860} title="会员这笔账" start={20} gap={40} rows={[{label: '每月计划花', value: 800}, {label: '8% 折扣 ×12 月', value: 768, prefix: '省 ¥'}, {label: '年费', value: 260, prefix: '−¥'}, {label: '净省', value: 508, color: C.ink, total: true}]} />
      <StampCheck x={850} y={1390} size={150} start={Math.round(n * 0.72)} /></>),
  SH04: () => (<>
      <PriceTag x={140} y={700} top="普通装" main="¥15" start={30} color={C.cyan} />
      <PriceTag x={420} y={760} top="大包装" main="¥39" start={60} />
      <PriceTag x={640} y={980} top="满199减20" main="还差¥12" start={120} color={C.red} rot={5} /></>),
  SH05: () => (<>
      <DashedArrow x1={260} y1={1150} x2={680} y2={860} start={20} />
      <PaperCard x={560} y={680} w={380} rot={-3} style={{textAlign: 'center', borderColor: C.red}}>
        <div style={{fontSize: 34}}>每月多花</div><div style={{fontSize: 84, fontWeight: 800, color: C.red}}><CountUp to={300} start={30} prefix="+¥" /></div></PaperCard>
      <SourceNote x={120} y={1260} text="虚线 = 模拟推算" start={30} /></>),
  SH06: () => (<>
      <Bars x={130} y={640} w={820} h={560} start={20} bars={[{label: '会员省下', value: 768, color: C.cream, prefix: '¥'}, {label: '额外多买', value: 3600, color: C.red, prefix: '¥'}]} /></>),
  SH07: (n) => (<>
      <LineChart x={130} y={600} values={[1, 2.1]} xLabels={['入会前', '入会后']} start={15} endLabel="×2+" />
      <Donut cx={300} cy={1180} r={110} part={1 / 3} start={Math.round(n * 0.45)} label="1/3" />
      <SourceNote x={130} y={1000} text="Iyengar, Park & Yu (2022) JMR · 单一零售商数据，不一定普适" start={20} /></>),
  SH08: () => (<>
      <DashedArrow x1={220} y1={760} x2={760} y2={1100} start={15} dur={30} color={C.amber} curve={-120} />
      <SourceNote x={200} y={1320} text="研究作者的推断：可能存在“得用回本”的心理" start={45} /></>),
  SH09: () => (<>
      <Bars horizontal x={110} y={820} w={860} h={380} start={40} bars={[{label: '会员费收入', value: 5.323, color: C.amber, prefix: '$', suffix: 'B', decimals: 1}, {label: '营业利润', value: 10.383, color: C.cyan, prefix: '$', suffix: 'B', decimals: 1}]} />
      <SourceNote x={110} y={1230} text="Costco FY2025 年报（2025-09-25）" start={40} /></>),
  SH10: (n) => (<>
      <Ledger x={160} y={680} title="另一种会员" start={20} rows={[{label: '买得多', value: 0, text: '✓'}, {label: '用得完', value: 0, text: '✓'}, {label: '净省', value: 508, color: C.ink, total: true}]} />
      <StampCheck x={800} y={1150} start={Math.round(n * 0.6)} color={C.ink} /></>),
  SH11: () => (<>
      <PriceTag x={150} y={600} top="省的是" main="单价？" start={20} color={C.cyan} />
      <PriceTag x={560} y={640} top="还是" main="总支出？" start={70} color={C.red} rot={4} /></>),
};
