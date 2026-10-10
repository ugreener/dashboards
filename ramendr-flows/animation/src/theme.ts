import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

export const sans = loadInter('normal', {weights: ['400', '500', '600', '700', '800'], subsets: ['latin']}).fontFamily;
export const mono = loadMono('normal', {weights: ['400', '600'], subsets: ['latin']}).fontFamily;

// Palette aligned with the RamenDR dashboards (GitHub dark).
export const C = {
  bg: '#05080d',
  bg2: '#0d1117',
  panel: '#161b22',
  panel2: '#1c2330',
  border: '#30363d',
  text: '#f0f6fc',
  dim: '#9ba7b4',
  faint: '#6e7681',
  blue: '#58a6ff',
  cyan: '#39c5cf',
  green: '#3fb950',
  amber: '#d29922',
  orange: '#ffa657',
  red: '#ff7b72',
  purple: '#bc8cff',
  pink: '#f778ba',
  hub: '#58a6ff',
  spoke1: '#d2a8ff',
  spoke0: '#56d4dd',
  array: '#ffa657',
  s3: '#e3b341',
};

// Resource kind colors: custom resources vs built-ins vs controllers.
export const KIND: Record<string, string> = {
  DRPlacementControl: C.orange,
  Placement: C.blue,
  PlacementDecision: C.blue,
  ApplicationSet: C.pink,
  Application: C.pink,
  VolumeReplicationGroup: C.orange,
  VolumeReplication: C.amber,
  ManifestWork: C.cyan,
  VirtualMachine: C.green,
  PersistentVolumeClaim: C.dim,
  PersistentVolume: C.dim,
  Controller: C.purple,
  Bucket: C.s3,
};
