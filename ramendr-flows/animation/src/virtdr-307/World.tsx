import React from 'react';
import {C, mono, sans} from '../theme';
import {Card, Region} from '../components/primitives';
import {prog} from '../lib/anim';

export type Box = [number, number, number, number];
type Node = {kind: string; name: string; role: string; scope: string; box: Box; color: string; nameSize?: number};
export const NODES: Record<string, Node> = {
  drpc: {kind: 'DRPlacementControl', name: 'gitops-vm-protection', role: 'records the recovery decision', scope: 'hub · openshift-dr-ops', box: [120, 100, 620, 170], color: C.orange},
  policy: {kind: 'DRPolicy', name: '2m-vm', role: 'two clusters, two-minute schedule, grouped peer class', scope: 'hub · cluster scope', box: [800, 100, 560, 170], color: C.orange},
  s3: {kind: 'S3 archive', name: 's3profile-ocp-primary-ocs-storagecluster', role: 'stores PV, PVC, VGR and VGRC records', scope: 'hub · object store', box: [1420, 100, 860, 170], color: C.s3, nameSize: 20},
  vrg0: {kind: 'VolumeReplicationGroup', name: 'gitops-vm-protection', role: 'coordinates the primary side', scope: 'ocp-primary · openshift-dr-ops', box: [120, 480, 500, 170], color: C.spoke0},
  vgr0: {kind: 'VolumeGroupReplication', name: 'vgr-b7e3115af7a9714fe9c0857d760dc769-gitops-vm-protection', role: 'one group for eight claims', scope: 'ocp-primary · gitops-vms', box: [680, 480, 460, 190], color: C.amber, nameSize: 17},
  vgrc0: {kind: 'VolumeGroupReplicationContent', name: 'vgrcontent-93d5f65a-e0ed-4b6b-8509-070f0e5f2802', role: 'group handle and volume list', scope: 'ocp-primary · cluster scope', box: [120, 700, 500, 190], color: C.purple, nameSize: 17},
  vr0: {kind: 'VolumeReplication', name: 'vr-93d5f65a-e0ed-4b6b-8509-070f0e5f2802', role: 'one switch for the group', scope: 'ocp-primary · gitops-vms', box: [680, 700, 460, 170], color: C.amber, nameSize: 18},
  pvc0: {kind: 'PersistentVolumeClaim', name: '8 claims · one consistency group', role: 'VM root and data disks', scope: 'ocp-primary · gitops-vms', box: [120, 930, 500, 160], color: C.dim},
  vm0: {kind: 'VirtualMachine', name: '4 virtual machines', role: 'all running on the primary', scope: 'ocp-primary · gitops-vms', box: [680, 930, 460, 160], color: C.green},
  vrg1: {kind: 'VolumeReplicationGroup', name: 'gitops-vm-protection', role: 'restores records, then reports readiness', scope: 'ocp-secondary · openshift-dr-ops', box: [1260, 480, 500, 170], color: C.spoke1},
  vgrc1: {kind: 'VolumeGroupReplicationContent', name: 'vgrcontent-93d5f65a-e0ed-4b6b-8509-070f0e5f2802', role: 'restored with the source group handle', scope: 'ocp-secondary · cluster scope', box: [1820, 480, 460, 190], color: C.purple, nameSize: 17},
  pv1: {kind: 'PersistentVolume', name: '6 volumes · primary handle', role: 'claimRef UID empty, phase Available', scope: 'ocp-secondary · cluster scope', box: [1260, 700, 500, 160], color: C.dim},
  pvc1: {kind: 'PersistentVolumeClaim', name: '8 claims · 6 Lost, 2 Pending', role: 'the restore count never reaches eight', scope: 'ocp-secondary · gitops-vms', box: [1820, 700, 460, 160], color: C.red},
  pvctl: {kind: 'Controller', name: 'persistent volume controller', role: 'binds claims and volumes by UID', scope: 'ocp-secondary · control plane', box: [1260, 930, 500, 160], color: C.blue},
  vm1: {kind: 'VirtualMachine', name: '0 virtual machines', role: 'nothing started on the target', scope: 'ocp-secondary · gitops-vms', box: [1820, 930, 460, 160], color: C.faint},
  odf0: {kind: 'StorageClass', name: 'ocs-storagecluster-ceph-rbd-virtualization', role: 'in-cluster Ceph RBD, no external array', scope: 'ocp-primary · cluster scope', box: [120, 1260, 700, 140], color: C.amber, nameSize: 18},
  odf1: {kind: 'StorageClass', name: 'ocs-storagecluster-ceph-rbd-virtualization', role: 'the replicated images live here', scope: 'ocp-secondary · cluster scope', box: [1260, 1260, 700, 140], color: C.amber, nameSize: 18},
};
export const RECT = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, n.box])) as Record<string, Box>;

