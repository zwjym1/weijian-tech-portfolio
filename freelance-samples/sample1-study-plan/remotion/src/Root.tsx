import {Composition, Still} from 'remotion';
import {StudyPlanV3, CoverV3} from './Video3';
import tl from './timeline.json';
export const Root = () => (<>
  <Composition id="StudyPlanV3" component={StudyPlanV3} fps={30} width={1920} height={1080} durationInFrames={Math.round(tl.duration*30)} />
  <Still id="CoverV3" component={CoverV3} width={1920} height={1080} />
</>);
