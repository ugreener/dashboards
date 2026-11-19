import React from 'react';
import {C, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; lines: (s: string) => string[]; box: Box; color: string; nameSize?: number};

export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'test-478-vgr-resync-drpc', role: 'records the requested move and its progression', lines: (s) => ['hub · openshift-dr-ops', s], box: [120, 105, 700, 175], color: C.orange},
  placement: {kind: 'Placement', name: 'test-478-vgr-resync-placement', role: 'decides which cluster should run the application', lines: (s) => ['hub · openshift-dr-ops', s], box: [860, 105, 520, 175], color: C.blue, nameSize: 17},
  decision: {kind: 'PlacementDecision', name: 'test-478-vgr-resync-placement-decision-1', role: 'records the cluster the placement chose', lines: (s) => ['hub · openshift-dr-ops', s], box: [1420, 105, 520, 175], color: C.blue, nameSize: 16},
  policy: {kind: 'DRPolicy', name: 'dr-policy-5m', role: 'names the two clusters and the recovery point', lines: (s) => ['hub · cluster scope', s], box: [1980, 105, 390, 175], color: C.orange, nameSize: 19},

  vrg0: {kind: 'VolumeReplicationGroup', name: 'test-478-vgr-resync-drpc', role: 'coordinates the group on this site', lines: (s) => ['spoke-0 · openshift-dr-ops', s], box: [120, 455, 1080, 170], color: C.orange},
  vgr0: {kind: 'VolumeGroupReplication', name: 'vgr-4251c970ec7af885d6ec79c1d2c40661-test-478-vgr-resync-drpc', role: 'one container for every matching claim', lines: (s) => ['spoke-0 · test-478-vgr-resync', s], box: [120, 665, 520, 190], color: C.purple, nameSize: 13},
  content0: {kind: 'VolumeGroupReplicationContent', name: 'vgrcontent-87f1d6c5-3b5c-4c35-9c25-8b5dee56b03a', role: 'holds the array group handle and disk mapping', lines: (s) => ['cluster scope · group manifest', s], box: [680, 665, 520, 190], color: C.cyan, nameSize: 13},
  csi0: {kind: 'Controller', name: 'csi-addons-controller-manager', role: 'turns the group state into CSI calls', lines: (s) => ['spoke-0 · csi-addons-system', s], box: [120, 895, 520, 190], color: C.purple, nameSize: 19},
  driver0: {kind: 'Controller', name: 'powerstore-controller', role: 'executes the call on VSA-A', lines: (s) => ['spoke-0 · powerstore', s], box: [680, 895, 520, 190], color: C.purple},

  vrg1: {kind: 'VolumeReplicationGroup', name: 'test-478-vgr-resync-drpc', role: 'coordinates the group on this site', lines: (s) => ['spoke-1 · openshift-dr-ops', s], box: [1285, 455, 1075, 170], color: C.orange},
  vgr1: {kind: 'VolumeGroupReplication', name: 'vgr-4251c970ec7af885d6ec79c1d2c40661-test-478-vgr-resync-drpc', role: 'recreated here when this site is asked to become primary', lines: (s) => ['spoke-1 · test-478-vgr-resync', s], box: [1285, 665, 520, 190], color: C.purple, nameSize: 13},
  content1: {kind: 'VolumeGroupReplicationContent', name: 'vgrcontent-87f1d6c5-3b5c-4c35-9c25-8b5dee56b03a', role: 'rewritten with the destination group and disk mapping', lines: (s) => ['cluster scope · group manifest', s], box: [1845, 665, 520, 190], color: C.cyan, nameSize: 13},
  csi1: {kind: 'Controller', name: 'csi-addons-controller-manager', role: 'turns the group state into CSI calls', lines: (s) => ['spoke-1 · csi-addons-system', s], box: [1285, 895, 520, 190], color: C.purple, nameSize: 19},
  driver1: {kind: 'Controller', name: 'powerstore-controller', role: 'executes the call on VSA-B', lines: (s) => ['spoke-1 · powerstore', s], box: [1845, 895, 520, 190], color: C.purple},

  groupA: {kind: 'PowerStore volume group', name: 'vg-87f1d6c5-3b5c-4c35-9c25-8b5dee56b03a-VSA-B-Five_Minutes', role: 'the copy on the home array', lines: (s) => ['VSA-A · 6e63ea85-6b78-4d25-be58-4b21f5a9f821', s], box: [200, 1270, 640, 190], color: C.array, nameSize: 14},
  groupB: {kind: 'PowerStore volume group', name: 'vg-87f1d6c5-3b5c-4c35-9c25-8b5dee56b03a-VSA-B-Five_Minutes', role: 'the copy on the target array', lines: (s) => ['VSA-B · 3058dacd-695f-468a-8eb2-8ef9180abed7', s], box: [1560, 1270, 640, 190], color: C.array, nameSize: 14},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const FOCUS: Record<string, string[]> = {
  '2.1': ['drpc', 'vrg0', 'vrg1'],
  '2.2': ['placement', 'decision', 'drpc'],
  '2.3': ['vrg0', 'vrg1'],
  '2.4': ['vgr0', 'vrg0'],
  '2.5': ['content0', 'vgr0'],
  '2.6': ['vgr0', 'content0', 'groupA'],
  '2.7': ['policy'],
  '3.1': ['groupA', 'groupB'],
  '3.2': ['groupA'],
  '3.3': ['vgr0', 'content0'],
  '4.1': ['drpc', 'vrg1'],
  '4.2': ['drpc', 'vrg1', 'placement', 'decision'],
  '4.3': ['vrg1', 'vgr1', 'content1'],
  '4.4': ['vgr1', 'csi1'],
  '4.5': ['csi1', 'driver1', 'groupB', 'groupA'],
  '4.6': ['drpc', 'vrg1', 'groupB'],
  '4.7': ['groupA', 'groupB', 'vrg1'],
  '5.1': ['vgr1', 'content1'],
  '5.2': ['vgr1', 'groupB'],
  '5.3': ['drpc', 'vgr1'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

export const CH: [string, number, string, string][] = [
  ['2.1', 0.1, 'drpc', 'Deployed'],
  ['2.1', 0.1, 'vrg0', 'Primary'],
  ['2.1', 0.1, 'vrg1', 'Secondary'],
  ['2.1', 0.1, 'placement', 'spoke-0'],
  ['2.1', 0.1, 'decision', 'spoke-0'],
  ['2.1', 0.1, 'policy', '5m'],
  ['2.4', 0.1, 'vgr0', 'primary'],
  ['2.5', 0.1, 'content0', 'handle ready'],
  ['2.6', 0.1, 'content0', 'source + target mapping'],
  ['2.6', 0.1, 'groupA', 'Source · OK'],
  ['2.6', 0.1, 'groupB', 'Destination · OK'],
  ['3.1', 0.1, 'groupA', 'Source · OK'],
  ['3.1', 0.1, 'groupB', 'Destination · OK'],
  ['4.1', 0.1, 'drpc', 'Failover requested'],
  ['4.2', 0.1, 'drpc', 'FailingOver'],
  ['4.2', 0.1, 'placement', 'spoke-1'],
  ['4.2', 0.1, 'decision', 'spoke-1'],
  ['4.3', 0.1, 'vrg1', 'Primary'],
  ['4.3', 0.1, 'vgr1', 'primary'],
  ['4.3', 0.1, 'content1', 'rewritten from archive'],
  ['4.4', 0.1, 'vgr1', 'primary · PromoteVolume'],
  ['4.4', 0.1, 'csi1', 'PromoteVolume'],
  ['4.5', 0.1, 'driver1', 'array failover'],
  ['4.5', 0.1, 'groupB', 'Source · writable'],
  ['4.5', 0.1, 'groupA', 'Destination · stale'],
  ['4.6', 0.1, 'drpc', 'FailedOver · Completed'],
  ['4.6', 0.1, 'vrg1', 'Primary · DataReady'],
  ['4.6', 0.1, 'groupB', 'Source · OK'],
  ['4.7', 0.1, 'groupA', 'Destination · no current copy'],
  ['4.7', 0.1, 'groupB', 'Source · primary'],
  ['5.1', 0.1, 'vgr1', 'Unknown'],
  ['5.1', 0.9, 'vgr1', 'Primary'],
  ['5.2', 0.1, 'vgr1', 'Primary · autoResync false'],
  ['5.2', 0.1, 'groupB', 'Source · Failed_Over'],
  ['5.3', 0.1, 'drpc', 'Protected true'],
  ['5.3', 0.1, 'vgr1', 'Replicating false'],
];

const BASE: Record<string, string> = {
  drpc: 'Deployed',
  placement: 'spoke-0',
  decision: 'spoke-0',
  policy: 'spoke-0 + spoke-1',
  vrg0: 'Primary',
  vgr0: 'not created yet',
  content0: 'not created yet',
  csi0: 'idle',
  driver0: 'idle',
  vrg1: 'Secondary',
  vgr1: 'not created yet',
  content1: 'not created yet',
  csi1: 'idle',
  driver1: 'idle',
  groupA: 'Source · OK',
  groupB: 'Destination · OK',
};

export const World: React.FC<{c: Ctx; panel?: boolean}> = ({c, panel}) => {
  const keys = FOCUS[c.id] ?? [];
  const chapter = phase(c.id);
  const status = (key: string) => {
    let v = BASE[key] ?? '';
    for (const [beat, frac, k, value] of CH) {
      if (k === key && reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac)) v = value;
    }
    return v;
  };
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.08);
  const appearAll = chapter === 2 ? prog(c.f, -15, 35) : 1;
  const failover = reached(c.id, '4.1');
  const moved = reached(c.id, '4.3');
  const promoted = reached(c.id, '4.5');
  const broken = reached(c.id, '5.1');
  const staleCopy = reached(c.id, '4.7');
  const arrow = (d: string, color: string, dashed: boolean, label: string | null, lx: number, ly: number, opacity = 1, lw = 420) => (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={5} strokeDasharray={dashed ? '14 11' : undefined} markerEnd="url(#tipVG)" />
      {label ? <>
        <rect x={lx - lw / 2} y={ly - 20} width={lw} height={38} rx={11} fill={C.bg} opacity={0.95} />
        <text x={lx} y={ly + 6} textAnchor="middle" fill={color} fontSize={20} fontFamily={sans}>{label}</text>
      </> : null}
    </g>
  );
  const node = (key: string, appear = appearAll) => {
    const n = NODES[key];
    const col = n.color;
    return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role}
      lines={n.lines(status(key))} appear={appear} focus={focus(key)} hl={keys.includes(key) ? 0.26 : 0}
      color={col} detail={Math.max(0, Math.min(1, (c.zoom - 0.65) / 0.2))} nameSize={n.nameSize ?? 22} />;
  };
  return <div style={{position: 'absolute', width: 2480, height: 1600}}>
    <Region b={{x: 70, y: 45, w: 2340, h: 280}} title="HUB · edge36" sub="the control record and the decision" color={C.blue} hideTitle={panel} />
    <Region b={{x: 70, y: 390, w: 1170, h: 790}} title="SPOKE-0 · edge95 · HOME SITE" sub="prefers the workload, holds VSA-A" color={C.spoke1} hideTitle={panel} />
    <Region b={{x: 1235, y: 390, w: 1175, h: 790}} title="SPOKE-1 · edge97 · TARGET SITE" sub="the copy that becomes primary" color={C.spoke0} hideTitle={panel} />
    <Region b={{x: 70, y: 1205, w: 1170, h: 320}} title="VSA-A · HOME ARRAY" sub="source of the copy" color={C.array} hideTitle={panel} />
    <Region b={{x: 1235, y: 1205, w: 1175, h: 320}} title="VSA-B · TARGET ARRAY" sub="destination of the copy" color={C.array} hideTitle={panel} />

    {Object.keys(NODES).map((key) => {
      if ((key === 'vgr1' || key === 'content1') && !moved) return null;
      if ((key === 'vgr0' || key === 'content0') && chapter === 2 && !reached(c.id, '2.4')) return null;
      return node(key, key === 'vgr1' || key === 'content1' ? prog(c.f, 0, 30) : appearAll);
    })}

    <svg width={2480} height={1600} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs>
        <marker id="tipVG" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.cyan} /></marker>
      </defs>

      {reached(c.id, '2.3') && !failover ? arrow('M470,295 C470,380 500,380 500,455', C.cyan, true, 'delivers the VRG', 700, 360, prog(c.f, c.dur * 0.1, c.dur * 0.1 + 24), 380) : null}
      {reached(c.id, '2.4') && !failover ? <>
        {arrow('M380,625 L380,665', C.green, false, null, 0, 0)}
        {arrow('M640,760 L680,760', C.cyan, false, null, 0, 0)}
      </> : null}
      {reached(c.id, '2.4') && !failover ? arrow('M380,855 L380,895', C.purple, true, null, 0, 0) : null}

      {!failover && chapter >= 3 ? arrow('M840,1365 L1560,1365', C.orange, false, 'one replication session · A to B', 1200, 1322) : null}

      {failover && !promoted ? arrow('M470,295 C470,360 1545,350 1545,455', C.cyan, true, 'moves the application', 1010, 350, prog(c.f, c.dur * 0.08, c.dur * 0.08 + 24), 420) : null}
      {moved ? <>
        {arrow('M1545,625 L1545,665', C.green, false, null, 0, 0)}
        {arrow('M1805,760 L1845,760', C.cyan, false, null, 0, 0)}
        {arrow('M1545,855 L1545,895', C.purple, true, null, 0, 0)}
        {arrow('M2105,855 L2105,895', C.purple, true, null, 0, 0)}
      </> : null}
      {promoted ? <>
        {arrow('M2105,1085 L1880,1265', C.orange, false, 'array failover · one group', 2130, 1180, 1, 360)}
      </> : null}

      {staleCopy ? <g transform="translate(1200,1365)"><circle r={26} fill={C.bg} stroke={C.red} strokeWidth={4} /><path d="M-10,-10 L10,10 M10,-10 L-10,10" stroke={C.red} strokeWidth={6} strokeLinecap="round" /></g> : null}
      {broken ? <g transform="translate(1545,640)"><circle r={22} fill={C.bg} stroke={C.red} strokeWidth={4} /><path d="M-8,-8 L8,8 M8,-8 L-8,8" stroke={C.red} strokeWidth={5} strokeLinecap="round" /></g> : null}
    </svg>
  </div>;
};
