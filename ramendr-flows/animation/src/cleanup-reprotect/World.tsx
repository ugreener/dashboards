import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string};
export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'hammerdb-win-drpc', role: 'records the requested move and its progression', scope: 'hub · openshift-dr-ops', box: [120, 105, 700, 195], color: C.orange},
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'pairs the sites and sets the 900-second objective', scope: 'hub · cluster scope', box: [880, 105, 560, 195], color: C.orange},
  site: {kind: 'ManagedCluster', name: 'spoke-0', role: 'the hub heartbeat for the old source site', scope: 'hub · cluster scope', box: [1520, 105, 520, 195], color: C.blue},
  vrg0: {kind: 'VolumeReplicationGroup', name: 'hammerdb-win-drpc', role: 'coordinates the target disks after failover', scope: 'spoke-1 · openshift-dr-ops', box: [120, 465, 520, 195], color: C.spoke1},
  vr0r: {kind: 'VolumeReplication', name: 'hammerdb-win-rootdisk', role: 'target root disk, promoted to Primary', scope: 'spoke-1 · hammerdb-win', box: [700, 465, 500, 195], color: C.amber},
  vr0d: {kind: 'VolumeReplication', name: 'hammerdb-win-datadisk', role: 'target data disk, promoted to Primary', scope: 'spoke-1 · hammerdb-win', box: [700, 690, 500, 195], color: C.amber},
  vm0: {kind: 'VirtualMachine', name: 'hammerdb-win', role: 'the recovered Windows guest, running', scope: 'spoke-1 · hammerdb-win', box: [120, 690, 520, 195], color: C.green},
  vrg1: {kind: 'VolumeReplicationGroup', name: 'hammerdb-win-drpc', role: 'must become Secondary for the failover to finish', scope: 'spoke-0 · openshift-dr-ops', box: [1285, 465, 540, 195], color: C.spoke0},
  vr1r: {kind: 'VolumeReplication', name: 'hammerdb-win-rootdisk', role: 'old root disk on the source', scope: 'spoke-0 · hammerdb-win', box: [1870, 465, 500, 195], color: C.amber},
  vr1d: {kind: 'VolumeReplication', name: 'hammerdb-win-datadisk', role: 'old data disk on the source', scope: 'spoke-0 · hammerdb-win', box: [1870, 690, 500, 170], color: C.amber},
  pvc1r: {kind: 'PersistentVolumeClaim', name: 'hammerdb-win-rootdisk', role: 'held by two finalizers', scope: 'spoke-0 · hammerdb-win', box: [1285, 690, 540, 170], color: C.dim},
  pvc1d: {kind: 'PersistentVolumeClaim', name: 'hammerdb-win-datadisk', role: 'held by two finalizers', scope: 'spoke-0 · hammerdb-win', box: [1285, 880, 540, 170], color: C.dim},
  array0: {kind: 'PowerStore array', name: 'VSA-A', role: 'destination after failover', scope: 'spoke-0 storage · PS3b37452a6e0f', box: [120, 1170, 520, 200], color: C.array},
  array1: {kind: 'PowerStore array', name: 'VSA-B', role: 'source after failover', scope: 'spoke-1 storage · PSff392f423bd6', box: [1285, 1170, 520, 200], color: C.array},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const FOCUS: Record<string, string[]> = {
  '2.1': ['vrg1', 'array1'],
  '2.2': ['array1'],
  '2.3': ['vrg0', 'vr0r', 'vr0d', 'vm0'],
  '2.4': ['array0'],
  '2.5': ['vrg1'],
  '3.1': ['site', 'vrg1'],
  '3.2': ['drpc'],
  '3.3': ['vrg0', 'vr0r', 'vr0d', 'vm0'],
  '3.4': ['vrg1'],
  '3.5': ['drpc'],
  '4.1': ['pvc1r', 'pvc1d', 'vrg1'],
  '4.2': ['pvc1r', 'pvc1d'],
  '4.3': ['pvc1r', 'pvc1d'],
  '4.4': ['vr1r', 'vr1d', 'array1'],
  '4.5': ['array1'],
  '4.6': ['drpc'],
  '4.7': ['pvc1r', 'pvc1d', 'vrg1'],
  '5.1': ['vrg1', 'vr1r', 'vr1d', 'array1'],
  '5.2': ['pvc1r', 'pvc1d'],
  '5.3': ['vr1r', 'vr1d'],
  '5.4': ['vrg1'],
  '5.5': ['drpc'],
  '5.6': ['array1'],
  '5.7': ['vr0r', 'vr0d', 'array0'],
  '6.1': ['vrg1', 'vrg0', 'array0', 'array1', 'drpc'],
  '7.1': ['drpc'],
  '7.2': ['array0', 'array1', 'vrg1'],
  '7.3': ['drpc', 'vrg1', 'vrg0', 'array0', 'array1'],
  '7.4': ['drpc'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

export const CH: [string, number, string, string][] = [
  ['2.1', 0.2, 'site', 'Available=Unknown · heartbeat stopped'],
  ['2.1', 0.2, 'vrg1', 'stale Primary · site down'],
  ['2.2', 0.25, 'array0', 'Destination · Failed_Over'],
  ['2.2', 0.25, 'array1', 'Source · Failed_Over'],
  ['2.2', 0.4, 'drpc', 'FailedOver · Cleaning Up'],
  ['2.3', 0.3, 'vrg0', 'Primary'],
  ['2.3', 0.3, 'vr0r', 'Primary'],
  ['2.3', 0.3, 'vr0d', 'Primary'],
  ['2.3', 0.3, 'vm0', 'Running'],
  ['3.1', 0.25, 'site', 'Available=True · heartbeat back'],
  ['3.2', 0.25, 'drpc', 'FailedOver · WaitOnUserToCleanUp'],
  ['4.2', 0.25, 'pvc1r', 'deleting · 11:34'],
  ['4.2', 0.25, 'pvc1d', 'deleting · 11:34'],
  ['4.3', 0.25, 'pvc1r', 'Terminating · 2 finalizers'],
  ['4.3', 0.25, 'pvc1d', 'Terminating · 2 finalizers'],
  ['4.4', 0.3, 'vr1r', 'secondary · autoResync=true'],
  ['4.4', 0.3, 'vr1d', 'secondary · autoResync=true'],
  ['5.4', 0.2, 'vrg1', 'state Unknown · DataReady=False'],
  ['5.5', 0.2, 'drpc', 'FailedOver · WaitOnUserToCleanUp'],
];

const FINALIZERS = [
  'finalizer: volumereplicationgroups.ramendr.openshift.io/pvc-vr-protection',
  'finalizer: replication.storage.openshift.io/pvc-protection',
];

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = FOCUS[c.id] ?? [];
  const status = (key: string) => {
    const base: Record<string, string> = {
      site: 'Available=True',
      vrg1: 'Primary · active site',
      vrg0: 'Secondary · recovery peer',
      vr1r: 'Primary',
      vr1d: 'Primary',
      vr0r: 'Secondary',
      vr0d: 'Secondary',
      vm0: 'not running yet',
      drpc: 'Deployed',
      array0: 'Source · copying to VSA-B',
      array1: 'Destination · receiving',
      pvc1r: 'Bound · drprotection=true',
      pvc1d: 'Bound · drprotection=true',
    };
    let v = base[key] ?? '';
    for (const [beat, frac, k, value] of CH) if (k === key && reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac)) v = value;
    return v;
  };
  const frozen = reached(c.id, '2.1') && !reached(c.id, '3.1');
  const wedged = phase(c.id) >= 5 && phase(c.id) <= 7;
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.08);
  const chapter = phase(c.id);
  const lockLines = (key: string) => {
    const st = status(key);
    if (st.startsWith('Terminating')) return ['deletionTimestamp: 2026-10-22T11:34:00Z', 'finalizers: 2 · held'];
    return [status(key), key === 'pvc1r' || key === 'pvc1d' ? 'owner: the VRG protection chain' : 'recorded configuration'];
  };
  return <div style={{position: 'absolute', width: 2480, height: 1470}}>
    <Region b={{x: 70, y: 45, w: 2340, h: 300}} title="HUB · edge36" sub="recovery coordinator" color={C.blue} />
    <Region b={{x: 70, y: 400, w: 1170, h: 680}} title="SPOKE-1 · edge97 · TARGET" sub="runs the recovered workload" color={C.spoke1} />
    <Region b={{x: 1235, y: 400, w: 1175, h: 680}} title="SPOKE-0 · edge95 · OLD SOURCE" sub={frozen ? 'site suspended' : 'cleanup site'} color={wedged ? C.red : frozen ? C.red : C.spoke0} dashed={frozen} glow={wedged ? 0.6 : 0} />
    <Region b={{x: 70, y: 1110, w: 1170, h: 330}} title="VSA-A · DESTINATION" color={C.array} />
    <Region b={{x: 1235, y: 1110, w: 1175, h: 330}} title="VSA-B · SOURCE" color={C.array} />

    {Object.entries(NODES).map(([key, n]) => {
      const appear = chapter === 2 ? prog(c.f, -15, 35) : 1;
      const isLock = key === 'pvc1r' || key === 'pvc1d';
      const lines = isLock ? lockLines(key) : [n.scope, status(key)];
      return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role} lines={lines} appear={appear} focus={focus(key)} hl={keys.includes(key) ? 0.28 : 0} color={wedged && (key === 'pvc1r' || key === 'pvc1d' || key === 'vrg1' || key === 'vr1r' || key === 'vr1d') ? C.red : n.color} detail={Math.max(0, Math.min(1, (c.zoom - 0.65) / 0.2))} nameSize={key === 'pvc1r' || key === 'pvc1d' ? 20 : 22} />;
    })}

    <svg width={2480} height={1470} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs>
        <marker id="tipCR" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.cyan} /></marker>
        <marker id="tipCRO" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.orange} /></marker>
        <marker id="tipCRR" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.red} /></marker>
      </defs>
      {chapter >= 2 && (keys.includes('vrg1') || keys.includes('drpc')) ? <g opacity={prog(c.f, c.dur * .05, c.dur * .05 + 25)}>
        <path d="M470,300 C470,345 1555,345 1555,450" fill="none" stroke={C.cyan} strokeWidth={4} markerEnd="url(#tipCR)" />
        <rect x={720} y={352} width={650} height={34} rx={10} fill={C.bg} />
        <text x={1045} y={376} textAnchor="middle" fill={C.cyan} fontSize={20} fontFamily={sans}>ManifestWork sets the source VRG to Secondary</text>
      </g> : null}
      {chapter >= 4 && (keys.includes('vrg1') || keys.includes('vr1r') || keys.includes('vr1d')) ? <g opacity={prog(c.f, c.dur * .1, c.dur * .1 + 22)}>
        <path d="M1825,560 L1870,560" fill="none" stroke={C.orange} strokeWidth={4} markerEnd="url(#tipCRO)" />
        <path d="M1825,775 L1870,775" fill="none" stroke={C.orange} strokeWidth={4} markerEnd="url(#tipCRO)" />
        <rect x={1690} y={600} width={330} height={32} rx={10} fill={C.bg} />
        <text x={1855} y={622} textAnchor="middle" fill={C.orange} fontSize={19} fontFamily={sans}>one request per disk</text>
      </g> : null}
      {chapter >= 2 && (keys.includes('vr1r') || keys.includes('vr1d')) ? <g opacity={prog(c.f, c.dur * .12, c.dur * .12 + 24)}>
        <path d={wedged ? 'M2368,585 L2440,585 L2440,1080 L1820,1080 L1820,1160' : 'M2368,585 L2440,585 L2440,1080 L1820,1080 L1820,1160'} fill="none" stroke={wedged ? C.red : C.orange} strokeWidth={4} strokeDasharray={wedged ? '10 9' : undefined} markerEnd={`url(#${wedged ? 'tipCRR' : 'tipCRO'})`} />
        <rect x={1910} y={976} width={480} height={34} rx={10} fill={C.bg} />
        <text x={2150} y={1000} textAnchor="middle" fill={wedged ? C.red : C.orange} fontSize={20} fontFamily={sans}>{wedged ? 'no ResyncVolume issued' : 'csi-addons calls Dell CSI'}</text>
      </g> : null}
      {chapter >= 2 && (keys.includes('array0') || keys.includes('array1') || keys.includes('vrg1')) ? <g opacity={prog(c.f, c.dur * .15, c.dur * .15 + 24)}>
        <path d={reached(c.id, '2.2') ? 'M1285,1290 L660,1290' : 'M660,1290 L1285,1290'} fill="none" stroke={reached(c.id, '2.2') ? C.red : C.orange} strokeWidth={5} strokeDasharray={reached(c.id, '2.2') ? '12 10' : undefined} markerEnd={`url(#${reached(c.id, '2.2') ? 'tipCRR' : 'tipCRO'})`} />
        <rect x={760} y={1258} width={530} height={38} rx={12} fill={C.bg} />
        <text x={1025} y={1284} textAnchor="middle" fill={reached(c.id, '2.2') ? C.red : C.orange} fontSize={22} fontFamily={sans}>{reached(c.id, '2.2') ? (wedged ? 'no resync · no data movement' : 'no data movement · Failed_Over') : 'baseline copy · VSA-A to VSA-B'}</text>
      </g> : null}
    </svg>
  </div>;
};
