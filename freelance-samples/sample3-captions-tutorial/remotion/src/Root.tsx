import {Composition, Still} from 'remotion';
import {Tutorial, Cover} from './Tutorial';
import tl from './timeline.json';
export const Root = () => (<>
  <Composition id="Tutorial" component={Tutorial} fps={30} width={1920} height={1080} durationInFrames={Math.round(tl.duration*30)} />
  <Still id="Cover" component={Cover} width={1920} height={1080} />
</>);
