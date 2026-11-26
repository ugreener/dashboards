import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; lines: string[]; box: Box; color: string; nameSize?: number};
export const NODES: Record<string, Node> = {
  drpolicy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'names the two clusters and the copy interval', lines: ['hub custom resource', 'schedulingInterval 15m'], box: [110, 190, 380, 150], color: C.blue},
  drpc: {kind: 'DRPlacementControl', name: 'dell-vm-placement-drpc', role: 'one application, its disks, its preferred site', lines: ['you or the console create it'], box: [110, 390, 380, 160], color: C.blue},
  ramen: {kind: 'Orchestrator', name: 'Ramen', role: 'reads the DRPC and writes the VRGs', lines: ['runs on the hub'], box: [540, 190, 420, 150], color: C.green},
  console: {kind: 'Console', name: 'Fleet virtualization', role: 'lists spoke VMs and enrolls one for DR', lines: ['ACM perspective', 'optional for recovery'], box: [540, 390, 420, 160], color: C.purple},
  minio: {kind: 'S3 store', name: 'minio-data', role: 'holds the DR metadata', lines: ['149Gi on hostpath-csi'], box: [1010, 190, 420, 150], color: C.amber},

  vrg: {kind: 'VolumeReplicationGroup', name: 'VRG, one per cluster', role: 'the per-cluster protection record', lines: ['Ramen creates it'], box: [110, 750, 340, 150], color: C.green},
  vr: {kind: 'VolumeReplication', name: 'one request per disk or group', role: 'asks for the copy', lines: ['VolumeGroupReplication for groups'], box: [490, 750, 360, 160], color: C.green},
  klass: {kind: 'VolumeReplicationClass', name: 'powerstore-vgrc-15m', role: 'names the arrays, peer, mode and RPO', lines: ['sourceArray / targetArray', 'remoteSystem VSA-B'], box: [890, 750, 360, 180], color: C.green},
  sc: {kind: 'StorageClass', name: 'powerstore-sc-group', role: 'provisions the disks, carries the labels', lines: ['storageid + replicationid', '+ groupreplicationid'], box: [110, 960, 340, 180], color: C.green},
  driver: {kind: 'Dell CSI driver', name: 'csi-powerstore', role: 'creates and assigns the array objects', lines: ['runs in controller and node'], box: [490, 960, 360, 170], color: C.orange},
  csiaddons: {kind: 'csi-addons controller', name: 'csi-addons-system', role: 'watches replication requests', lines: ['not part of the driver chart'], box: [890, 960, 360, 170], color: C.cyan},

  pp: {kind: 'Protection policy', name: 'pp-vg-VSA-B-Fifteen_Minutes', role: 'pairs a disk or group with a rule', lines: ['created by the driver'], box: [1700, 760, 380, 160], color: C.orange, nameSize: 19},
  rr: {kind: 'Replication rule', name: 'rr-vg-VSA-B-Fifteen_Minutes', role: 'holds the peer and the RPO', lines: ['created by the driver'], box: [1700, 970, 380, 150], color: C.orange, nameSize: 19},
  session: {kind: 'Replication session', name: 'async, A to B', role: 'the running copy', lines: ['created by assigning the policy'], box: [1700, 1160, 380, 150], color: C.orange},
  replica: {kind: 'Replica policy', name: 'pp-vg-VSA-B-Fifteen_Minutes_VSA-A', role: 'the peer copy of the policy', lines: ['marked as a replica'], box: [2190, 860, 380, 170], color: C.orange, nameSize: 17},
  copy: {kind: 'Destination copy', name: 'baseline, then periodic syncs', role: 'the recoverable data', lines: ['on the peer array'], box: [2190, 1070, 380, 160], color: C.orange},

  bundle: {kind: 'Install bundle', name: 'csi-powerstore-install.tar.gz', role: 'chart, values and per-cluster manifests', lines: ['from Dell, via Google Drive'], box: [110, 1450, 560, 170], color: C.cyan},
  settings: {kind: 'Helm values', name: 'settings.yaml', role: 'lists every image and feature switch', lines: ['set images.driver.image here'], box: [720, 1450, 520, 170], color: C.cyan},
  images: {kind: 'Container images', name: '8 images, 9 containers', role: 'the driver plus seven helpers', lines: ['only the driver image is private'], box: [1290, 1450, 560, 170], color: C.cyan},
  pull: {kind: 'Pull secret', name: 'your registry pull secret', role: 'lets the kubelet pull the private image', lines: ['the chart does not render it'], box: [1900, 1450, 560, 170], color: C.cyan},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const REGIONS: {key: string; b: {x: number; y: number; w: number; h: number}; title: string; sub?: string; color: string}[] = [
  {key: 'hub', b: {x: 60, y: 80, w: 1420, h: 520}, title: 'HUB', sub: 'control plane', color: C.blue},
  {key: 'spoke', b: {x: 60, y: 640, w: 1560, h: 640}, title: 'SPOKE', sub: 'one application cluster', color: C.green},
  {key: 'vsaA', b: {x: 1660, y: 640, w: 460, h: 700}, title: 'VSA-A', sub: 'spoke local array', color: C.orange},
  {key: 'vsaB', b: {x: 2150, y: 640, w: 460, h: 700}, title: 'VSA-B', sub: 'peer array', color: C.orange},
  {key: 'install', b: {x: 60, y: 1370, w: 2540, h: 450}, title: 'INSTALL KIT', sub: 'what you bring to a new cluster', color: C.cyan},
];
export const REGION_OF: Record<string, string> = {
  drpolicy: 'hub', drpc: 'hub', ramen: 'hub', console: 'hub', minio: 'hub',
  vrg: 'spoke', vr: 'spoke', klass: 'spoke', sc: 'spoke', driver: 'spoke', csiaddons: 'spoke',
  pp: 'vsaA', rr: 'vsaA', session: 'vsaA', replica: 'vsaB', copy: 'vsaB',
  bundle: 'install', settings: 'install', images: 'install', pull: 'install',
};
export const TOPMOST: Record<string, string> = {hub: 'drpolicy', spoke: 'vrg', vsaA: 'pp', vsaB: 'replica', install: 'bundle'};

