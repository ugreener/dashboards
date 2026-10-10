import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './lib/anim';
import {VirtDr292} from './virtdr-292/Video';
import {buildTimeline} from './virtdr-292/timeline';

const FIRST_CUT = [0, 1, 2];
const ALL = Array.from({length: 16}, (_, i) => i);

export const Root: React.FC = () => (
  <>
    <Composition
      id="virtdr-292-first-cut"
      component={VirtDr292}
      durationInFrames={buildTimeline(FIRST_CUT).total}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: FIRST_CUT}}
    />
    <Composition
      id="virtdr-292"
      component={VirtDr292}
      durationInFrames={Math.max(1, buildTimeline(ALL).total)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: ALL}}
    />
  </>
);