const HUB = ['drpc', 'policy', 's3'];
const PRIMARY = ['vrg0', 'vgr0', 'vgrc0', 'vr0', 'pvc0', 'vm0', 'odf0'];
const TARGET = ['vrg1', 'vgrc1', 'pv1', 'pvc1', 'pvctl', 'vm1', 'odf1'];
const ALL = [...HUB, ...PRIMARY, ...TARGET];

const BY_CHAPTER: Record<number, string[]> = {
  0: ALL,
  1: ALL,
  2: PRIMARY,
  3: ['drpc', 'vrg0', 'vrg1', 'vm1'],
  4: ['s3', 'vrg1', 'vgrc1', 'pv1'],
  5: ['vrg1', 'pv1', 'pvc1'],
  6: ['pv1', 'pvc1', 'pvctl'],
  7: ['drpc', 'vrg1', 'pvc1', 'vm1'],
  8: ['vrg1', 'vgrc1', 'pv1', 'pvc1'],
};
export const FOCUS: Record<string, string[]> = {
  '0.1': ['drpc', 'vrg1', 'vm1', 'pvc1'],
  '0.2': ['drpc'],
  '2.2': ['drpc', 'vrg0', 'vrg1'],
  '2.6': ['vrg0', 'vgr0', 'vgrc0', 'vr0'],
  '2.7': ['drpc', 'policy'],
  '2.8': PRIMARY,
  '3.2': ['drpc'],
  '3.3': ['drpc', 'vrg1'],
  '3.4': ['drpc'],
  '3.5': ['vrg1'],
  '3.6': ['drpc', 'vrg1'],
  '4.1': ['s3', 'vrg1'],
  '4.2': ['vrg1'],
  '4.3': ['pv1'],
  '4.4': ['pv1', 's3'],
  '4.5': ['s3', 'pv1'],
  '4.6': ['pv1'],
  '4.7': ['vrg1', 'vgrc1', 's3'],
  '5.2': ['vrg1', 'pvc1'],
  '5.3': ['pvc1'],
  '5.4': ['vrg1', 'pvc1'],
  '5.5': ['pvc1'],
  '5.6': ['pvc1', 'odf1'],
  '6.2': ['pvc1'],
  '6.3': ['pv1', 'pvc1'],
  '6.4': ['pv1', 'pvc1'],
  '6.5': ['pv1', 'pvc1', 'pvctl'],
  '6.6': ['pvc1'],
  '6.7': ['pv1', 'pvc1'],
  '6.8': ['pv1'],
  '7.2': ['vrg1'],
  '7.3': ['vrg1', 'pvc1'],
  '7.4': ['drpc', 'vrg1'],
  '7.5': ['vrg1', 'pvc1', 'vm1'],
  '7.7': ['drpc', 'vrg1', 'pvc1'],
  '8.2': ['s3', 'pvc1'],
  '8.3': ['vgrc1'],
  '8.4': ['s3', 'vgrc1'],
  '8.5': ['drpc'],
  '8.7': ['vrg1', 'vgrc1', 'pv1', 'pvc1'],
  '8.8': ['drpc', 'vrg1'],
};
export const focusFor = (id: string): string[] => FOCUS[id] ?? BY_CHAPTER[Number(id.split('.')[0])] ?? ALL;

