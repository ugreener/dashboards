import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './lib/anim';
import {VirtDr292} from './virtdr-292/Video';
import {buildTimeline} from './virtdr-292/timeline';
import {VirtDr291} from './virtdr-291/Video';
import {buildTimeline as buildTimeline291} from './virtdr-291/timeline';
import {VirtDr342} from './virtdr-342/Video';
import {buildTimeline as buildTimeline342} from './virtdr-342/timeline';
import {CsiLayers} from './csi-layers/Video';
import {buildTimeline as buildTimelineCL} from './csi-layers/timeline';
import {CsiVendors} from './csi-vendors/Video';
import {buildTimeline as buildTimelineCV} from './csi-vendors/timeline';
import {CleanupReprotect} from './cleanup-reprotect/Video';
import {buildTimeline as buildTimelineCR} from './cleanup-reprotect/timeline';
import {ZertoPrimer} from './zerto-primer/Video';
import {buildTimeline as buildTimelineZP} from './zerto-primer/timeline';
import {RelocateHome} from './virtdr-343-relocate/Video';
import {buildTimeline as buildTimeline343R} from './virtdr-343-relocate/timeline';

const ALL_291 = Array.from({length: 14}, (_, i) => i);
const ALL_342 = Array.from({length: 10}, (_, i) => i);

const ALL = Array.from({length: 16}, (_, i) => i);
const ALL_CL = Array.from({length: 8}, (_, i) => i);
const ALL_CV = Array.from({length: 7}, (_, i) => i);
const ALL_ZP = Array.from({length: 13}, (_, i) => i);
const ALL_CR = Array.from({length: 8}, (_, i) => i);
const ALL_343R = Array.from({length: 8}, (_, i) => i);

export const Root: React.FC = () => (
  <>
    <Composition
      id="virtdr-343-relocate"
      component={RelocateHome}
      durationInFrames={Math.max(1, buildTimeline343R(ALL_343R).total)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: ALL_343R}}
    />
    <Composition
      id="cleanup-reprotect"
      component={CleanupReprotect}
      durationInFrames={Math.max(1, buildTimelineCR(ALL_CR).total)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: ALL_CR}}
    />
    <Composition
      id="zerto-primer"
      component={ZertoPrimer}
      durationInFrames={Math.max(1, buildTimelineZP(ALL_ZP).total)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: ALL_ZP}}
    />
    <Composition
      id="csi-layers"
      component={CsiLayers}
      durationInFrames={Math.max(1, buildTimelineCL(ALL_CL).total)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: ALL_CL}}
    />
    <Composition
      id="csi-vendors"
      component={CsiVendors}
      durationInFrames={Math.max(1, buildTimelineCV(ALL_CV).total)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: ALL_CV}}
    />
    <Composition
      id="virtdr-342"
      component={VirtDr342}
      durationInFrames={Math.max(1, buildTimeline342(ALL_342).total)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{chapters: ALL_342}}
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
