import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string};
export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'dell-vm-drpc', role: 'records the Relocate and its progression', scope: 'hub · openshift-gitops', box: [110, 105, 520, 170], color: C.orange},
  policy: {kind: 'DRPolicy', name: 'dr-policy-15m', role: 'pairs the sites, RPO 900 seconds', scope: 'hub · cluster scope', box: [660, 105, 400, 170], color: C.orange},
  decision: {kind: 'PlacementDecision', name: 'dell-vm-placement-decision-1', role: 'the cluster list Ramen writes', scope: 'hub · openshift-gitops', box: [1090, 105, 470, 170], color: C.blue},
  appset: {kind: 'ApplicationSet', name: 'dell-vm-workload', role: 'creates one Application per selected cluster', scope: 'hub · openshift-gitops', box: [1590, 105, 430, 170], color: C.blue},
  app0: {kind: 'Application', name: 'dell-vm-workload-spoke-0', role: 'the source delivery order', scope: 'hub · openshift-gitops', box: [2050, 105, 370, 170], color: C.blue},
  app1: {kind: 'Application', name: 'dell-vm-workload-spoke-1', role: 'the target delivery order', scope: 'hub · openshift-gitops', box: [2050, 105, 370, 170], color: C.blue},

  vrg0: {kind: 'VolumeReplicationGroup', name: 'dell-vm-drpc', role: 'coordinates the disks on spoke-0', scope: 'spoke-0 · gitops-vms', box: [110, 465, 520, 160], color: C.spoke0},
  vr0r: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'root disk work order on spoke-0', scope: 'spoke-0 · gitops-vms', box: [670, 465, 520, 160], color: C.amber},
  vr0d: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-datadisk', role: 'data disk work order on spoke-0', scope: 'spoke-0 · gitops-vms', box: [670, 690, 520, 160], color: C.amber},
  vm0: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the guest before the move', scope: 'spoke-0 · gitops-vms', box: [110, 690, 520, 160], color: C.green},
  pvc0r: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk', role: 'the source root claim', scope: 'spoke-0 · gitops-vms', box: [110, 880, 520, 140], color: C.dim},
  pvc0d: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-datadisk', role: 'the source data claim', scope: 'spoke-0 · gitops-vms', box: [670, 880, 520, 140], color: C.dim},

  vrg1: {kind: 'VolumeReplicationGroup', name: 'dell-vm-drpc', role: 'coordinates the disks on spoke-1', scope: 'spoke-1 · gitops-vms', box: [1275, 465, 520, 160], color: C.spoke1},
  vr1r: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-rootdisk', role: 'root disk work order on spoke-1', scope: 'spoke-1 · gitops-vms', box: [1835, 465, 520, 160], color: C.amber},
  vr1d: {kind: 'VolumeReplication', name: 'hammerdb-rhel9-datadisk', role: 'data disk work order on spoke-1', scope: 'spoke-1 · gitops-vms', box: [1835, 690, 520, 160], color: C.amber},
  vm1: {kind: 'VirtualMachine', name: 'hammerdb-rhel9', role: 'the guest after the move', scope: 'spoke-1 · gitops-vms', box: [1275, 690, 520, 160], color: C.green},
  pvc1r: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-rootdisk', role: 'the target root claim', scope: 'spoke-1 · gitops-vms', box: [1275, 880, 520, 140], color: C.dim},
  pvc1d: {kind: 'PersistentVolumeClaim', name: 'hammerdb-rhel9-datadisk', role: 'the target data claim', scope: 'spoke-1 · gitops-vms', box: [1835, 880, 520, 140], color: C.dim},

  vsaA: {kind: 'PowerStore array', name: 'VSA-A', role: 'spoke-0 storage', scope: 'root and data sessions', box: [200, 1120, 900, 170], color: C.array},
  vsaB: {kind: 'PowerStore array', name: 'VSA-B', role: 'spoke-1 storage', scope: 'root and data sessions', box: [1380, 1120, 900, 170], color: C.array},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