export const FOCUS: Record<string, string[]> = {
  '0.1': Object.keys(NODES),
  '1.1': ['drpc', 'vrg', 'vr', 'driver', 'pp'],
  '1.2': ['drpolicy', 'drpc', 'vrg'],
  '1.3': ['vr', 'klass'],
  '2.1': ['drpc', 'vrg', 'vr', 'klass', 'csiaddons', 'driver'],
  '2.2': ['pp', 'rr', 'session'],
  '2.3': ['pp', 'session', 'replica'],
  '3.1': ['drpolicy', 'drpc', 'klass', 'driver', 'pp'],
  '3.2': ['klass', 'session', 'replica'],
  '4.1': ['sc', 'klass'],
  '4.2': ['bundle', 'sc', 'klass'],
  '5.1': ['images', 'driver'],
  '5.2': ['images', 'pull'],
  '6.1': ['bundle', 'settings', 'images'],
  '7.1': ['images', 'driver'],
  '7.2': ['csiaddons', 'images'],
  '8.1': ['bundle', 'settings', 'driver', 'pull'],
  '8.2': ['sc', 'klass', 'session'],
  '8.3': ['csiaddons', 'vr', 'session'],
  '9.1': ['console', 'drpc'],
  '9.2': ['minio', 'console'],
  '10.1': Object.keys(NODES),
};

type Edge = {d: string; label?: string; lx?: number; ly?: number; color: string; intro: string; src: string; dst: string; frac?: number; dashed?: boolean; end: [number, number]; ang: number};
const EDGES: Record<string, Edge> = {
  createVr: {d: 'M450,825 L490,830', color: C.green, intro: '1.3', src: 'vrg', dst: 'vr', end: [490, 830], ang: 6},
  nameClass: {d: 'M850,830 L890,830', color: C.green, intro: '1.3', src: 'vr', dst: 'klass', end: [890, 830], ang: 0},
  classParams: {d: 'M1070,930 L1070,960', color: C.dim, intro: '2.1', src: 'klass', dst: 'csiaddons', dashed: true, end: [1070, 960], ang: 90},
  gRpc: {d: 'M890,1045 L850,1045', color: C.cyan, intro: '2.1', src: 'csiaddons', dst: 'driver', end: [850, 1045], ang: 180},
  driverCreates: {d: 'M850,1040 C1200,1040 1400,840 1700,840', label: 'creates', lx: 1230, ly: 980, color: C.green, intro: '2.2', src: 'driver', dst: 'pp', end: [1700, 840], ang: 0},
  ruleUsed: {d: 'M1890,970 L1890,920', color: C.dim, intro: '2.2', src: 'rr', dst: 'pp', dashed: true, end: [1890, 920], ang: 270},
  assign: {d: 'M2080,840 C2140,840 2140,1235 2080,1235', color: C.green, intro: '2.2', src: 'pp', dst: 'session', end: [2080, 1235], ang: 180},
  mirror: {d: 'M2080,880 C2140,880 2140,940 2190,940', color: C.purple, intro: '2.3', src: 'pp', dst: 'replica', dashed: true, end: [2190, 940], ang: 8},
  syncs: {d: 'M2080,1235 C2140,1235 2140,1150 2190,1150', color: C.orange, intro: '2.3', src: 'session', dst: 'copy', end: [2190, 1150], ang: 350},
  scSame: {d: 'M280,960 L280,900 L890,900', label: 'same storageid', lx: 600, ly: 900, color: C.dim, intro: '4.1', src: 'sc', dst: 'klass', dashed: true, end: [890, 900], ang: 0},
  bundleHolds: {d: 'M670,1535 L720,1535', color: C.dim, intro: '6.1', src: 'bundle', dst: 'settings', end: [720, 1535], ang: 0},
  settingsLists: {d: 'M1240,1535 L1290,1535', color: C.dim, intro: '6.1', src: 'settings', dst: 'images', end: [1290, 1535], ang: 0},
  installedAs: {d: 'M1570,1450 C1200,1400 900,1250 700,1130', label: 'installed as', lx: 1140, ly: 1310, color: C.cyan, intro: '8.1', src: 'images', dst: 'driver', end: [700, 1130], ang: 215},
  pullWith: {d: 'M1900,1560 L1858,1560', color: C.cyan, intro: '5.2', src: 'pull', dst: 'images', dashed: true, end: [1858, 1560], ang: 180},
  enrolls: {d: 'M540,470 L490,470', color: C.purple, intro: '9.1', src: 'console', dst: 'drpc', dashed: true, end: [490, 470], ang: 180},
};

