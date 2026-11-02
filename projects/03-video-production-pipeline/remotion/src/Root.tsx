import React from 'react';
import {Composition} from 'remotion';
import {Smoke} from './templates/Smoke';
import {HostS1Test} from './cast/HostS1Test';
import {HostS1} from './cast/HostS1';
// 组件库与四幕模板在第 ③ 步加入；此处先放一个冒烟测试 composition。
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Smoke-H" component={Smoke} width={1920} height={1080} fps={30} durationInFrames={60} />
    <Composition id="HostS1-Test" component={HostS1Test} width={960} height={540} fps={30} durationInFrames={135} />
    <Composition id="HostS1-Still" component={HostS1} width={1000} height={1400} fps={30} durationInFrames={1} defaultProps={{expr: 'calm'}} />
  </>
);
