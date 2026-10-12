import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './lib/anim';
import {VirtDr292} from './virtdr-292/Video';
import {buildTimeline} from './virtdr-292/timeline';
import {VirtDr291} from './virtdr-291/Video';
import {buildTimeline as buildTimeline291} from './virtdr-291/timeline';

const ALL_291 = Array.from({length: 14}, (_, i) => i);

const ALL = Array.from({length: 16}, (_, i) => i);

export const Root: React.FC = () => (
  <>
    <Composition
      id="virtdr-292"
      component={VirtDr292}
      durationInFrames={Math.max(1, buildTimeline(ALL).total)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: ALL}}
    />
    <Composition
      id="virtdr-291"
      component={VirtDr291}
      durationInFrames={Math.max(1, buildTimeline291(ALL_291).total)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: ALL_291}}
    />
  </>
);
