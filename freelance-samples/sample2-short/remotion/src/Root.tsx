import {Composition, Still} from 'remotion';
import {Short, Cover} from './Short';
import tl from './timeline.json';
export const Root = () => (<>
  <Composition id="Short" component={Short} fps={30} width={1080} height={1920} durationInFrames={Math.round(tl.duration*30)} />
  <Still id="Cover" component={Cover} width={1080} height={1920} />
</>);