export const FOCUS: Record<string, string[]> = {
  '2.1': ['drpc'],
  '2.2': ['vrg0', 'vm0', 'vrg1'],
  '2.3': ['vsaA'],
  '2.4': ['drpc', 'decision', 'vrg0'],
  '2.5': ['appset', 'app0'],
  '2.6': ['drpc', 'vrg0', 'vrg1', 'vsaA', 'vsaB'],
  '3.1': ['drpc', 'vrg0', 'vrg1'],
  '3.2': ['drpc'],
  '3.3': ['drpc', 'decision'],
  '3.4': ['drpc'],
  '3.5': ['drpc', 'vrg0'],
  '3.6': ['vrg0'],
  '3.7': ['app0'],
  '3.8': ['drpc', 'vrg0', 'vrg1', 'vsaA', 'vsaB'],
  '4.1': ['vrg1', 'pvc1r', 'pvc1d'],
  '4.2': ['drpc'],
  '4.3': ['decision', 'vrg1', 'vr1r', 'vr1d'],
  '4.4': ['pvc1r', 'pvc1d'],
  '4.5': ['app1'],
  '4.6': ['vm1'],
  '4.7': ['vm1', 'pvc1r', 'pvc1d'],
  '4.8': ['vm1', 'pvc1r', 'pvc1d', 'vrg1'],
  '5.1': ['vrg0', 'vrg1'],
  '5.2': ['app0'],
  '5.3': ['vrg0', 'vm0', 'pvc0r', 'pvc0d'],
  '5.4': ['vsaB', 'vsaA'],
  '5.5': ['vsaA', 'vsaB'],
  '5.6': ['drpc', 'decision'],
  '5.7': ['vrg0', 'vsaA', 'vsaB'],
  '6.1': ['drpc', 'vsaB'],
  '6.2': ['vsaB'],
  '6.3': ['vsaA', 'vsaB'],
  '6.4': ['vsaB'],
  '6.5': ['vsaB'],
  '6.6': ['vsaB'],
  '6.7': ['drpc', 'vsaA'],
  '6.8': ['drpc', 'vrg0', 'vsaA', 'vsaB'],
  '7.1': ['drpc', 'decision'],
  '7.2': ['vm1'],
  '7.3': ['vsaA'],
  '7.4': ['vm1', 'pvc1r', 'pvc1d'],
  '7.5': ['drpc', 'vsaB'],
  '7.6': ['drpc', 'decision', 'vrg0', 'vrg1', 'vsaA', 'vsaB'],
  '7.7': ['vsaA', 'vsaB'],
};

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number);
  const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};

export const CH: [string, number, string, string][] = [
  ['3.4', 0.2, 'drpc', 'Action: Relocate · preferred spoke-1'],
  ['3.5', 0.2, 'drpc', 'Relocating · RunningFinalSync'],
  ['3.5', 0.2, 'vrg0', 'Primary · final sync'],
  ['3.6', 0.2, 'drpc', 'Relocating · EnsuringVolumesAreSecondary'],
  ['3.6', 0.2, 'vrg0', 'Secondary'],
  ['3.6', 0.2, 'vr0r', 'Secondary'],
  ['3.6', 0.2, 'vr0d', 'Secondary'],
  ['3.6', 0.2, 'vrg1', 'Secondary'],
  ['3.6', 0.2, 'vr1r', 'Secondary'],
  ['3.6', 0.2, 'vr1d', 'Secondary'],
  ['3.7', 0.2, 'app0', 'pruned by Argo CD'],
  ['3.7', 0.2, 'decision', 'spoke-1'],
  ['4.1', 0.2, 'pvc1r', 'restoring from S3'],
  ['4.1', 0.2, 'pvc1d', 'restoring from S3'],
  ['4.2', 0.2, 'drpc', 'Relocated · Completed'],
  ['4.2', 0.2, 'vsaA', 'Destination'],
  ['4.2', 0.2, 'vsaB', 'Source'],
  ['4.3', 0.2, 'decision', 'spoke-1 only'],
  ['4.3', 0.2, 'vrg1', 'Primary'],
  ['4.3', 0.2, 'vr1r', 'Primary · replicating'],
  ['4.3', 0.2, 'vr1d', 'Primary · replicating'],
  ['4.4', 0.2, 'pvc1r', 'Bound · csivol-ec5862ac71'],
  ['4.4', 0.2, 'pvc1d', 'Bound · csivol-f756724d1d'],
  ['4.5', 0.2, 'app1', 'Synced · Healthy'],
  ['4.6', 0.2, 'vm1', 'Running · worker-0'],
  ['5.3', 0.2, 'vrg0', 'Secondary'],
  ['5.3', 0.2, 'vr0r', 'removed'],
  ['5.3', 0.2, 'vr0d', 'removed'],
  ['5.3', 0.2, 'vm0', 'removed'],
  ['5.3', 0.2, 'pvc0r', 'removed'],
  ['5.3', 0.2, 'pvc0d', 'removed'],
  ['6.2', 0.2, 'vsaB', 'Source · next sync null'],
  ['6.2', 0.2, 'vsaA', 'Destination · next sync null'],
  ['6.5', 0.2, 'vsaB', 'Source · next 14:13 / 14:11'],
  ['6.5', 0.2, 'vsaA', 'Destination · next 14:13 / 14:11'],
  ['6.6', 0.2, 'vsaB', 'Source · sync every 12m'],
  ['7.1', 0.2, 'drpc', 'Relocated · Completed · PeerReady'],
  ['7.5', 0.2, 'vsaB', 'Source · scheduled'],
];

