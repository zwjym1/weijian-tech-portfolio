import {Config} from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(4);
// 在 RTX 3080 上可改用 Config.setChromiumOpenGlRenderer('angle') 加速 GPU 合成
Config.setCachingEnabled(false);