export type Ctx = {id: string; f: number; dur: number; zoom: number};
const phase = (id: string) => Number(id.split('.')[0]);
const reached = (id: string, other: string) => {
  const [a, b] = id.split('.').map(Number); const [c, d] = other.split('.').map(Number);
  return a > c || (a === c && b >= d);
};
export const CH: [string, number, string, string][] = [
  ['2.7', 0.2, 'drpc', 'Protected=True · last sync 20:08'],
  ['3.2', 0.2, 'drpc', 'action=Failover · 20:10:43'],
  ['3.3', 0.3, 'vrg1', 'instructed to become Primary'],
  ['3.4', 0.3, 'drpc', 'FailedOver / WaitForReadiness'],
  ['4.2', 0.3, 'vrg1', 'restoring PVs, then PVCs'],
  ['4.6', 0.3, 'pv1', '6 PVs · primary handle'],
  ['5.2', 0.3, 'vrg1', 'restoring claims'],
  ['5.4', 0.3, 'vrg1', 'Total/Restored 8/1'],
  ['5.5', 0.3, 'pvc1', '6 Lost · 2 Pending'],
  ['6.5', 0.3, 'pvctl', 'ClaimMisbound ×6'],
  ['7.2', 0.3, 'vrg1', 'ClusterDataReady=False'],
  ['7.3', 0.3, 'vrg1', 'state Unknown'],
  ['7.7', 0.3, 'drpc', 'waiting forever'],
  ['8.2', 0.3, 's3', '8 PVCs · 6 PVs'],
  ['8.3', 0.3, 'vgrc1', 'source group handle'],
  ['8.5', 0.3, 'drpc', 'stuck · fix in progress'],
];
const DEFAULT: Record<string, string> = {
  vrg0: 'Primary', vrg1: 'desired Primary · restoring', vgrc0: 'source group handle', vgrc1: 'source group handle',
  vr0: 'Primary', pv1: '6 volumes restored', pvc0: '8 claims', pvc1: '8 claims', vm0: '4 running', vm1: 'none',
  odf0: 'source images', odf1: 'replicated images',
};