const BASE: Record<string, string> = {
  drpc: 'FailedOver · Completed',
  policy: 'dr-policy-15m · 900s',
  decision: 'spoke-0',
  appset: 'watches the decision',
  app0: 'Synced · source',
  vrg0: 'Primary',
  vr0r: 'Primary',
  vr0d: 'Primary',
  vm0: 'Running',
  pvc0r: 'Bound',
  pvc0d: 'Bound',
  vrg1: 'Secondary',
  vr1r: 'Secondary',
  vr1d: 'Secondary',
  vm1: 'not running',
  pvc1r: 'no claims',
  pvc1d: 'no claims',
  vsaA: 'Source · copying to VSA-B',
  vsaB: 'Destination',
};

const EXIT_AT: Record<string, string> = {
  app0: '5.3', vr0r: '5.3', vr0d: '5.3', vm0: '5.3', pvc0r: '5.3', pvc0d: '5.3',
};

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = FOCUS[c.id] ?? [];
  const status = (key: string) => {
    let v = BASE[key] ?? '';
    for (const [beat, frac, k, value] of CH) if (k === key && reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac)) v = value;
    return v;
  };
  const focus = (key: string) => (keys.length === 0 || keys.includes(key) ? 1 : 0.08);
  const ch = phase(c.id);
  const afterMove = reached(c.id, '4.2');
  const appear = (key: string) => {
    if (key === 'app1') return reached(c.id, '4.5') ? prog(c.f, -15, 35) : 0;
    return ch === 2 ? prog(c.f, -15, 35) : 1;
  };
  const exit = (key: string) => {
    const at = EXIT_AT[key];
    if (!at || !reached(c.id, at)) return 0;
    return c.id === at ? prog(c.f, 0, 18) : 1;
  };
  return <div style={{position: 'absolute', width: 2480, height: 1380}}>
    <Region b={{x: 70, y: 45, w: 2340, h: 300}} title="HUB · edge36" sub="Ramen and the disaster recovery console" color={C.blue}/>
    <Region b={{x: 70, y: 425, w: 1170, h: 565}} title="SPOKE-0 · edge95" sub={afterMove ? 'old site · standby after the move' : 'current site after the failover'} color={C.spoke0}/>
    <Region b={{x: 1235, y: 425, w: 1175, h: 565}} title="SPOKE-1 · edge97 · PREFERRED" sub={afterMove ? 'preferred site · active after the move' : 'standby before the move'} color={C.spoke1}/>
    <Region b={{x: 70, y: 1040, w: 1170, h: 310}} title="VSA-A · spoke-0 storage" color={C.array}/>
    <Region b={{x: 1235, y: 1040, w: 1175, h: 310}} title="VSA-B · spoke-1 storage" color={C.array}/>
    {Object.entries(NODES).map(([key, n]) => {
      return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role} lines={[n.scope, status(key) || 'recorded configuration']} appear={appear(key)} exit={exit(key)} focus={focus(key)} hl={keys.includes(key) ? 0.25 : 0} color={n.color} detail={Math.max(0, Math.min(1, (c.zoom - .65) / .2))} />;
    })}
    <svg width={2480} height={1380} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs><marker id="tip343" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.orange}/></marker></defs>
      {ch >= 2 ? <g>
        <path d={afterMove ? 'M1820,1305 L1820,1330 L660,1330 L660,1305' : 'M660,1305 L660,1330 L1820,1330 L1820,1305'} fill="none" stroke={C.orange} strokeWidth={5} markerEnd="url(#tip343)"/>
        <circle cx={afterMove ? 1820 - 1160 * ((c.f % 180) / 180) : 660 + 1160 * ((c.f % 180) / 180)} cy={1330} r={9} fill={C.orange}/>
        <rect x={790} y={1304} width={900} height={38} rx={12} fill={C.bg}/>
        <text x={1240} y={1331} textAnchor="middle" fill={C.orange} fontSize={26} fontFamily={sans}>{afterMove ? 'Recorded copy after the move: VSA-B to VSA-A' : 'Recorded copy before the move: VSA-A to VSA-B'}</text>
      </g> : null}
      {c.id === '3.5' ? <g opacity={prog(c.f, c.dur * .15, c.dur * .15 + 25)}>
        <path d="M660,635 L660,665 L1820,665 L1820,635" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#tip343)"/>
        <rect x={955} y={648} width={570} height={34} rx={10} fill={C.bg}/>
        <text x={1240} y={672} textAnchor="middle" fill={C.green} fontSize={21} fontFamily={sans}>final sync before the switch</text>
      </g> : null}
    </svg>
  </div>;
};
