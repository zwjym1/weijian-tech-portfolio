import {T02Full, T02_FRAMES} from './t02/T02Full';
import {Cover, COVER_SIZE} from './T05/Cover';
import {T05Full, TOTAL_FRAMES as T05_FRAMES} from './T05/T05Full';
import {MixueFull, MX_FRAMES, MixueCover, MixueCover2} from './mixue/MixueFull';
import React from 'react';
import {Composition} from 'remotion';
import {G1Stage, G1_FRAMES} from './g1/G1Stage';
import {G4Clip, G4_FRAMES} from './g4/G4Clip';
import {G6Demo, G6_FRAMES} from './g6/G6Demo';
import {G6Sample, G6_SAMPLE_FRAMES} from './g6/G6Sample';
import {G7Full, G7_FRAMES} from './g7/G7Full';
import {G2Preview, G2_FRAMES, TypeSheet} from './g2/G2Preview';
export const Root: React.FC = () => (<>
  {(['A', 'B', 'C'] as const).map((v) => <Composition key={v} id={`G1-${v}`} component={G1Stage} defaultProps={{v}} durationInFrames={G1_FRAMES} fps={30} width={1080} height={1920} />)}
  <Composition id="G2-Preview" component={G2Preview} durationInFrames={G2_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="G2-Type" component={TypeSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="G4-Clip" component={G4Clip} durationInFrames={G4_FRAMES} fps={30} width={1080} height={1920} />
  {['A', 'B', 'C'].map((l) => <Composition key={l} id={`G4-Lay${l}`} component={G4Clip} defaultProps={{layout: l}} durationInFrames={G4_FRAMES} fps={30} width={1080} height={1920} />)}
  <Composition id="G6-Demo" component={G6Demo} durationInFrames={G6_FRAMES} fps={30} width={1080} height={1920} />
  {(['A', 'B', 'C'] as const).map((b) => <Composition key={b} id={`G6-Sample-${b}`} component={G6Sample} defaultProps={{brand: b}} durationInFrames={G6_SAMPLE_FRAMES} fps={30} width={1080} height={1920} />)}
  <Composition id="MIXUE-COVER-A" component={() => <MixueCover v="A" />} durationInFrames={60} fps={30} width={1080} height={1920} />
  <Composition id="MIXUE-COVER-B" component={() => <MixueCover v="B" />} durationInFrames={60} fps={30} width={1080} height={1920} />
  <Composition id="MIXUE-COVER-A-T" component={() => <MixueCover2 v="A" fmt="T" />} durationInFrames={60} fps={30} width={1080} height={1440} />
  <Composition id="MIXUE-COVER-A-L43" component={() => <MixueCover2 v="A" fmt="L43" />} durationInFrames={60} fps={30} width={1440} height={1080} />
  <Composition id="MIXUE-COVER-A-L169" component={() => <MixueCover2 v="A" fmt="L169" />} durationInFrames={60} fps={30} width={1920} height={1080} />
  <Composition id="MIXUE-COVER-B-T" component={() => <MixueCover2 v="B" fmt="T" />} durationInFrames={60} fps={30} width={1080} height={1440} />
  <Composition id="MIXUE-COVER-B-L43" component={() => <MixueCover2 v="B" fmt="L43" />} durationInFrames={60} fps={30} width={1440} height={1080} />
  <Composition id="MIXUE-COVER-B-L169" component={() => <MixueCover2 v="B" fmt="L169" />} durationInFrames={60} fps={30} width={1920} height={1080} />
  <Composition id="MIXUE-E001" component={MixueFull} durationInFrames={MX_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="T05-COVER-916" component={() => <Cover fmt="916" />} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="T05-COVER-34" component={() => <Cover fmt="34" />} durationInFrames={1} fps={30} width={1080} height={1440} />
  <Composition id="T05-COVER-43" component={() => <Cover fmt="43" />} durationInFrames={1} fps={30} width={1440} height={1080} />
  <Composition id="T05-COVER-169" component={() => <Cover fmt="169" />} durationInFrames={1} fps={30} width={1920} height={1080} />
  <Composition id="T05-FULL" component={T05Full} durationInFrames={T05_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="T02-FULL" component={T02Full} durationInFrames={T02_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="G7-E001" component={G7Full} durationInFrames={G7_FRAMES} fps={30} width={1080} height={1920} />
</>);