export const World: React.FC<{c: Ctx}> = ({c}) => {
  const keys = focusFor(c.id);
  const status = (key: string) => {
    let v = DEFAULT[key] ?? '';
    for (const [beat, frac, k, value] of CH) if (k === key && reached(c.id, beat) && (c.id !== beat || c.f > c.dur * frac)) v = value;
    return v;
  };
  const focus = (key: string) => keys.length === 0 || keys.includes(key) ? 1 : 0.08;
  const chapter = phase(c.id);
  const hubOn = keys.some(k => HUB.includes(k));
  const primOn = keys.some(k => PRIMARY.includes(k));
  const targetOn = keys.some(k => TARGET.includes(k));
  const arrow = (from: string, to: string, label: string, color: string, n: number, dashed = false) => {
    const a = RECT[from]; const b = RECT[to];
    const x1 = a[0] + a[2] / 2, x2 = b[0] + b[2] / 2;
    const down = b[1] > a[1]; const y1 = down ? a[1] + a[3] + 14 : a[1] - 12; const y2 = down ? b[1] - 18 : b[1] + b[3] + 10;
    const a0 = prog(c.f, c.dur * (0.12 + n * 0.13), c.dur * (0.12 + n * 0.13) + 25);
    const midY = (y1 + y2) / 2;
    return <g key={label} opacity={a0}>
      <path d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`} fill="none" stroke={color} strokeWidth={4} strokeDasharray={dashed ? '9 9' : undefined} markerEnd="url(#tip307)"/>
      <circle cx={x1 + (x2 - x1) * ((c.f % 150) / 150)} cy={midY} r={6} fill={color}/>
      <rect x={(x1 + x2) / 2 - 245} y={midY - 17} width={490} height={32} rx={10} fill={C.bg}/>
      <text x={(x1 + x2) / 2} y={midY + 6} textAnchor="middle" fill={color} fontSize={20} fontFamily={sans}>{label}</text>
    </g>;
  };
  const on = (id: string) => c.id === id;
  return <div style={{position: 'absolute', width: 2400, height: 1460}}>
    <Region b={{x: 70, y: 45, w: 2260, h: 285}} title="HUB · ACM" sub="decision and records" color={C.blue} opacity={hubOn || primOn || targetOn ? 1 : 0.35}/>
    <Region b={{x: 70, y: 420, w: 1120, h: 700}} title="OCP-PRIMARY" sub="recorded source" color={C.spoke0} opacity={primOn ? 1 : 0.35}/>
    <Region b={{x: 1210, y: 420, w: 1120, h: 700}} title="OCP-SECONDARY" sub={reached(c.id, '7.2') ? 'recorded target · stuck' : 'recorded target'} color={reached(c.id, '7.2') ? C.red : C.spoke1} opacity={targetOn ? 1 : 0.35}/>
    <Region b={{x: 70, y: 1210, w: 1120, h: 210}} title="OCP-PRIMARY STORAGE" sub="ODF Ceph RBD" color={C.array} small opacity={0.3}/>
    <Region b={{x: 1210, y: 1210, w: 1120, h: 210}} title="OCP-SECONDARY STORAGE" sub="ODF Ceph RBD" color={C.array} small opacity={0.3}/>
    {Object.entries(NODES).map(([key, n]) => {
      const s = status(key);
      const appear = chapter === 2 ? prog(c.f, -15, 35) : 1;
      return <Card key={key} x={n.box[0]} y={n.box[1]} w={n.box[2]} kind={n.kind} name={n.name} role={n.role} nameSize={n.nameSize ?? 22} lines={[n.scope, s || 'recorded configuration']} appear={appear} focus={focus(key)} hl={keys.includes(key) ? 0.25 : 0} color={n.color} detail={Math.max(0, Math.min(1, (c.zoom - .65) / .2))}/>;
    })}
    <svg width={2400} height={1460} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      <defs><marker id="tip307" markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={C.cyan}/></marker></defs>
      {on('3.3') ? <g opacity={prog(c.f, 20, 45)}>
        <path d="M740,270 L740,320 L1510,320 L1510,472" fill="none" stroke={C.cyan} strokeWidth={4} markerEnd="url(#tip307)"/>
        <rect x={830} y={292} width={620} height={34} rx={10} fill={C.bg}/><text x={1140} y={316} textAnchor="middle" fill={C.cyan} fontSize={21} fontFamily={sans}>set the target VRG to Primary</text>
      </g> : null}
      {on('4.1') ? <g opacity={prog(c.f, 20, 45)}>
        <path d="M1760,560 L1850,560 L1850,280" fill="none" stroke={C.purple} strokeWidth={4} strokeDasharray="9 9" markerEnd="url(#tip307)"/>
        <rect x={1500} y={330} width={640} height={34} rx={10} fill={C.bg}/><text x={1820} y={354} textAnchor="middle" fill={C.purple} fontSize={21} fontFamily={sans}>reads PV, PVC, VGR and VGRC records</text>
      </g> : null}
      {on('5.2') ? <g opacity={prog(c.f, 20, 45)}>
        <path d="M1510,650 L1510,680 L2050,680 L2050,692" fill="none" stroke={C.cyan} strokeWidth={4} markerEnd="url(#tip307)"/>
        <rect x={1610} y={652} width={600} height={34} rx={10} fill={C.bg}/><text x={1910} y={676} textAnchor="middle" fill={C.cyan} fontSize={21} fontFamily={sans}>restore claims, then wait for binding</text>
      </g> : null}
      {on('6.5') ? <g opacity={prog(c.f, 20, 45)}>
        <path d="M1510,930 L1510,900 L2050,900 L2050,868" fill="none" stroke={C.green} strokeWidth={4} markerEnd="url(#tip307)"/>
        <rect x={1610} y={872} width={520} height={30} rx={10} fill={C.bg}/><text x={1870} y={894} textAnchor="middle" fill={C.green} fontSize={20} fontFamily={sans}>bind decision by UID</text>
      </g> : null}
      {on('7.4') ? <g opacity={prog(c.f, 20, 45)}>
        <path d="M1510,480 L1510,380 L740,380 L740,278" fill="none" stroke={C.red} strokeWidth={4} strokeDasharray="9 9" markerEnd="url(#tip307)"/>
        <rect x={880} y={352} width={520} height={34} rx={10} fill={C.bg}/><text x={1140} y={376} textAnchor="middle" fill={C.red} fontSize={21} fontFamily={sans}>ClusterDataReady=False</text>
      </g> : null}
    </svg>
  </div>;
};