export type Ctx = {id: string; f: number; dur: number; zoom: number; hiddenTitles?: string[]};
const chapter = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = FOCUS[c.id] ?? [];
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.08);
  const recap = chapter(c.id) === 10;

  const edgeG = (key: string) => {
    const e = EDGES[key];
    if (!reached(c.id, e.intro)) return null;
    const introCh = chapter(e.intro);
    const focusOp = keys.length === 0 ? 1 : keys.includes(e.src) && keys.includes(e.dst) ? 1 : 0.12;
    const op = recap ? 0.9 : introCh === chapter(c.id) ? focusOp : 0.2;
    const draw = c.id === e.intro ? prog(c.f, c.dur * (e.frac ?? 0.18), c.dur * (e.frac ?? 0.18) + 30) : 1;
    if (draw <= 0.01) return null;
    return (
      <g key={key} opacity={op}>
        <path d={e.d} stroke={e.color} strokeOpacity={0.14} strokeWidth={9} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} />
        <path d={e.d} stroke={e.color} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} strokeLinecap="round" style={e.dashed ? {strokeDasharray: '0.012 0.012', opacity: Math.min(1, draw * 1.6)} : undefined} />
        <polygon points="0,-8 15,0 0,8" fill={e.color} transform={`translate(${e.end[0]},${e.end[1]}) rotate(${e.ang})`} opacity={draw > 0.9 ? 1 : 0} />
        {e.label && draw > 0.55 ? (
          <g transform={`translate(${e.lx},${e.ly})`}>
            <rect x={-e.label.length * 6.3 - 14} y={-19} width={e.label.length * 12.6 + 28} height={38} rx={19} fill={C.bg} stroke={e.color} strokeWidth={1.8} />
            <text x={0} y={7} textAnchor="middle" fill={e.color} fontFamily={mono} fontSize={19} fontWeight={600}>{e.label}</text>
          </g>
        ) : null}
      </g>
    );
  };

  const firstWorldBeat = c.id === '1.1';

  return (
    <div style={{position: 'absolute', width: 2600, height: 1880}}>
      {REGIONS.map((r) => {
        const members = Object.keys(NODES).filter((k) => REGION_OF[k] === r.key);
        const anyFocused = keys.length === 0 || members.some((k) => keys.includes(k));
        const regionOp = keys.length === 0 ? 1 : anyFocused ? 1 : 0.08;
        return <Region key={r.key} b={r.b} title={r.title} sub={r.sub} color={r.color} opacity={regionOp} hideTitle={c.hiddenTitles?.includes(r.key)} />;
      })}
      {Object.entries(NODES).map(([key, n], i) => {
        const appear = firstWorldBeat ? prog(c.f, -12 + i * 3, 30 + i * 3) : 1;
        return (
          <Card
            key={key}
            x={n.box[0]}
            y={n.box[1]}
            w={n.box[2]}
            kind={n.kind}
            name={n.name}
            role={n.role}
            lines={n.lines}
            appear={appear}
            focus={focus(key)}
            hl={keys.includes(key) ? 0.25 : 0}
            color={n.color}
            nameSize={n.nameSize}
            detail={Math.max(0, Math.min(1, (c.zoom - 0.65) / 0.2))}
          />
        );
      })}
      <svg width={2600} height={1880} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        {Object.keys(EDGES).map((k) => edgeG(k))}
        {chapter(c.id) >= 10 ? (
          <text x={1300} y={1850} textAnchor="middle" fill={C.faint} fontFamily={sans} fontSize={22}>
            the DRPC is an input, the VRG is generated, the class carries the facts, the driver creates the array objects
          </text>
        ) : null}
      </svg>
    </div>
  );
};
