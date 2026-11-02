import React from 'react';
import {Composition} from 'remotion';
import {Animatic} from './scenes/Animatic';
import {LayerTest, LAYER_TEST_FRAMES} from './scenes/LayerTest';
import {TOTAL_FRAMES} from './core/timeline';
import {FPS, W, H} from './core/tokens';
export const Root: React.FC = () => (<>
  <Composition id="Animatic" component={Animatic} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
  <Composition id="LayerTest" component={LayerTest} durationInFrames={LAYER_TEST_FRAMES} fps={FPS} width={W} height={H} />
</>);
