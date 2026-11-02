import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {OneLineSubtitles} from '../common/OneLineSubtitles';
import {SERIF} from '../common/theme';
import {BRAND} from '../brand';
export const Smoke: React.FC = () => {
  const f = useCurrentFrame();
  const name = String((BRAND as {account_name?: string}).account_name ?? '');
  return (
    <AbsoluteFill style={{background: '#14110e'}}>
      <OneLineSubtitles t={f / 30} subs={[{text: `${name}档案·冒烟测试`, a: 0, b: 2, show_a: 0, show_b: 2}]} fontFamily={SERIF} top={880} width={1920} />
    </AbsoluteFill>
  );
};
